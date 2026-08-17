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
const adminLayout = readFileSync("app/admin/(protected)/layout.tsx", "utf8");
const adminDashboard = readFileSync("app/admin/(protected)/page.tsx", "utf8");
const adminDealerDirectory = readFileSync("app/admin/(protected)/dealers/page.tsx", "utf8");
const adminDealerLocations = readFileSync("app/admin/(protected)/dealers/locations/page.tsx", "utf8");
assert.match(migration, /enable row level security/i);
assert.match(migration, /is_dealer_admin/);
assert.match(migration, /active and verification_status = 'verified'/);
assert.match(migration, /grant select \(/i);
assert.doesNotMatch(migration, /service_role.*policy/i);

assert.equal(safeAdminReturnPath("/admin/dealers/pga?view=list"), "/admin/dealers/pga?view=list");
assert.equal(safeAdminReturnPath("/admin/locations?q=PGA%20TOUR"), "/admin/locations?q=PGA%20TOUR");
assert.equal(safeAdminReturnPath("https://example.com/admin/dealers/pga"), "/admin/locations");
assert.equal(safeAdminReturnPath("//example.com/admin/dealers/pga"), "/admin/locations");
assert.match(adminUserAction, /await requireAdmin\(\)/, "user creation rechecks authorization");
assert.match(adminUserAction, /role !== "admin" && role !== "dealer"/, "only supported account groups can be assigned");
assert.match(adminUserAction, /app_metadata:[\s\S]*role },/, "account group is stored in protected metadata");
assert.match(adminUserAction, /Existing roles are not changed automatically/, "existing roles cannot be silently promoted");
assert.match(adminUserAction, /page_permissions: pagePermissions/, "dealer page permissions are assigned with membership");
assert.match(adminUserAction, /auth\.admin\.createUser/, "admins can create users without invitations");
assert.match(adminUserAction, /auth\.admin\.deleteUser/, "admins can delete users");
assert.match(adminUserAction, /userId === currentAdmin\.id/, "admins cannot delete their current account");
assert.match(adminUserDirectory, /import "server-only"/, "master Auth directory is server-only");
assert.match(adminLayout, /href="\/admin\/account"/, "account menu links to the administrator profile");
assert.match(adminLayout, /href="\/admin"/, "account menu links to the central admin hub");
assert.doesNotMatch(adminLayout, /<nav aria-label="Admin navigation"/, "management functions are removed from the header navigation");
for (const href of ["/admin/dealers", "/admin/users"]) assert.match(adminDashboard, new RegExp(`href: "${href}"`), `${href} is available from the admin hub`);
assert.doesNotMatch(adminDashboard, /admin\/requests/, "update requests are removed from the admin hub");
assert.doesNotMatch(adminDashboard, /href: "\/admin\/locations"/, "raw locations are grouped behind Dealers in the admin hub");
assert.match(adminDealerDirectory, /groupDealers\(dealers\)/, "the dealer directory groups current location records by retailer");
assert.match(adminDealerLocations, /location\.name\.localeCompare\(dealerName/, "dealer location pages enforce an exact retailer match");

console.log("Admin data checks passed: 71 preserved, 70 publishable, RLS migration present.");
