# Phase 1 architecture

## Rendering boundaries

- `app/page.tsx` remains a server component. It loads dealers through the repository boundary and renders the branded page shell.
- The header and footer are server-rendered. Mobile navigation uses native `details`/`summary` behavior.
- `components/dealer-locator/dealer-locator.tsx` is the narrow client boundary for search, selection, geolocation, reset, empty states, and future distance sorting.
- Dealer cards, result list, and fallback map are separate components rather than one monolithic locator.

## Data flow

```text
Workbook rows → raw source records → normalizer → DealerRepository → server page → locator client
```

Every normalized record carries workbook, sheet, row, and raw values. A future Supabase repository can implement the same `DealerRepository` interface without changing presentation components. A future XLSX/CSV parser can emit the same `RawDealerRow` shape and reuse the normalizer.

The typed model supports addresses, coordinates, contact fields, category, active status, and notes, but Phase 1 only populates fields supported by the workbook.

## Search and geolocation

- Current offline search matches dealer name, city, US state abbreviation/full name, and country.
- Empty query returns all current rows. Clear resets text, selection, geolocation status, and mobile expansion.
- Postal-code-shaped queries receive a specific source-data explanation instead of a misleading generic failure.
- Browser geolocation is optional and only requested after a user action. The app remains fully usable without permission.
- `lib/geo/distance.ts` provides Haversine distance and nearest-first sorting. It becomes active automatically when dealer coordinates are present.

## Map strategy

`lib/maps/provider.ts` defines the shared provider props and adapter metadata for Mapbox, Google Maps, or the fallback. Phase 1 intentionally ships the fallback because there are no credentials and no authoritative dealer coordinates. The fallback is labeled as list mode, stays useful when a vendor fails, and never implies inaccurate pin placement.

To activate a real provider later:

1. Choose Mapbox or Google Maps.
2. Add a domain-restricted browser token/key. Keep geocoding or administrative credentials server-only.
3. Supply verified dealer street addresses and coordinates.
4. Implement the provider adapter behind the existing boundary.
5. Add provider load/error handling while preserving the list fallback.

## Remaining decisions

- Final production hostname and `NEXT_PUBLIC_SITE_URL`.
- Mapbox versus Google Maps and associated billing/usage limits.
- Authoritative location-enrichment process and who owns corrections.
- Whether postal/address geocoding is performed server-side and which provider owns it.
- Whether dealer detail links should eventually point to UpSwing SEO pages, dealer sites, or both.
