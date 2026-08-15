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
```

The responsive QA runner in `scripts/qa-responsive.mjs` expects a local app on port 3001 and a Chrome DevTools endpoint on port 9223.

## Data and architecture

- `lib/dealers/source.ts` preserves the workbook rows and provenance.
- `lib/dealers/normalize.ts` converts raw rows into the typed `Dealer` model.
- `lib/dealers/repository.ts` is the data-access boundary that can later be replaced by Supabase.
- `lib/maps/provider.ts` is the map-provider contract; Phase 1 uses a no-credential fallback.
- `lib/geo/distance.ts` supports nearest-first sorting as soon as verified coordinates are supplied.

See `docs/brand-audit.md`, `docs/dealer-import-audit.md`, and `docs/architecture.md` for the discovery record and remaining decisions.
