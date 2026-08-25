# Phase 1 and 2 architecture

## Rendering boundaries

- `app/page.tsx` remains a server component. It loads dealers through the repository boundary and renders the branded page shell.
- The header and footer are server-rendered. Mobile navigation uses native `details`/`summary` behavior.
- `components/dealer-locator/dealer-locator.tsx` is the client boundary for search, selection, geolocation, radius filtering, and empty/error states.
- Dealer cards, result list, Google map, and fallback map are separate components rather than one monolithic locator.

## Data flow

```text
Workbook rows → raw source records → normalizer → verified enrichment overlay → reviewed coordinate overlay → Supabase import → DealerRepository → server page → locator client
```

Every normalized record carries workbook, sheet, row, and raw values. The Supabase repository implements the same `DealerRepository` interface without changing presentation components; a workbook repository remains the failure-safe fallback. A future XLSX/CSV parser can emit the same `RawDealerRow` shape and reuse the normalizer.

## Administration and persistence

`/admin` is a separate, no-index application surface using Supabase cookie authentication. Postgres Row Level Security is authoritative: anonymous access is limited to public columns on active, verified dealers, while signed JWT claims with protected `app_metadata.role = "admin"` can manage all rows. Proxy refreshes sessions and improves redirects, but every mutation verifies the signed claims again in its Server Action.

The deterministic import upserts all 71 preserved records by stable ID, including Preston as non-public. Admin edits retain imported provenance and evidence; admin-created records receive explicit `Admin` provenance rather than fabricated workbook attribution.

`/partner` is a separate no-index dealer surface. A protected `dealer` role is connected to one or more `dealer_organizations` through memberships. Every membership has an explicit page-permission array; organizations own their allowed location set. Dealers never receive direct access to the full `dealers` row. `get_dealer_portal_locations()` returns only approved operational fields after checking the signed user and active membership. Location edits enter an approval queue rather than mutating verified public records or coordinates directly.

The typed model supports addresses, coordinates, contact fields, active status, notes, verification status, and enrichment evidence. Only source-supported fields are populated.

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
- Applying the Supabase migrations/import, provisioning the first admin-role user, and inviting the initial PGA TOUR Superstore dealer contact.
- Public terms and privacy URLs required for Google Maps production use.
- Whether dealer detail links should eventually point to UpSwing SEO pages, dealer sites, or both.

## Phase 2 enrichment and maps

`source.ts` remains unchanged. `enrichment-proposals.ts` records independently sourced proposals, while `enrichment.ts` validates and merges only records explicitly marked `verified`. Browser-side Google results are preserved separately in `reports/google-browser-geocodes.json`; `coordinates.ts` applies only results that pass `geocode-review.ts`. The generated audits retain all 71 originals, proposed changes, evidence, confidence, status, precision, and discrepancies.

The locator receives a `MapConfiguration` from the server component. Google-specific loading, markers, and geocoding are isolated under `lib/maps` and `google-map.tsx`; the locator state consumes only coordinates and provider-neutral dealer records. Missing or failed map configuration falls through to the existing list-mode panel.
