import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyVerifiedGoogleCoordinates } from "../lib/dealers/coordinates";
import { dealerEnrichmentProposals } from "../lib/dealers/enrichment-proposals";
import { applyVerifiedEnrichments } from "../lib/dealers/enrichment";
import { googleBrowserGeocodeBatch } from "../lib/dealers/google-geocodes";
import { normalizeDealerRows } from "../lib/dealers/normalize";
import { rawDealerRows } from "../lib/dealers/source";
import { dealerRowToDealer, dealerToMutation } from "../lib/dealers/supabase-mapper";
import { safeAdminReturnPath } from "../lib/admin/return-path";

const normalized = normalizeDealerRows(rawDealerRows).dealers;
const enriched = applyVerifiedEnrichments(normalized, dealerEnrichmentProposals).dealers;
const dealers = applyVerifiedGoogleCoordinates(enriched, googleBrowserGeocodeBatch);
assert.equal(dealers.length, 71);
assert.equal(dealers.filter((dealer) => dealer.active !== false && dealer.verificationStatus === "verified").length, 70);
assert.equal(dealers.filter((dealer) => dealer.coordinates).length, 70);

const preston = dealers.find((dealer) => dealer.city === "Preston" && dealer.stateProvince === "WA");
assert.ok(preston);
assert.notEqual(preston.verificationStatus, "verified");

const sample = dealers.find((dealer) => dealer.verificationStatus === "verified");
assert.ok(sample);
const mutation = dealerToMutation(sample);
const roundTrip = dealerRowToDealer({
  ...mutation,
  created_at: "2026-08-15T00:00:00.000Z",
  updated_at: "2026-08-15T00:00:00.000Z",
});
assert.equal(roundTrip.id, sample.id);
assert.equal(roundTrip.name, sample.name);
assert.deepEqual(roundTrip.coordinates, sample.coordinates);
assert.deepEqual(roundTrip.source, sample.source);
assert.deepEqual(roundTrip.enrichmentSources, sample.enrichmentSources);

const migration = readFileSync("supabase/migrations/202608150001_create_dealers.sql", "utf8");
const adminUserAction = readFileSync("app/admin/(protected)/users/actions.ts", "utf8");
const adminUserDirectory = readFileSync("lib/admin/users.ts", "utf8");
assert.match(migration, /enable row level security/i);
assert.match(migration, /is_dealer_admin/);
assert.match(migration, /active and verification_status = 'verified'/);
assert.match(migration, /grant select \(/i);
assert.doesNotMatch(migration, /service_role.*policy/i);

assert.equal(safeAdminReturnPath("/admin/dealers/pga?view=list"), "/admin/dealers/pga?view=list");
assert.equal(safeAdminReturnPath("/admin/locations?q=PGA%20TOUR"), "/admin/locations?q=PGA%20TOUR");
assert.equal(safeAdminReturnPath("https://example.com/admin/dealers/pga"), "/admin/locations");
assert.equal(safeAdminReturnPath("//example.com/admin/dealers/pga"), "/admin/locations");
assert.match(adminUserAction, /await requireAdmin\(\)/, "admin invitations recheck authorization");
assert.match(adminUserAction, /app_metadata:[\s\S]*role: "admin"/, "admin role is stored in protected metadata");
assert.match(adminUserAction, /Existing roles are not changed automatically/, "existing roles cannot be silently promoted");
assert.match(adminUserDirectory, /import "server-only"/, "master Auth directory is server-only");

console.log("Admin data checks passed: 71 preserved, 70 publishable, RLS migration present.");
