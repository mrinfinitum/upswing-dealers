import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const migration = read("supabase/migrations/202608170001_create_dealer_portal.sql");
const proxy = read("lib/supabase/proxy.ts");
const serviceClient = read("lib/supabase/admin.ts");
const portalAuth = read("lib/portal/auth.ts");
const brandPage = read("app/partner/(protected)/brand/page.tsx");

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

console.log("Dealer portal authorization and brand-surface checks passed.");
