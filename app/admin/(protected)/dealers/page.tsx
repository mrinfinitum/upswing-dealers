import type { PortalPageKey } from "@/types/portal";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DealerMembershipForm, InviteDealerUserForm } from "@/components/admin/dealer-access-forms";

type Organization = { id: string; name: string; slug: string; active: boolean };
type Profile = { user_id: string; email: string; display_name: string | null; active: boolean };
type Membership = { user_id: string; organization_id: string; page_permissions: PortalPageKey[]; active: boolean };

export default async function DealerAccessAdminPage() {
  const supabase = await createClient();
  const [orgResult, profileResult, membershipResult, locationResult] = await Promise.all([
    supabase.from("dealer_organizations").select("id, name, slug, active").order("name"),
    supabase.from("dealer_portal_users").select("user_id, email, display_name, active").order("email"),
    supabase.from("dealer_memberships").select("user_id, organization_id, page_permissions, active"),
    supabase.from("dealer_organization_locations").select("organization_id, dealer_id"),
  ]);
  const setupError = orgResult.error || profileResult.error || membershipResult.error || locationResult.error;
  const organizations = (orgResult.data || []) as Organization[];
  const profiles = (profileResult.data || []) as Profile[];
  const memberships = (membershipResult.data || []) as Membership[];
  const locationCounts = new Map<string, number>();
  for (const row of locationResult.data || []) locationCounts.set(row.organization_id, (locationCounts.get(row.organization_id) || 0) + 1);

  return <div className="admin-page admin-dealer-access"><header className="admin-page__heading"><div><p className="eyebrow">Portal access</p><h1>Dealer users</h1><p>Invite dealer contacts, assign their organization, and control which portal pages they can use.</p></div></header>{setupError ? <section className="admin-setup"><h2>Dealer portal migration required</h2><p>Apply <code>supabase/migrations/202608170001_create_dealer_portal.sql</code>, then reload this page.</p></section> : <><section className="admin-access-summary">{organizations.map((organization) => <Link href={`/admin/dealers/${organization.id}`} key={organization.id}><span>{organization.active ? "Active organization" : "Inactive organization"}</span><h2>{organization.name}</h2><p>{locationCounts.get(organization.id) || 0} assigned verified locations</p><strong>View dealer details →</strong></Link>)}</section><section className="admin-access-panel"><div><p className="eyebrow">Add access</p><h2>Invite a dealer contact</h2><p>New users receive a secure Supabase invitation. Existing non-admin users can be assigned without creating a duplicate account.</p></div><InviteDealerUserForm organizations={organizations.filter((organization) => organization.active)} /></section><section className="admin-access-members"><div><p className="eyebrow">Current access</p><h2>Organization memberships</h2></div>{memberships.length ? <div className="admin-membership-grid">{memberships.map((membership) => { const profile = profiles.find((candidate) => candidate.user_id === membership.user_id); const organization = organizations.find((candidate) => candidate.id === membership.organization_id); return <article key={`${membership.user_id}-${membership.organization_id}`}><header><div><span>{organization?.name || "Unknown organization"}</span><h3>{profile?.display_name || profile?.email || "Dealer user"}</h3><p>{profile?.email}</p></div><span className={membership.active ? "admin-status admin-status--verified" : "admin-status"}>{membership.active ? "Active" : "Paused"}</span></header><DealerMembershipForm membership={{ userId: membership.user_id, organizationId: membership.organization_id, permissions: membership.page_permissions, active: membership.active }} /></article>; })}</div> : <p className="admin-empty">No dealer users have been invited yet.</p>}</section></>}</div>;
}
