import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyVerifiedEnrichments, validateEnrichmentProposals } from "../lib/dealers/enrichment";
import { dealerEnrichmentProposals } from "../lib/dealers/enrichment-proposals";
import { normalizeDealerRows } from "../lib/dealers/normalize";
import { getInitialDealerResults, getStateCodeForQuery, searchDealers, searchDealersByExactState } from "../lib/dealers/search";
import { rawDealerRows } from "../lib/dealers/source";
import { getMappableDealers } from "../lib/maps/markers";
import { dealersWithinRadius, distanceMiles } from "../lib/geo/distance";
import { reviewGeocodeCandidate } from "../lib/geo/geocode-review";
import { applyVerifiedGoogleCoordinates, reviewGoogleCoordinates, validateCoordinateApprovals } from "../lib/dealers/coordinates";
import { googleBrowserGeocodeBatch } from "../lib/dealers/google-geocodes";
import { dealerCoordinateApprovals } from "../lib/dealers/coordinate-approvals";
import type { Dealer } from "../types/dealer";

const homePage = readFileSync("app/page.tsx", "utf8");
const mapsPreloader = readFileSync("components/dealer-locator/google-maps-preloader.tsx", "utf8");
const googleLoader = readFileSync("lib/maps/google-loader.ts", "utf8");
const googleMap = readFileSync("components/dealer-locator/google-map.tsx", "utf8");
const dealerLocator = readFileSync("components/dealer-locator/dealer-locator.tsx", "utf8");
const mapPanel = readFileSync("components/dealer-locator/map-panel.tsx", "utf8");
assert.match(homePage, /GoogleMapsPreloader config=\{mapConfig\}/, "the home page starts warming Google Maps before the locator renders");
assert.match(mapsPreloader, /preconnect\("https:\/\/maps\.googleapis\.com"\)/, "Google Maps API connection is warmed early");
assert.match(mapsPreloader, /preconnect\("https:\/\/maps\.gstatic\.com"/, "Google Maps static asset connection is warmed early");
assert.match(mapsPreloader, /loadGoogleMaps\(config\)/, "the Maps and marker libraries preload during the hero view");
assert.match(googleLoader, /mapsPromise \?\?=/, "the visible map reuses the in-flight preload promise");
assert.match(googleMap, /UNITED_STATES_CENTER/, "the default map uses an explicit continental U.S. center");
assert.match(googleMap, /map\.moveCamera\(\{ center: UNITED_STATES_CENTER, zoom: UNITED_STATES_ZOOM \}\)/, "the default map camera is restored after the panel has dimensions");
assert.match(googleMap, /google\.maps\.event\.trigger\(map, "resize"\)/, "the first map render is resized after layout before setting its camera");
assert.match(googleMap, /marker\.addEventListener\("gmp-click"/, "dealer markers use the current Advanced Marker click event");
assert.match(googleMap, /gmpClickable: true/, "dealer markers explicitly enable current Google Maps click and keyboard interaction");
assert.match(googleMap, /\/brand\/dealer-map-marker\.svg/, "dealer markers use the approved UpSwing golfer artwork");
assert.match(googleMap, /map\.getZoom\(\).*<= 5/, "dealer marker artwork scales down at continental map zoom levels");
assert.match(googleMap, /if \(!shouldFrameResults\) return/, "marker selection does not refit all visible results and reset the user's zoom");
assert.match(googleMap, /infoWindow\.setContent\(createDealerInfoCard\(openDealer\)\)/, "dealer marker selection opens a location information card");
assert.match(googleMap, /DEALER_LOGOS\[dealer\.name\]/, "the dealer marker information card uses an approved retailer logo when available");
assert.match(googleMap, /heading\.textContent = dealer\.name/, "dealer marker cards preserve a text fallback when no retailer logo is configured");
assert.doesNotMatch(googleMap, /map\.addListener\("click"/, "the map canvas does not immediately close a marker card through click bubbling");
assert.match(dealerLocator, /if \(!hasSearchContext\) return \[\]/, "the locator renders no dealer list before a user searches");
assert.match(dealerLocator, /dealers=\{dealers\}/, "the map retains the complete verified dealer network after a search");
assert.match(dealerLocator, /focusDealers=\{mapFocusDealers\}/, "map camera bounds continue to follow only the active search results");
assert.match(dealerLocator, /awaitingSearch=\{false\}/, "the initial map stays visible and interactive beside the search card");
assert.match(dealerLocator, /Start with your location\./, "the initial left panel asks for a ZIP code or city and state");
assert.match(dealerLocator, /Choose a state/, "the initial left panel offers a state selector");
assert.match(dealerLocator, /if \(value\) void runSearch\(value, Boolean\(typedLocation\), typedLocation \? "location" : "state"\)/, "the state and location interfaces wait for explicit form submission");
assert.match(dealerLocator, /runSearch\(value, !stateOnly, stateOnly \? "state" : "location"\)/, "submitted state selection shows every lexical state match instead of applying a radius around the state centroid");
assert.match(mapPanel, /onUseMyLocation/, "the initial map prompt preserves optional browser geolocation");
assert.match(mapPanel, /upswing-logo-white\.png/, "the map header carries the approved UpSwing brand mark");
assert.match(dealerLocator, /error\.PERMISSION_DENIED/, "geolocation permission denial receives specific recovery guidance");
assert.match(dealerLocator, /error\.POSITION_UNAVAILABLE/, "unavailable device positioning is distinct from permission denial");
assert.match(dealerLocator, /error\.TIMEOUT/, "geolocation timeout receives a retryable error state");
assert.match(dealerLocator, /timeout: 20000/, "slower devices receive sufficient time to resolve their location");
assert.match(dealerLocator, /Trying a more precise location signal/, "unavailable or timed-out positioning triggers a precise retry");
assert.match(dealerLocator, /enableHighAccuracy: false/, "the first positioning request may use a recent cached location");
assert.match(dealerLocator, /enableHighAccuracy: true, timeout: 25000, maximumAge: 0/, "the retry requests a fresh high-accuracy position");

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
const initialDealerResults = getInitialDealerResults(publicDealers);
assert.ok(initialDealerResults.length > 0 && initialDealerResults.length < publicDealers.length, "initial results include only the U.S. subset");
assert.ok(initialDealerResults.every((dealer) => dealer.country === "United States"), "the initial locator list contains only U.S. dealers");
assert.deepEqual(
  initialDealerResults.map((dealer) => `${dealer.name}|${dealer.city}|${dealer.stateProvince}`),
  [...initialDealerResults].sort((left, right) => new Intl.Collator("en", { numeric: true, sensitivity: "base" }).compare(`${left.name}|${left.city}|${left.stateProvince}`, `${right.name}|${right.city}|${right.stateProvince}`)).map((dealer) => `${dealer.name}|${dealer.city}|${dealer.stateProvince}`),
  "the initial U.S. dealer list is alphabetized by retailer and location",
);
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
assert.equal(getStateCodeForQuery("Texas"), "TX", "full state names resolve to their exact state code");
assert.equal(getStateCodeForQuery("tx"), "TX", "state abbreviations resolve without case sensitivity");
assert.equal(searchDealersByExactState(publicDealers, "CA").every((dealer) => dealer.stateProvince === "CA" && dealer.country === "United States"), true, "state selection cannot leak substring matches from other regions or countries");
assert.equal(searchDealersByExactState(publicDealers, "TX").length, publicDealers.filter((dealer) => dealer.stateProvince === "TX" && dealer.country === "United States").length, "state selection returns every exact dealer in the chosen state");

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
