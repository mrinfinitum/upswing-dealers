import { InviteAdministratorForm } from "@/components/admin/invite-administrator-form";
import { AdminUserDirectoryError, listAuthUsers } from "@/lib/admin/users";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Membership = { user_id: string; organization_id: string; active: boolean; page_permissions: string[] };
type Organization = { id: string; name: string };

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value)) : "Never";
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  let setupError = "";
  let users: Awaited<ReturnType<typeof listAuthUsers>> = [];
  let memberships: Membership[] = [];
  let organizations: Organization[] = [];

  try {
    users = await listAuthUsers();
    const supabase = createSupabaseAdminClient();
    const [membershipResult, organizationResult] = await Promise.all([
      supabase.from("dealer_memberships").select("user_id, organization_id, active, page_permissions"),
      supabase.from("dealer_organizations").select("id, name"),
    ]);
    memberships = (membershipResult.data || []) as Membership[];
    organizations = (organizationResult.data || []) as Organization[];
  } catch (error) {
    setupError = error instanceof AdminUserDirectoryError ? error.message : "The server-only Supabase user administration configuration is unavailable.";
  }

  const needle = q.trim().toLowerCase();
  const visibleUsers = users.filter((user) => {
    if (!needle) return true;
    const role = String(user.app_metadata?.role || "unassigned");
    const name = String(user.user_metadata?.display_name || "");
    const memberOrganizations = memberships.filter((membership) => membership.user_id === user.id).map((membership) => organizations.find((organization) => organization.id === membership.organization_id)?.name || "");
    return [user.email, name, role, ...memberOrganizations].some((value) => value?.toLowerCase().includes(needle));
  });
  const administratorCount = users.filter((user) => user.app_metadata?.role === "admin").length;
  const dealerCount = users.filter((user) => user.app_metadata?.role === "dealer").length;
  const pendingCount = users.filter((user) => !user.email_confirmed_at).length;

  return (
    <div className="admin-page admin-users-page">
      <header className="admin-page__heading"><div><p className="eyebrow">Access control</p><h1>Users</h1><p>Review every Supabase Auth account and invite trusted UpSwing administrators.</p></div></header>
      {setupError ? <section className="admin-setup"><h2>User directory unavailable</h2><p>{setupError}</p></section> : <>
        <section className="admin-user-summary"><article><span>Total accounts</span><strong>{users.length}</strong></article><article><span>Administrators</span><strong>{administratorCount}</strong></article><article><span>Dealer users</span><strong>{dealerCount}</strong></article><article><span>Pending invitations</span><strong>{pendingCount}</strong></article></section>
        <section className="admin-user-invite"><div><p className="eyebrow">Administrator access</p><h2>Invite an administrator</h2><p>Only invite people who should have full access to dealer records, user administration, permissions, and update requests.</p></div><InviteAdministratorForm /></section>
        <section className="admin-user-directory"><header><div><p className="eyebrow">Master directory</p><h2>All users</h2></div><form className="admin-user-search"><label className="sr-only" htmlFor="userSearch">Search users</label><input id="userSearch" name="q" defaultValue={q} placeholder="Search email, name, role, or dealer" /><button className="admin-button" type="submit">Search</button></form></header>
          <div className="admin-user-table-wrap"><table className="admin-user-table"><thead><tr><th>User</th><th>Role</th><th>Dealer access</th><th>Account status</th><th>Last sign in</th><th>Created</th></tr></thead><tbody>{visibleUsers.map((user) => { const role = String(user.app_metadata?.role || "unassigned"); const userMemberships = memberships.filter((membership) => membership.user_id === user.id); return <tr key={user.id}><td><strong>{String(user.user_metadata?.display_name || user.email || "Unnamed user")}</strong><span>{user.email}</span><small className="admin-record-id">{user.id}</small></td><td><span className={`admin-user-role admin-user-role--${role}`}>{role}</span></td><td>{userMemberships.length ? userMemberships.map((membership) => { const organization = organizations.find((item) => item.id === membership.organization_id); return <span className="admin-user-membership" key={membership.organization_id}><strong>{organization?.name || "Unknown dealer"}</strong><small>{membership.active ? membership.page_permissions.join(", ") : "Paused"}</small></span>; }) : <span className="is-muted">None</span>}</td><td>{user.email_confirmed_at ? <span className="admin-status admin-status--verified">Confirmed</span> : <span className="admin-status admin-status--needs-review">Invited</span>}</td><td>{formatDate(user.last_sign_in_at)}</td><td>{formatDate(user.created_at)}</td></tr>; })}</tbody></table>{visibleUsers.length === 0 ? <p className="admin-empty">No users match this search.</p> : null}</div>
        </section>
      </>}
    </div>
  );
}
