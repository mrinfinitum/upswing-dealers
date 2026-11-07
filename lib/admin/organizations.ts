import "server-only";

import { normalizeOrganizationName, organizationDomains, type OrganizationMatchCandidate } from "@/lib/dealers/organization-match";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type LinkRow = { organization_id: string; dealer_id: string; dealers: { website: string | null; email: string | null } | null };

// Every dealer organization with its location count and the domains its locations use, for matching new
// locations to an organization. Read with the administrator's session (so RLS limits it to admins) unless the
// caller passes the service client, as the public application action does.
export async function loadOrganizationMatchCandidates(client?: SupabaseClient): Promise<OrganizationMatchCandidate[]> {
  const supabase = client ?? await createClient();
  const [{ data: organizations, error }, { data: links, error: linkError }] = await Promise.all([
    supabase.from("dealer_organizations").select("id, name").order("name"),
    supabase.from("dealer_organization_locations").select("organization_id, dealer_id, dealers(website, email)"),
  ]);
  if (error || linkError) return [];
  const rows = (links ?? []) as unknown as LinkRow[];
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.organization_id, (counts.get(row.organization_id) ?? 0) + 1);
  const domains = organizationDomains(rows.map((row) => ({ organizationId: row.organization_id, website: row.dealers?.website, email: row.dealers?.email })));
  return (organizations ?? []).map((organization) => ({
    id: organization.id,
    name: organization.name,
    locationCount: counts.get(organization.id) ?? 0,
    domains: domains.get(organization.id) ?? [],
  }));
}

// The organizations a location already belongs to (usually zero or one).
export async function organizationsForDealer(dealerId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("dealer_organization_locations").select("dealer_organizations(id, name)").eq("dealer_id", dealerId);
  return ((data ?? []) as unknown as Array<{ dealer_organizations: { id: string; name: string } | null }>)
    .flatMap((row) => row.dealer_organizations ? [row.dealer_organizations] : []);
}

// Links new locations to the organization whose name matches their dealer name exactly (ignoring case and
// punctuation), so a location added under "GOLFTEC" joins the GOLFTEC organization without a separate step.
// Returns how many locations were linked; a failure leaves the locations unlinked for an admin to fix.
export async function linkLocationsToOrganizationsByName(locations: Array<{ id: string; name: string }>) {
  if (!locations.length) return 0;
  const supabase = await createClient();
  const { data: organizations, error } = await supabase.from("dealer_organizations").select("id, name");
  if (error || !organizations?.length) return 0;
  const byName = new Map(organizations.map((organization) => [normalizeOrganizationName(organization.name), organization.id]));
  const links = locations.flatMap((location) => {
    const organizationId = byName.get(normalizeOrganizationName(location.name));
    return organizationId ? [{ organization_id: organizationId, dealer_id: location.id }] : [];
  });
  if (!links.length) return 0;
  const { error: linkError } = await supabase.from("dealer_organization_locations").upsert(links, { ignoreDuplicates: true });
  return linkError ? 0 : links.length;
}
