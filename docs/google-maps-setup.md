# Google Maps production setup

The locator uses the Google Maps JavaScript API through `@googlemaps/js-api-loader`. Geocoding is performed with the Maps JavaScript Geocoding service so the same website-restricted browser key can be used; there is no server credential or unrestricted proxy route.

## Environment variables

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: a client-visible Google Maps browser key.
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`: the public Google cloud-based map style ID required by Advanced Markers.

Both values are required to activate Google Maps. With either value absent—or if loading fails—the locator retains search, results, phone, website, and Get Directions actions in list mode.

### Local setup

Create an untracked `.env.local` in the repository root:

```dotenv
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_restricted_browser_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_public_map_id
```

Restart `next dev` or rebuild after changing either value. Next.js inlines `NEXT_PUBLIC_` values at build time. `.env.local` is ignored by Git and must never be force-added.

### Vercel setup

In Vercel, open **Project Settings → Environment Variables** and add both variables separately for Production and only the Preview environments explicitly approved for map testing. Redeploy after changes because public values are build-time configuration. Do not paste credentials into `vercel.json`, source files, screenshots, tickets, or the generated audit reports.

## Required Google Cloud configuration

Enable and allow only:

- Maps JavaScript API
- Geocoding API

Apply a **Websites** application restriction to the browser key. At minimum, authorize the exact environments in use:

- `https://dealers.upswinggolf.com/*`
- the exact Vercel production and preview domains approved for testing
- `http://localhost:3000/*`
- `http://127.0.0.1:3000/*`
- `http://localhost:3001/*` and `http://127.0.0.1:3001/*` if the documented QA port is used

Use exact HTTPS production hostnames. Do not authorize `*.upswinggolf.com/*` when only `dealers.upswinggolf.com` is required. If Vercel preview testing is necessary, prefer an explicit preview hostname per approved deployment instead of a broad `*.vercel.app/*` wildcard, then remove it after testing.

Remove preview or local referrers when they are no longer needed. Do not use this key for server-side REST calls. Do not add a server key unless a future server workflow has stable egress controls or another secure authentication strategy.

Under **API restrictions**, select **Restrict key** and allow only:

- Maps JavaScript API
- Geocoding API

The Map ID is intentionally public and is not a secret, but it should still be configured through the documented environment variable so environments can use distinct map styles.

## Coordinate activation gate

Geocoding is permitted only for records already marked `verified`; it cannot promote or legitimize a dealer. Compare the returned locality, administrative region, postal code, country, result type, and geometry location type against the verified overlay. `ROOFTOP` and `RANGE_INTERPOLATED` street/premise results may be accepted when address components agree. `GEOMETRIC_CENTER`, `APPROXIMATE`, missing components, or material mismatches require review.

The three retailer-published coordinate pairs remain higher authority and are not overwritten automatically. The current coordinate audit is generated with:

```bash
npm run audit:coordinates
```

Google’s current guidance requires both an application restriction and API restrictions, recommends separate keys for separate applications/platforms, and maps the JavaScript Geocoding service to the Geocoding API restriction: [Google Maps Platform security guidance](https://developers.google.com/maps/api-security-best-practices).

The production site must also provide publicly accessible terms and privacy pages incorporating Google’s applicable terms before launch: [Maps JavaScript API policies](https://developers.google.com/maps/documentation/javascript/policies).

## Runtime behavior

- Advanced markers represent only dealers with reviewed coordinates.
- Bounds recalculate from visible coordinate-bearing results and the user’s location.
- Marker selection highlights and scrolls the corresponding card; card selection updates the marker.
- City, state, ZIP/postal, and address searches are geocoded when Google is configured.
- Retailer-name searches stay lexical.
- Geographic results use 25, 50, or 100 mile filters and sort nearest-first.
