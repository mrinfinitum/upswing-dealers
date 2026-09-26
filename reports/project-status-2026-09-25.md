# Project status — September 25, 2026

Reviewed baseline: `3e796563ad07cb863eed767bf8f4d50a2e509b4d` on `main`.

## Overall status

The project builds successfully and all existing automated suites pass. A targeted source review identified two dealer-portal redirect defects that the existing tests do not exercise. These findings should be addressed before treating portal access edge cases as validated. This review changes documentation only.

The application includes a public dealer locator with Google Maps and list fallback, Supabase-backed dealer administration, a permission-controlled dealer portal, and an authenticated Dropbox image gallery. Supabase supplies public dealer data when configured; query failures fall back to the verified workbook dataset. The workbook checks confirm 71 preserved records and 70 publishable records; those are fixture counts, not a live database inventory.

## Findings

### P2 — Dealers without Overview permission enter a redirect loop

- Evidence: `lib/portal/auth.ts:64`, `app/partner/(protected)/page.tsx:6`, `components/admin/dealer-access-forms.tsx:14`, and `app/admin/(protected)/users/actions.ts:30`.
- Administrators can enable Locations or Brand without enabling Overview (`dashboard`). The authorization guard redirects any disallowed page to `/partner?denied=1`, but that destination itself requires `dashboard` permission.
- Result: a valid dealer without Overview permission is redirected repeatedly to the same denied destination, including after login, which always lands on `/partner`.
- Suggested follow-up: use a landing page that every active dealer can access, or choose an explicitly permitted destination. Add a behavioral test for a dealer with only Locations or Brand permission.

### P2 — Existing sessions for inactive dealers bounce between login and portal

- Evidence: `lib/supabase/proxy.ts:61`, `lib/portal/auth.ts:38`, `lib/portal/auth.ts:49`, and `lib/portal/auth.ts:63`.
- The portal guard rejects inactive profiles, missing active memberships, and memberships without active organizations. It redirects those sessions to `/partner/login`.
- The proxy redirects any session with a signed `dealer` role from `/partner/login` back to `/partner`, without checking whether that session still has usable dealer access.
- Result: deactivating a dealer's profile or last usable membership while their session remains valid can prevent them from reaching a stable login or access-denied page.
- Suggested follow-up: let rejected dealer sessions reach a stable access-denied/sign-out flow, and test deactivation while signed in.

Both findings follow from the source control flow. They were not reproduced against authenticated live accounts; no user accounts, memberships, or database records were changed for this review.

### P3 — Architecture documentation describes superseded behavior

- `README.md:30` describes Supabase as a future repository replacement, although `lib/dealers/repository.ts` already selects Supabase when configured.
- `docs/architecture.md:24` describes a location-change approval queue, although `supabase/migrations/202608170002_remove_location_change_requests.sql` removes the underlying table and the README describes the portal as read-only.
- Follow-up: update the architecture narrative to match the current repository and portal behavior.

## Validation

Environment: Node `v26.8.2`, npm `12.1.0`, installed Next.js `16.3.1`. Read the installed Next.js CLI guide before running the production lifecycle commands.

| Check | Result |
| --- | --- |
| `npm test` | Passed Dropbox, admin, portal, and Phase 2 suites |
| `npm run lint` | Passed |
| `npm run build` | Passed compilation, TypeScript, and generation of 23 static pages |
| `npm run typecheck` | Passed after the build |
| `npm run scan:credentials` | Passed; no configured server-secret values or restricted credential patterns found by the scanner |
| Local production HTTP smoke checks | Passed all 11 route checks and the public heading assertion |
| `git diff --check` | Passed before report creation |
| `git push --dry-run origin main` | Passed; remote was already up to date at the reviewed baseline |

The production smoke checks used `next start` on loopback port 3107. `/`, both login pages, an email logo asset, `robots.txt`, and `sitemap.xml` returned 200. Anonymous requests to `/admin`, `/partner`, and `/image-gallery` redirected to their respective login pages. Both Dropbox image endpoints returned 401 without authentication.

The credential scan inspects source and generated build deliverables; it does not prove that dynamically rendered responses are free of credentials. The protected-surface suites include source-text assertions and are not substitutes for authenticated browser or database integration tests.

Not validated: responsive browser QA, live Google Maps interactions, authenticated admin/dealer workflows, authenticated Dropbox operations, deployed migration state, and production deployment health. No tracked GitHub Actions workflows were found under `.github`.

## Git handoff

Remote: `https://github.com/mrinfinitum/upswing-dealers.git`.

At review start, local `main` and the remote branch both pointed to the reviewed baseline, with no tracked modifications. The existing untracked directory `outputs/dealer-reconciliation-2026-08-25/` contains three reconciliation JSON reports and is excluded from this status-report commit.

This report is the sole intended file in the actual push test. The final task response records the resulting commit and confirms whether GitHub accepted it; deployment verification is outside this review.
