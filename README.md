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

The authenticated `/admin` hub manages Supabase dealer records without changing the approved public locator UI. Its account menu links to the administrator profile and central dashboard, while the dashboard provides access to locations, requests, and one combined Users section. At `/admin/users`, administrators can manage dealer organizations, search and filter all accounts, invite either UpSwing administrators or dealer admins, and assign dealer organizations and portal-page permissions. Apply the migration and import, then provision the first admin-role Supabase Auth user by following `docs/supabase-admin.md`.

## Dealer partner portal

The no-index `/partner` area gives limited `dealer` users access only to assigned organizations and explicitly enabled pages. Phase 1 of the portal includes an overview, assigned-location review and change requests, plus an UpSwing brand standards/download page. Administrators manage invitations, dealer organizations, memberships, and page permissions in the combined `/admin/users` section; submitted location changes are reviewed at `/admin/requests`. See `docs/dealer-portal.md`.
