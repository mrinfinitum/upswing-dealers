import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { reviewGoogleCoordinates } from "../lib/dealers/coordinates";
import { dealerEnrichmentProposals } from "../lib/dealers/enrichment-proposals";
import { applyVerifiedEnrichments } from "../lib/dealers/enrichment";
import { googleBrowserGeocodeBatch } from "../lib/dealers/google-geocodes";
import { normalizeDealerRows } from "../lib/dealers/normalize";
import { rawDealerRows } from "../lib/dealers/source";
import { dealerCoordinateApprovals } from "../lib/dealers/coordinate-approvals";

const { dealers } = normalizeDealerRows(rawDealerRows);
const enriched = applyVerifiedEnrichments(dealers, dealerEnrichmentProposals).dealers;
const byId = new Map(enriched.map((dealer) => [dealer.id, dealer]));
const verified = dealerEnrichmentProposals.filter((proposal) => proposal.verificationStatus === "verified");
const reviewedGoogle = reviewGoogleCoordinates(enriched, googleBrowserGeocodeBatch);
const googleById = new Map(reviewedGoogle.map((record) => [record.dealerId, record]));
const approvalById = new Map(dealerCoordinateApprovals.map((approval) => [approval.dealerId, approval]));
const officialCoordinateCount = verified.filter((proposal) => proposal.proposed.latitude !== undefined && proposal.proposed.longitude !== undefined).length;
const acceptedGoogleCount = reviewedGoogle.filter((record) => record.finalStatus === "verified").length;
const strictNeedsReviewCount = reviewedGoogle.filter((record) => record.finalStatus === "needs-review").length;
const needsReviewCount = reviewedGoogle.filter((record) => record.finalStatus === "needs-review" && !approvalById.has(record.dealerId)).length;
const failedCount = reviewedGoogle.filter((record) => record.finalStatus === "failed").length;
const cell = (value: unknown) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");

const rows = verified.map((proposal) => {
  const dealer = byId.get(proposal.dealerId);
  if (!dealer) throw new Error(`Unknown dealer ID: ${proposal.dealerId}`);
  const value = proposal.proposed;
  const verifiedAddress = [value.addressLine1, value.addressLine2, value.city, value.stateProvince, value.postalCode, value.country].filter(Boolean).join(", ");
  const hasOfficialCoordinates = value.latitude !== undefined && value.longitude !== undefined;

  if (hasOfficialCoordinates) {
    const coordinateSource = proposal.sources.find((source) => source.fields.includes("latitude"));
    return `| \`${proposal.dealerId}\` | ${cell(dealer.name)} | ${cell(verifiedAddress)} | Not geocoded; retailer coordinate retained | ${cell(value.latitude)} | ${cell(value.longitude)} | ${coordinateSource ? `[${cell(coordinateSource.label)}](${coordinateSource.url})` : "Official retailer location data"} | Retailer-published structured coordinate | Existing higher-authority coordinate retained without replacement. | **verified** |`;
  }

  const approval = approvalById.get(proposal.dealerId);
  if (approval) {
    const sources = approval.sourceUrls.map((url, index) => `[${index === 0 ? "Retailer page" : "Coordinate reference"}](${url})`).join(" · ");
    return `| \`${proposal.dealerId}\` | ${cell(dealer.name)} | ${cell(approval.authoritativeAddress)} | ${cell(approval.googleFormattedAddress)} | ${cell(approval.coordinates.latitude)} | ${cell(approval.coordinates.longitude)} | ${sources} | ${cell(approval.precisionResultType)} | **${cell(approval.classification)}.** ${cell(approval.reason)} | **verified** |`;
  }

  const record = googleById.get(proposal.dealerId);
  if (!record) {
    return `| \`${proposal.dealerId}\` | ${cell(dealer.name)} | ${cell(verifiedAddress)} | — | — | — | Google Maps JavaScript Geocoder | — | No browser geocode record | **failed** |`;
  }
  const precision = [record.locationType, ...(record.resultTypes ?? [])].filter(Boolean).join("; ");
  return `| \`${proposal.dealerId}\` | ${cell(dealer.name)} | ${cell(verifiedAddress)} | ${cell(record.formattedAddress)} | ${cell(record.coordinates?.latitude)} | ${cell(record.coordinates?.longitude)} | Google Maps JavaScript Geocoder (browser-side) | ${cell(precision)} | ${cell(record.discrepancies.join(" ") || "No coordinate discrepancy")} | **${record.finalStatus}** |`;
}).join("\n");

const report = `# Dealer Coordinate Audit

Generated: ${new Date().toISOString()}

Coordinates are evaluated only for the ${verified.length} records already independently verified through authoritative retailer evidence. Geocoding never establishes dealer legitimacy. The ${officialCoordinateCount} original retailer-published coordinates remain higher-authority and were not sent to or replaced by Google. Raw browser-geocoder evidence is preserved in \`reports/google-browser-geocodes.json\`.

The automatic rules still classify ${strictNeedsReviewCount} Google responses as \`needs-review\`; no precision or component rule was relaxed. Each of those records was re-opened against the current retailer page and resolved through an explicit approval in \`lib/dealers/coordinate-approvals.ts\`. Approvals use retailer-published structured coordinates, retailer-owned Get Directions links to a specific Google Place, or—in the SCHEELS case—a unique rooftop storefront retry tied to the retailer's exact map-linked address.

| Metric | Count |
| --- | ---: |
| Verified public dealers | ${verified.length} |
| Verified coordinates | ${officialCoordinateCount + acceptedGoogleCount + dealerCoordinateApprovals.length} |
| Original retailer-published coordinates retained | ${officialCoordinateCount} |
| Automatically accepted Google coordinates | ${acceptedGoogleCount} |
| Explicitly approved review coordinates | ${dealerCoordinateApprovals.length} |
| Strict-rule flags reviewed | ${strictNeedsReviewCount} |
| Coordinates still needing review | ${needsReviewCount} |
| Failed Google geocodes | ${failedCount} |
| Excluded non-verified source records | ${dealers.length - verified.length} |

| Dealer ID | Retailer | Authoritative address | Google formatted address | Latitude | Longitude | Coordinate source(s) | Precision/result type | Discrepancy and resolution | Final coordinate status |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
${rows}
`;

const output = resolve(process.cwd(), "reports/dealer-coordinate-audit.md");
writeFileSync(output, report);
console.log(`Wrote ${output}`);
console.log(JSON.stringify({
  verifiedDealers: verified.length,
  verifiedCoordinates: officialCoordinateCount + acceptedGoogleCount + dealerCoordinateApprovals.length,
  retailerCoordinates: officialCoordinateCount,
  acceptedGoogle: acceptedGoogleCount,
  approvedAfterReview: dealerCoordinateApprovals.length,
  strictRuleFlags: strictNeedsReviewCount,
  needsReview: needsReviewCount,
  failedGeocodes: failedCount,
}));
