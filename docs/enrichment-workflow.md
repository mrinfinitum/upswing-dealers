# Dealer enrichment workflow

The Phase 1 workbook remains the immutable authority for the original 71 dealer rows in `lib/dealers/source.ts`. Enrichment is a separate overlay keyed by the stable normalized dealer ID.

## Review flow

1. Find a candidate on an official retailer location page. Record only fields that the page explicitly supports.
2. Add a proposal to `lib/dealers/enrichment-proposals.ts` with its source URL, retrieval date, supported fields, discrepancies, confidence, and verification status.
3. Use `needs-review` when the city, region, retailer identity, or candidate uniqueness does not agree exactly. Never choose the closest-looking candidate.
4. Run `npm run audit:enrichment` and review `reports/dealer-enrichment-audit.md` beside the source.
5. A human reviewer may change a proposal to `verified` only after resolving discrepancies. The repository merge function ignores every other status.
6. Obtain coordinates from a traceable geocoder response for the verified street address. Record the geocoding source and the `latitude` and `longitude` fields together. A partial coordinate pair fails validation.

`npm run geocode:input` emits only the verified, coordinate-pending addresses and asserts the expected batch size before a browser geocoding run. It never reads or emits credentials.

Changing or removing an original workbook value is not part of enrichment. Corrections remain visible as a discrepancy between the original record and proposed overlay.

## Confidence guidance

- `high`: one unique official retailer record exactly matches retailer, city, region, and country.
- `medium`: plausible candidate with a documented naming or municipal-boundary discrepancy.
- `low`: no unique matching candidate or a material source conflict.

Confidence does not publish a record; only `verificationStatus: "verified"` does.

## Current audit

All 71 source rows are classified: 70 are `verified` and Preston, Washington is `needs-review`. The public repository exposes only the 70 verified records. Three retailer-published structured coordinates remain the higher-authority source. Google returned results for all 67 remaining verified addresses: 51 passed the strict component and precision rules, 16 remain `needs-review`, and none failed. The 16 review coordinates are not merged or mapped. Run `npm run audit:coordinates` for the complete coordinate-readiness report.
