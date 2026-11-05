import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectLogoFormat } from "../lib/dealers/logo-format";
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
const homePage = read("app/page.tsx");
const signInAction = read("app/actions.ts");
const nextConfig = read("next.config.ts");

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
assert.match(accessEndedRoute, /auth\.signOut\(\)[\s\S]*redirect\("\/\?access=inactive"\)/, "revoked sessions are cleared before returning to sign in");
assert.match(homePage, /access === "inactive"/, "the sign-in page explains why a revoked session was signed out");
assert.match(dealerLoginPage, /redirect\(access === "inactive" \? "\/\?access=inactive" : "\/"\)/, "the legacy dealer login path forwards to the single sign-in page");
assert.match(signInAction, /verifyTurnstileForm\(formData\)[\s\S]*signInWithPassword/, "sign-in checks Turnstile before trying the password");
assert.doesNotMatch(read("app/admin/actions.ts"), /signInWithPassword/, "the admin login action is retired in favor of the single sign-in");
assert.doesNotMatch(read("app/partner/actions.ts"), /signInWithPassword/, "the dealer login action is retired in favor of the single sign-in");
assert.match(nextConfig, /frame-ancestors 'none'/, "pages cannot be framed for clickjacking");
assert.match(nextConfig, /object-src 'none'/, "plugins are blocked by the content security policy");
assert.match(nextConfig, /poweredByHeader: false/, "the X-Powered-By header is not sent");

console.log("Dealer portal authorization and brand-surface checks passed.");

const dealerLocationActions = read("app/partner/(protected)/locations/actions.ts");
for (const action of ["createDealerLocationAction", "updateDealerLocationAction", "setDealerLocationActiveAction"]) {
  const body = dealerLocationActions.slice(dealerLocationActions.indexOf(`export async function ${action}`));
  assert.match(body.slice(0, 400), /await requireDealerPortal\("locations"\)/, `${action} re-checks Locations permission on the server`);
}
assert.match(dealerLocationActions, /\.in\("organization_id", organizationIds\)/, "edits are limited to locations linked to the dealer's own organizations");
assert.match(dealerLocationActions, /editableOrganizations\(identity\)\.find/, "new locations can only be added to the dealer's own organizations");
assert.match(dealerLocationActions, /applyAutomaticCoordinates\(dealer, formData/, "dealer addresses pass the same precise-geocode check as admin edits");
assert.doesNotMatch(dealerLocationActions, /verificationStatus: values|coordinates: values|source: values/, "dealers cannot set verification, coordinates, or provenance from form input");
assert.doesNotMatch(dealerLocationActions, /\.from\("dealers"\)\.delete\(\)\.eq\("id", dealerId\)/, "dealer removal hides a location instead of deleting it");

const logoMigration = read("supabase/migrations/202611020001_dealer_logos.sql");
const svg = (body: string) => new TextEncoder().encode(body);
assert.deepEqual(detectLogoFormat(svg('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"><path fill="#000" d="M0 0h1v1z"/></svg>')), { extension: "svg", contentType: "image/svg+xml" }, "plain SVG logos are accepted");
assert.equal(detectLogoFormat(svg('<svg onload="alert(1)"></svg>')), "unsafe-svg", "SVG event handlers are refused");
assert.equal(detectLogoFormat(svg('<svg><script>alert(1)</script></svg>')), "unsafe-svg", "SVG scripts are refused");
assert.equal(detectLogoFormat(svg("<html><body>hi</body></html>")), null, "non-image uploads are refused");
assert.deepEqual(detectLogoFormat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])), { extension: "png", contentType: "image/png" }, "PNG logos are detected from their bytes");
for (const file of ["club-champion-logo.svg", "pga-tour-superstore-logo.svg", "scheels-logo.svg", "golftec-logo.svg"]) {
  const format = detectLogoFormat(new Uint8Array(readFileSync(resolve(root, "public/brand", file))));
  assert.ok(format && format !== "unsafe-svg", `${file} passes logo validation for import`);
}
assert.match(logoMigration, /'dealer-logos', 'dealer-logos', true/, "dealer logos are stored in a public bucket");
assert.match(logoMigration, /grant execute on function public\.get_public_dealer_logos\(\) to anon/, "the storefront can read published dealer logos");
assert.match(logoMigration, /d\.active\s+and d\.verification_status = 'verified'\s+and o\.active/, "logos are exposed only for published locations of active dealers");
assert.match(dealerLocationActions, /updateOrganizationLogoAction[\s\S]*editableOrganizations\(identity\)\.find/, "dealers can change only their own organization's logo");
assert.match(dealerLocationsPage, /DealerLogoForm/, "dealers manage their logo from the Locations page");
assert.match(adminDealerPage, /DealerLogoForm/, "admins manage dealer logos from the organization page");

const adminAuth = read("lib/admin/auth.ts");
const mfaMigration = read("supabase/migrations/202611040001_require_admin_mfa.sql");
const mfaForm = read("components/admin/admin-mfa-form.tsx");
const adminResetForm = read("components/admin/reset-password-form.tsx");
assert.match(adminAuth, /claims\.aal !== "aal2"\) return null/, "admin identity requires a two-step verified (aal2) session");
assert.match(proxy, /const isAdmin = isAdminRole && data\?\.claims\?\.aal === "aal2"/, "proxy admits administrators only after two-step verification");
assert.match(proxy, /pathname = isAdminRole \? "\/admin\/mfa" : "\/"/, "password-only admin sessions are sent to the authenticator step");
assert.match(mfaMigration, /'role'\) = 'admin'\s+and \(auth\.jwt\(\) ->> 'aal'\) = 'aal2'/, "RLS admin policies require aal2");
assert.match(signInAction, /role === "admin"\) redirect\("\/admin\/mfa"\)/, "administrators continue to two-step verification after the password");
assert.match(mfaForm, /challengeAndVerify\(\{ factorId: targetFactor, code \}\)/, "the MFA page verifies a TOTP code");
assert.match(mfaForm, /status === "unverified"\) await supabase\.auth\.mfa\.unenroll/, "abandoned authenticator setups are cleared before enrolling again");
assert.match(adminResetForm, /nextLevel === "aal2"[\s\S]*challengeAndVerify[\s\S]*updateUser\(\{ password \}\)/, "password resets on MFA accounts verify a code first");
assert.match(read("app/admin/(protected)/users/actions.ts"), /resetUserMfaAction[\s\S]*userId === currentAdmin\.id\) return/, "administrators cannot reset their own two-step verification");

const dealerActions = read("app/admin/(protected)/dealers/actions.ts");
assert.match(dealerActions, /deleteDealerOrganizationAction[\s\S]*await requireAdmin\(\)[\s\S]*if \(count\) return[\s\S]*\.from\("dealer_organizations"\)\.delete\(\)/, "a dealer organization is deleted only by an admin and only once it has no locations");
assert.match(dealerActions, /dealer_portal_users"\)\.update\(\{ active: false/, "portal users left without a dealer are deactivated, not deleted");
assert.match(read("app/admin/(protected)/users/page.tsx"), /href=\{`\/admin\/dealers\/\$\{organization\.id\}`\}/, "every dealer organization is reachable from the Users page");
