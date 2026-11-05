import { createClient } from "@supabase/supabase-js";

// Creates a dealer organization for every dealer name whose locations are not linked to one yet, and links
// those locations, so each dealer can later get portal logins (contacts are added separately).
// Names that already have an organization are skipped rather than merged, so existing organizations keep the
// links an administrator chose. Dry run by default; pass --apply to write.
function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const slugify = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "dealer";

async function main() {
  const apply = process.argv.includes("--apply");
  const supabase = createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

  const [{ data: dealers, error: dealersError }, { data: links, error: linksError }, { data: organizations, error: orgError }] = await Promise.all([
    supabase.from("dealers").select("id, name"),
    supabase.from("dealer_organization_locations").select("dealer_id"),
    supabase.from("dealer_organizations").select("name, slug"),
  ]);
  if (dealersError || linksError || orgError) throw dealersError || linksError || orgError;

  const linked = new Set((links || []).map((link) => link.dealer_id));
  const existingNames = new Set((organizations || []).map((organization) => organization.name.toLowerCase()));
  const usedSlugs = new Set((organizations || []).map((organization) => organization.slug));

  const byName = new Map<string, string[]>();
  for (const dealer of dealers || []) {
    if (linked.has(dealer.id)) continue;
    byName.set(dealer.name, [...(byName.get(dealer.name) || []), dealer.id]);
  }

  let created = 0;
  for (const [name, dealerIds] of [...byName.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (existingNames.has(name.toLowerCase())) {
      console.log(`skip  ${name}: an organization with this name already exists (${dealerIds.length} unlinked location(s) left as is)`);
      continue;
    }
    let slug = slugify(name);
    for (let suffix = 2; usedSlugs.has(slug); suffix += 1) slug = `${slugify(name)}-${suffix}`;
    usedSlugs.add(slug);
    console.log(`create ${name} (${slug}) with ${dealerIds.length} location(s)`);
    created += 1;
    if (!apply) continue;

    const { data: organization, error } = await supabase.from("dealer_organizations").insert({ name, slug, active: true }).select("id").single();
    if (error) throw new Error(`${name}: ${error.message}`);
    const { error: linkError } = await supabase.from("dealer_organization_locations").insert(dealerIds.map((dealerId) => ({ organization_id: organization.id, dealer_id: dealerId })));
    if (linkError) {
      await supabase.from("dealer_organizations").delete().eq("id", organization.id);
      throw new Error(`${name}: ${linkError.message}`);
    }
  }

  console.log(`\n${created} organization(s) ${apply ? "created" : "to create"}.${apply ? "" : " Dry run only. Re-run with --apply to write."}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
