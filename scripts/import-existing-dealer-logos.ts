import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { detectLogoFormat } from "../lib/dealers/logo-format";

// Moves the retailer logos that were hard-coded in lib/dealers/brand.ts into the dealer-logos bucket.
// A brand without a dealer organization gets one, linked to every dealer row with the same name. Existing
// organizations keep their current links (PGA TOUR Superstore deliberately excludes an ambiguous Preston record).
// Dry run by default; pass --apply to write. Existing organization logos are kept unless --replace is passed.
const brands = [
  { name: "Club Champion", slug: "club-champion", file: "public/brand/club-champion-logo.svg" },
  { name: "PGA TOUR Superstore", slug: "pga-tour-superstore", file: "public/brand/pga-tour-superstore-logo.svg" },
  { name: "SCHEELS", slug: "scheels", file: "public/brand/scheels-logo.svg" },
  { name: "GOLFTEC", slug: "golftec", file: "public/brand/golftec-logo.svg" },
];

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const replace = process.argv.includes("--replace");
  const supabase = createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

  for (const brand of brands) {
    const bytes = new Uint8Array(await readFile(brand.file));
    const format = detectLogoFormat(bytes);
    if (!format || format === "unsafe-svg") throw new Error(`${brand.file} is not an accepted logo file.`);

    const { data: existing, error: lookupError } = await supabase.from("dealer_organizations").select("id, logo_path").eq("name", brand.name).maybeSingle();
    if (lookupError) throw lookupError;
    let organizationId = existing?.id as string | undefined;
    if (!organizationId) {
      console.log(`${brand.name}: create dealer organization "${brand.slug}"`);
      if (apply) {
        const { data, error } = await supabase.from("dealer_organizations").insert({ name: brand.name, slug: brand.slug, active: true }).select("id").single();
        if (error) throw error;
        organizationId = data.id;
      }
    }

    if (!existing) {
      const { data: dealers, error: dealersError } = await supabase.from("dealers").select("id").eq("name", brand.name);
      if (dealersError) throw dealersError;
      console.log(`${brand.name}: linking ${dealers?.length ?? 0} locations`);
      if (apply && dealers?.length) {
        const { error } = await supabase.from("dealer_organization_locations").insert(dealers.map((dealer) => ({ organization_id: organizationId, dealer_id: dealer.id })));
        if (error) throw error;
      }
    }

    if (existing?.logo_path && !replace) {
      console.log(`${brand.name}: already has a logo (${existing.logo_path}); skipped`);
      continue;
    }
    console.log(`${brand.name}: upload ${brand.file}`);
    if (!apply || !organizationId) continue;
    const logoPath = `${organizationId}/${Date.now()}.${format.extension}`;
    const { error: uploadError } = await supabase.storage.from("dealer-logos").upload(logoPath, bytes, { contentType: format.contentType, cacheControl: "31536000", upsert: false });
    if (uploadError) throw uploadError;
    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from("dealer_organizations").update({ logo_path: logoPath, logo_updated_at: now, updated_at: now }).eq("id", organizationId);
    if (updateError) throw updateError;
    if (existing?.logo_path) await supabase.storage.from("dealer-logos").remove([existing.logo_path]);
  }

  if (!apply) console.log("\nDry run only. Re-run with --apply to write these changes.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
