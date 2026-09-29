import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dealerPortalHome, dealerPortalRedirect, portalAccessEndedPath, portalPagePaths } from "../lib/portal/access";
import { portalPageKeys, type PortalPageKey } from "../types/portal";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const migration = read("supabase/migrations/202608170001_create_dealer_portal.sql");
const proxy = read("lib/supabase/proxy.ts");
const serviceClient = read("lib/supabase/admin.ts");
const portalAuth = read("lib/portal/auth.ts");
const brandPage = read("app/partner/(protected)/brand/page.tsx");
const dealerLocationsPage = read("app/partner/(protected)/locations/page.tsx");
const adminDealerPage = read("app/admin/(protected)/dealers/[id]/page.tsx");
const viewToggle = read("components/layout/location-view-toggle.tsx");
const portalLayout = read("app/partner/(protected)/layout.tsx");
const portalShell = read("components/portal/dealer-portal-shell.tsx");
const galleryAuth = read("lib/gallery/auth.ts");
const accessEndedRoute = read("app/partner/access-ended/route.ts");
const dealerLoginPage = read("app/partner/login/page.tsx");

assert.match(migration, /role text not null default 'dealer'/, "dealer role is stored explicitly");
assert.match(migration, /page_permissions text\[\]/, "memberships contain page permissions");
assert.match(migration, /'dashboard', 'locations', 'brand'/, "only known pages are allowed");
assert.match(migration, /get_dealer_portal_locations/, "portal uses a guarded location function");
assert.match(migration, /where source_sheet = 'PGATSS'[\s\S]*verification_status = 'verified'/, "PGA seed includes only verified records");
assert.doesNotMatch(migration, /values\s*\([^)]*Preston/i, "no ambiguous Preston record is manually assigned");
assert.match(proxy, /isPartnerRoute/, "partner routes are session protected");
assert.match(proxy, /app_metadata\?\.role === "dealer"/, "proxy checks protected dealer app metadata");
assert.match(portalAuth, /requireDealerPortal/, "server pages have a reusable authorization guard");
assert.match(serviceClient, /import "server-only"/, "service-role client is server-only");
assert.doesNotMatch(serviceClient, /NEXT_PUBLIC_SUPABASE_SERVICE/, "service role can never use a public variable");
assert.match(brandPage, /Approved downloads/, "brand portal includes approved downloads");
assert.match(brandPage, /Logo standards/, "brand portal includes logo standards");
assert.match(brandPage, /Written style/, "brand portal includes voice guidance");
assert.match(dealerLocationsPage, /view === "list"/, "dealer locations support list view");
assert.match(adminDealerPage, /view === "list"/, "admin dealer locations support list view");
assert.match(viewToggle, /aria-current/, "location view control exposes its current state accessibly");
assert.match(portalLayout, /DealerPortalShell/, "partner routes use the shared dealer portal shell");
assert.match(portalShell, /href: "\/partner\/brand", label: "Brand"/, "brand page is included in the primary dealer navigation");
assert.match(portalShell, /href="\/image-gallery"/, "all authenticated dealers can reach the shared image gallery");

assert.equal(dealerPortalRedirect(["locations"], "dashboard"), "/partner/locations", "Locations-only dealers land on Locations instead of the Overview they cannot open");
assert.equal(dealerPortalRedirect(["brand"], "dashboard"), "/partner/brand", "Brand-only dealers land on Brand instead of the Overview they cannot open");
assert.equal(dealerPortalRedirect(["brand"], "locations"), "/partner/brand", "Brand-only dealers are redirected away from Locations");
assert.equal(dealerPortalRedirect(["dashboard", "locations"], "brand"), "/partner?denied=1", "dealers with Overview see the denied-page notice there");
assert.equal(dealerPortalRedirect(["locations"], "locations"), null, "permitted pages render");
assert.equal(dealerPortalRedirect([], undefined), null, "the shared shell needs only an active dealer");
assert.equal(dealerPortalHome([]), "/image-gallery", "dealers without enabled pages land on the shared gallery");

const permissionSets = Array.from({ length: 2 ** portalPageKeys.length }, (_, mask) => portalPageKeys.filter((_, index) => mask & (1 << index)));
const pageForPath = new Map<string, PortalPageKey>(Object.entries(portalPagePaths).map(([page, path]) => [path, page as PortalPageKey]));
for (const permissions of permissionSets) {
  for (const page of portalPageKeys) {
    const destination = dealerPortalRedirect(permissions, page);
    if (!destination) continue;
    const destinationPage = pageForPath.get(destination.split("?")[0]);
    assert.equal(destinationPage ? dealerPortalRedirect(permissions, destinationPage) : null, null, `[${permissions.join(", ")}] reaches a renderable page from ${page} in one redirect`);
  }
}

assert.match(portalAuth, /if \(!identity\) redirect\(portalAccessEndedPath\)/, "revoked portal sessions are ended instead of bounced to the login page");
assert.match(galleryAuth, /if \(!identity\) redirect\(portalAccessEndedPath\)/, "revoked gallery sessions are ended instead of bounced to the login page");
assert.equal(portalAccessEndedPath, "/partner/access-ended", "the session-ending route stays behind the dealer proxy matcher");
assert.match(accessEndedRoute, /if \(await getDealerPortalIdentity\(\)\) redirect/, "dealers with usable access are never signed out by the access-ended route");
assert.match(accessEndedRoute, /auth\.signOut\(\)[\s\S]*redirect\("\/partner\/login\?access=inactive"\)/, "revoked sessions are cleared before returning to sign in");
assert.match(dealerLoginPage, /access === "inactive"/, "the login page explains why a revoked session was signed out");

console.log("Dealer portal authorization and brand-surface checks passed.");
