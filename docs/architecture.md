# Architecture

## Rendering boundaries

- `app/page.tsx` remains a server component. It loads dealers through the repository boundary and renders the branded page shell.
- The header and footer are server-rendered. Mobile navigation uses native `details`/`summary` behavior.
- `components/dealer-locator/dealer-locator.tsx` is the client boundary for search, selection, geolocation, radius filtering, and empty/error states.
- Dealer cards, result list, Google map, and fallback map are separate components rather than one monolithic locator.

## Data flow

```text
Workbook rows → raw source records → normalizer → verified enrichment overlay → reviewed coordinate overlay → Supabase import ┐
Admin edits, CSV/XLSX batch uploads, reviewed dealer import scripts ───────────────────────────────────────────────────────────┴→ Supabase dealers → DealerRepository → server page → locator client
```

Every workbook-derived record carries workbook, sheet, row, and raw values; admin-created and batch-uploaded records carry their own provenance. The Supabase repository implements the `DealerRepository` interface used by the presentation components. If Supabase is not configured or the query fails, the workbook repository serves the 70 verified fixture records instead. A valid empty response from Supabase is shown as empty; it is not replaced with workbook rows.

## Administration and persistence

`/admin` is a separate, no-index application surface using Supabase cookie authentication. Postgres Row Level Security is authoritative: anonymous access is limited to public columns on active, verified dealers, while signed JWT claims with protected `app_metadata.role = "admin"` can manage all rows. Proxy refreshes sessions and improves redirects, but every mutation verifies the signed claims again in its Server Action.

The deterministic import upserts all 71 preserved records by stable ID, including Preston as non-public. Admin edits retain imported provenance and evidence; admin-created records receive explicit `Admin` provenance rather than fabricated workbook attribution. The dealer category (`dealer_type`) field was removed by `202608250001_remove_dealer_type.sql`.

`/partner` is a separate no-index dealer surface. A protected `dealer` role is connected to one or more `dealer_organizations` through memberships. Every membership has an explicit page-permission array; organizations own their allowed location set. Dealers never receive direct access to the full `dealers` row. `get_dealer_portal_locations()` returns only approved operational fields after checking the signed user and active membership. The portal is read-only. Dealers cannot submit location changes, and the earlier change-request queue was removed by `202608170002_remove_location_change_requests.sql`.

Portal guards never redirect a dealer to a page they cannot open. A dealer without Overview access lands on their first permitted page (Locations, then Brand, then the shared image gallery). If a signed-in dealer loses usable access (inactive profile, no active membership, or only inactive organizations), they are sent to `/partner/access-ended`. That Route Handler signs them out and returns them to sign-in with an explanation. The redirect goes through a Route Handler because Server Components cannot clear session cookies.

`/image-gallery` is shared by administrators and active dealers. Dropbox remains the image source of truth; Supabase stores only the administrator-managed category catalog and category assignments (`202608170003`–`202608170005`). See `docs/dropbox-gallery.md`.

The typed model supports addresses, coordinates, contact fields, active status, notes, verification status, and enrichment and coordinate evidence. Only source-supported fields are populated.

## Search and geolocation

- Offline search matches dealer name, verified address/postal data, city, US state abbreviation/full name, and country.
- Empty query returns all current rows. Clear resets text, selection, geolocation status, and mobile expansion.
- With Google configured, address, ZIP/postal, city, and state searches are geocoded. Retailer and country searches remain lexical.
- Browser geolocation is optional and only requested after a user action. The app remains fully usable without permission.
- `lib/geo/distance.ts` provides Haversine distance, nearest-first sorting, and 25/50/100-mile filtering. These activate automatically when verified dealer coordinates are present.

## Map strategy

`lib/maps/provider.ts` selects Google Maps or the fallback without leaking Google concepts into the repository/data layer. Google Maps uses Advanced Markers, visible-result bounds, marker/card synchronization, and client-side geocoding. The list-mode fallback remains usable if configuration is absent, loading fails, or authorization is rejected.

## Remaining decisions

- Production canonical hostname is `https://dealers.upswinggolf.com`; `NEXT_PUBLIC_SITE_URL` should match it in every deployed environment.
- Google Maps billing alerts, quotas, restricted production key, and map style ID.
- Who owns human review of enrichment proposals and ongoing retailer changes.
- Confirming that every migration in `supabase/migrations/` has been applied to production.
- Public terms and privacy URLs required for Google Maps production use.
- Whether dealer detail links should eventually point to UpSwing SEO pages, dealer sites, or both.

## Enrichment and maps

`source.ts` remains unchanged. `enrichment-proposals.ts` records independently sourced proposals, while `enrichment.ts` validates and merges only records explicitly marked `verified`. Browser-side Google results are preserved separately in `reports/google-browser-geocodes.json`; `coordinates.ts` applies only results that pass `geocode-review.ts`. The generated audits retain all 71 originals, proposed changes, evidence, confidence, status, precision, and discrepancies.

The locator receives a `MapConfiguration` from the server component. Google-specific loading, markers, and geocoding are isolated under `lib/maps` and `google-map.tsx`; the locator state consumes only coordinates and provider-neutral dealer records. Missing or failed map configuration falls through to the existing list-mode panel.

After the initial import, administrators add coordinates from `/admin/dealers` with Sync Map Data. The authorized browser geocodes each address, and the Server Action stores a result only when exactly one candidate passes `geocode-review.ts`. Other results are saved as `needs-review` or `failed` coordinate evidence and appear in `/admin/dealers/map-review`. An administrator can approve the proposed position there, and it is then recorded as a manual coordinate review.

## Security hardening

- **Sign-in:** there is one sign-in, at `/`, protected by Cloudflare Turnstile. `/admin/login` and `/partner/login` redirect there. Sign-ins reach Supabase from Vercel's servers, so Supabase's per-IP limits can't tell visitors apart. Turnstile is what stops scripted password guessing.
- **Admin two-step verification:** administrators must verify an authenticator-app code (TOTP) after their password. Only an `aal2` session counts as admin:
  - `getAdminIdentity()`, `requireAdmin()`, and the proxy all check for `aal2`. A password-only admin session is sent to `/admin/mfa`, which handles first-time setup and the code check.
  - Migration `202611040001_require_admin_mfa.sql` makes `is_dealer_admin()`, and therefore every admin RLS policy, require `aal2` too.
  - Lost phone: another admin resets it from `/admin/users` ("Reset 2-step"). If no admin can sign in, run `npx tsx --env-file=.env.local scripts/reset-admin-mfa.ts <email> --apply`.
  - Admin password resets ask for the authenticator code, because Supabase only lets an `aal2` session change the password on an account with MFA.
- **Headers:** `next.config.ts` sets a Content Security Policy on every response, plus HSTS, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy, Permissions-Policy, and COOP. It also turns off `X-Powered-By`.
  - The CSP allows only Supabase, Google Maps, and Turnstile.
  - Add new third-party origins there, or the browser will block them.
- **Bot checks:** `components/auth/turnstile-widget.tsx` renders the Turnstile widget explicitly, so it also works after client-side navigation.
- **Authorization:** every Server Action calls `requireAdmin()` or `requireDealerPortal()` before reading input. The exceptions are sign-in, password reset, and the dealer application, which are protected by Turnstile.
- **Dependencies:** keep `next` current. Run `npm audit --omit=dev` before each release.
