import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { portalPageKeys, type DealerPortalIdentity, type DealerPortalMembership, type PortalPageKey } from "@/types/portal";

type MembershipRow = {
  organization_id: string;
  page_permissions: string[];
  dealer_organizations: { id: string; name: string; slug: string; active: boolean } | null;
};

function isPageKey(value: string): value is PortalPageKey {
  return portalPageKeys.includes(value as PortalPageKey);
}

export async function getDealerPortalIdentity(): Promise<DealerPortalIdentity | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || claims?.app_metadata?.role !== "dealer" || !claims.sub) return null;

  const [{ data: profile }, { data: membershipData, error: membershipError }] = await Promise.all([
    supabase
      .from("dealer_portal_users")
      .select("email, display_name, active")
      .eq("user_id", claims.sub)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("dealer_memberships")
      .select("organization_id, page_permissions, dealer_organizations(id, name, slug, active)")
      .eq("user_id", claims.sub)
      .eq("active", true),
  ]);

  if (!profile || membershipError || !membershipData?.length) return null;

  const memberships = (membershipData as unknown as MembershipRow[])
    .filter((row) => row.dealer_organizations?.active)
    .map<DealerPortalMembership>((row) => ({
      organizationId: row.organization_id,
      organizationName: row.dealer_organizations!.name,
      organizationSlug: row.dealer_organizations!.slug,
      pagePermissions: row.page_permissions.filter(isPageKey),
    }));

  if (!memberships.length) return null;
  const permissions = Array.from(new Set(memberships.flatMap((membership) => membership.pagePermissions)));

  return {
    id: claims.sub,
    email: profile.email || (typeof claims.email === "string" ? claims.email : "Dealer"),
    displayName: profile.display_name || undefined,
    memberships,
    permissions,
  };
}

export async function requireDealerPortal(page?: PortalPageKey) {
  const identity = await getDealerPortalIdentity();
  if (!identity) redirect("/partner/login");
  if (page && !identity.permissions.includes(page)) redirect("/partner?denied=1");
  return identity;
}
