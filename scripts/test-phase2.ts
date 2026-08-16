import assert from "node:assert/strict";
import { applyVerifiedEnrichments, validateEnrichmentProposals } from "../lib/dealers/enrichment";
import { dealerEnrichmentProposals } from "../lib/dealers/enrichment-proposals";
import { normalizeDealerRows } from "../lib/dealers/normalize";
import { searchDealers } from "../lib/dealers/search";
import { rawDealerRows } from "../lib/dealers/source";
import { getMappableDealers } from "../lib/maps/markers";
import { dealersWithinRadius, distanceMiles } from "../lib/geo/distance";
import { reviewGeocodeCandidate } from "../lib/geo/geocode-review";
import { applyVerifiedGoogleCoordinates, reviewGoogleCoordinates, validateCoordinateApprovals } from "../lib/dealers/coordinates";
import { googleBrowserGeocodeBatch } from "../lib/dealers/google-geocodes";
import { dealerCoordinateApprovals } from "../lib/dealers/coordinate-approvals";
import type { Dealer } from "../types/dealer";

const { dealers } = normalizeDealerRows(rawDealerRows);
assert.equal(rawDealerRows.length, 71, "The source dataset must retain 71 rows");
assert.equal(dealers.length, 71, "Normalization must retain every source row");
assert.deepEqual(validateEnrichmentProposals(dealers, dealerEnrichmentProposals), []);

const { dealers: enriched, ignored } = applyVerifiedEnrichments(dealers, dealerEnrichmentProposals);
assert.equal(enriched.length, 71);
assert.equal(dealerEnrichmentProposals.length, 71, "Every source record must be classified");
assert.equal(enriched.filter((dealer) => dealer.verificationStatus === "verified").length, 70);
assert.equal(ignored.length, 1, "Needs-review records must not merge");
assert.equal(enriched.find((dealer) => dealer.id.includes("preston"))?.addressLine1, undefined);
assert.equal(enriched.find((dealer) => dealer.id.includes("woodlands"))?.city, "Shenandoah");
assert.equal(enriched.filter((dealer) => dealer.coordinates).length, 3);
assert.equal(enriched.find((dealer) => dealer.id.includes("roswell"))?.postalCode, "30076-2738");
const publicDealers = enriched.filter((dealer) => dealer.verificationStatus === "verified");
assert.equal(publicDealers.length, 70);
const reviewedCoordinates = reviewGoogleCoordinates(enriched, googleBrowserGeocodeBatch);
assert.equal(reviewedCoordinates.length, 67);
assert.equal(reviewedCoordinates.filter((record) => record.finalStatus === "verified").length, 51);
assert.equal(reviewedCoordinates.filter((record) => record.finalStatus === "needs-review").length, 16);
assert.equal(reviewedCoordinates.filter((record) => record.finalStatus === "failed").length, 0);
assert.equal(dealerCoordinateApprovals.length, 16);
assert.deepEqual(validateCoordinateApprovals(enriched, googleBrowserGeocodeBatch), []);
const mappedPublicDealers = applyVerifiedGoogleCoordinates(publicDealers, googleBrowserGeocodeBatch);
assert.equal(mappedPublicDealers.filter((dealer) => dealer.coordinates).length, 70);
assert.equal(mappedPublicDealers.find((dealer) => dealer.id.includes("preston")), undefined);
assert.deepEqual(mappedPublicDealers.find((dealer) => dealer.id === "club-champion-shenandoah-tx-united-states")?.coordinates, { latitude: 30.181235, longitude: -95.45104 });
assert.deepEqual(mappedPublicDealers.find((dealer) => dealer.id === "club-champion-alexandria-australia")?.coordinates, { latitude: -33.9149398, longitude: 151.195816 });
assert.deepEqual(mappedPublicDealers.find((dealer) => dealer.id === "club-champion-eagle-farm-australia")?.coordinates, { latitude: -27.4312944, longitude: 153.0835237 });
assert.deepEqual(mappedPublicDealers.find((dealer) => dealer.id === "pga-tour-superstore-austin-tx-united-states")?.coordinates, { latitude: 30.390129, longitude: -97.732619 });
assert.deepEqual(mappedPublicDealers.find((dealer) => dealer.id === "club-champion-west-long-branch-nj-united-states")?.coordinates, { latitude: 40.2922565, longitude: -74.0348778 });
assert.deepEqual(mappedPublicDealers.find((dealer) => dealer.id === "club-champion-basingstoke-united-kingdom")?.coordinates, { latitude: 51.278271, longitude: -1.106974 });
assert.deepEqual(getMappableDealers(mappedPublicDealers).map((dealer) => dealer.id), mappedPublicDealers.filter((dealer) => dealer.coordinates).map((dealer) => dealer.id), "Map markers must exactly match coordinate-bearing visible results");
assert.equal(searchDealers(publicDealers, "PGA TOUR").length, 14, "Only verified public retailer records may be searched");
assert.equal(searchDealers(enriched, "Australia").length, 4, "Country search must remain available");
assert.equal(searchDealers(enriched, "1005 Holcomb").length, 1, "Verified address search must work");
assert.equal(searchDealers(publicDealers, "Tulsa OK").length, 1);
assert.equal(searchDealers(publicDealers, "Austin TX").length, 2);
assert.equal(searchDealers(publicDealers, "Chicago IL").length, 1);
assert.equal(searchDealers(publicDealers, "Greenwood Village CO").length, 1);
assert.equal(searchDealers(publicDealers, "Shenandoah TX").length, 2);
assert.equal(searchDealers(publicDealers, "Mississauga Canada").length, 1);
assert.equal(searchDealers(publicDealers, "Alexandria Australia").length, 1);
assert.equal(searchDealers(publicDealers, "Basingstoke United Kingdom").length, 1);
assert.equal(searchDealers(publicDealers, "Basingstoke UK").length, 1);

const source = { workbook: "test", sheet: "test", row: 1, rawCity: "Origin" };
const coordinateDealers: Dealer[] = [
  { id: "near", name: "Near", city: "Near", country: "United States", coordinates: { latitude: 40.1, longitude: -75 }, source },
  { id: "far", name: "Far", city: "Far", country: "United States", coordinates: { latitude: 42, longitude: -75 }, source },
  { id: "unknown", name: "Unknown", city: "Unknown", country: "United States", source },
];
const origin = { latitude: 40, longitude: -75 };
assert.ok(distanceMiles(origin, coordinateDealers[0].coordinates!) > 6);
assert.deepEqual(dealersWithinRadius(coordinateDealers, origin, 25).map((dealer) => dealer.id), ["near"]);
assert.deepEqual(dealersWithinRadius(coordinateDealers, origin, 100).map((dealer) => dealer.id), ["near"]);
assert.deepEqual(dealersWithinRadius(searchDealers(coordinateDealers, "Far"), origin, 25), [], "Lexical matches outside the radius must remain excluded");

const austin = publicDealers.find((dealer) => dealer.id === "club-champion-austin-tx-united-states")!;
const exactCandidate = {
  coordinates: { latitude: 0, longitude: 0 },
  formattedAddress: "Test-only exact candidate",
  resultTypes: ["street_address"],
  locationType: "ROOFTOP",
  addressComponents: [
    { longName: austin.city, shortName: austin.city, types: ["locality"] },
    { longName: "Texas", shortName: "TX", types: ["administrative_area_level_1"] },
    { longName: austin.postalCode!, shortName: austin.postalCode!, types: ["postal_code"] },
    { longName: austin.country, shortName: "US", types: ["country"] },
  ],
};
assert.deepEqual(reviewGeocodeCandidate(austin, exactCandidate), { status: "verified", discrepancies: [] });
assert.equal(reviewGeocodeCandidate(austin, { ...exactCandidate, locationType: "APPROXIMATE" }).status, "needs-review");

console.log("Phase 2 data, search, distance, radius, and verification tests passed.");
