# UpSwing Dealer Locator

A standalone Next.js dealer locator for UpSwing Golf. The application is designed for Vercel and links back to the canonical Shopify storefront; it does not embed or reproduce Shopify commerce.

## Local development

```bash
npm install
npm run dev
```

Quality commands:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:phase2
npm run test:admin
npm run audit:enrichment
npm run audit:coordinates
```

The responsive QA runner in `scripts/qa-responsive.mjs` expects a local app on port 3001 and a Chrome DevTools endpoint on port 9223.

## Data and architecture

- `lib/dealers/source.ts` preserves the workbook rows and provenance.
- `lib/dealers/normalize.ts` converts raw rows into the typed `Dealer` model.
- `lib/dealers/repository.ts` is the data-access boundary that can later be replaced by Supabase.
- `supabase/migrations/` and the authenticated `/admin` route provide RLS-protected location management; see `docs/supabase-admin.md`.
- `lib/dealers/enrichment-proposals.ts` is the reviewed enrichment overlay. Only `verified` proposals merge into public data.
- `reports/google-browser-geocodes.json` preserves the browser-side Google response for each of the 67 verified addresses that lacked retailer coordinates; only records passing the coordinate review rules are merged.
- `lib/maps/provider.ts` is the provider boundary. Google Maps activates only when both public configuration values are present; otherwise the accessible list-mode fallback remains active.
- `lib/geo/distance.ts` implements Haversine distance, nearest-first sorting, and geographic radius filtering for verified coordinates.

See `docs/brand-audit.md`, `docs/dealer-import-audit.md`, `docs/enrichment-workflow.md`, `docs/google-maps-setup.md`, and `docs/architecture.md` for the discovery record and remaining decisions.

Current Phase 2 coordinate status: 70 approved coordinates, including 3 retailer-published coordinates retained as higher-authority evidence, and zero failed geocodes. All 70 independently verified dealers remain public; Preston, Washington remains excluded.

## Dealer administration

The authenticated `/admin` hub manages Supabase dealer records without changing the approved public locator UI. Its primary navigation links to Dealers, Users, and the public locator, while the account menu provides profile and session controls. Dealers opens a retailer-level directory and scopes the next screen to that dealer’s locations. At `/admin/users`, administrators can search and filter all accounts, directly create UpSwing administrators and dealer users, delete accounts, and assign dealer organizations and portal-page permissions. Apply the migrations and import, then provision the first admin-role Supabase Auth user by following `docs/supabase-admin.md`.

The Add Dealer workflow supports a single location or an all-or-nothing batch upload of up to 500 CSV/XLSX rows. A protected CSV template is downloadable from the batch screen. Batch records are always created as unverified with no coordinates; administrators must review each authoritative address before verification and geographic publication. Legacy `.xls` files must be saved as `.xlsx` or CSV before upload.

## Dealer partner portal

The no-index `/partner` area gives limited `dealer` users read-only access to assigned locations and explicitly enabled pages, plus an UpSwing brand standards/download page. Administrators manage accounts, memberships, and page permissions in `/admin/users`. See `docs/dealer-portal.md`.
