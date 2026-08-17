import type { User } from "@supabase/supabase-js";
import { InviteUserForm } from "@/components/admin/invite-administrator-form";
import { AdminUserDirectoryError, listAuthUsers } from "@/lib/admin/users";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Membership = { user_id: string; organization_id: string; active: boolean; page_permissions: string[] };
type Organization = { id: string; name: string; active: boolean };
type UserGroup = "all" | "admin" | "dealer" | "unassigned" | "invited";
type UserSort = "name" | "group" | "newest" | "last-sign-in";

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value)) : "Never";
}

function roleFor(user: User) {
  return String(user.app_metadata?.role || "unassigned");
}

function roleLabel(role: string) {
  if (role === "admin") return "Administrator";
  if (role === "dealer") return "Dealer admin";
  if (role === "unassigned") return "Unassigned";
  return role;
}

function nameFor(user: User) {
  return String(user.user_metadata?.display_name || user.email || "Unnamed user");
}

function sortUsers(users: User[], sort: UserSort) {
  return [...users].sort((left, right) => {
    if (sort === "group") return roleFor(left).localeCompare(roleFor(right)) || nameFor(left).localeCompare(nameFor(right));
    if (sort === "newest") return Date.parse(right.created_at) - Date.parse(left.created_at);
    if (sort === "last-sign-in") return Date.parse(right.last_sign_in_at || "1970-01-01") - Date.parse(left.last_sign_in_at || "1970-01-01");
    return nameFor(left).localeCompare(nameFor(right));
  });
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; group?: string; sort?: string }> }) {
  const params = await searchParams;
  const q = params.q || "";
  const group: UserGroup = ["admin", "dealer", "unassigned", "invited"].includes(params.group || "") ? params.group as UserGroup : "all";
  const sort: UserSort = ["group", "newest", "last-sign-in"].includes(params.sort || "") ? params.sort as UserSort : "name";
  let setupError = "";
  let users: Awaited<ReturnType<typeof listAuthUsers>> = [];
  let memberships: Membership[] = [];
  let organizations: Organization[] = [];

  try {
    users = await listAuthUsers();
    const supabase = createSupabaseAdminClient();
    const [membershipResult, organizationResult] = await Promise.all([
      supabase.from("dealer_memberships").select("user_id, organization_id, active, page_permissions"),
      supabase.from("dealer_organizations").select("id, name, active"),
    ]);
    if (membershipResult.error || organizationResult.error) throw new AdminUserDirectoryError("Dealer groups and permissions could not be loaded.");
    memberships = (membershipResult.data || []) as Membership[];
    organizations = (organizationResult.data || []) as Organization[];
  } catch (error) {
    setupError = error instanceof AdminUserDirectoryError ? error.message : "The server-only Supabase user administration configuration is unavailable.";
  }

  const needle = q.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const role = roleFor(user);
    const matchesGroup = group === "all" || (group === "invited" ? !user.email_confirmed_at : role === group);
    if (!matchesGroup) return false;
    if (!needle) return true;
    const memberOrganizations = memberships.filter((membership) => membership.user_id === user.id).map((membership) => organizations.find((organization) => organization.id === membership.organization_id)?.name || "");
    return [user.email, nameFor(user), role, ...memberOrganizations].some((value) => value?.toLowerCase().includes(needle));
  });
  const visibleUsers = sortUsers(filteredUsers, sort);
  const administratorCount = users.filter((user) => roleFor(user) === "admin").length;
  const dealerCount = users.filter((user) => roleFor(user) === "dealer").length;
  const pendingCount = users.filter((user) => !user.email_confirmed_at).length;
  const activeOrganizations = organizations.filter((organization) => organization.active).sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="admin-page admin-users-page">
      <header className="admin-page__heading"><div><p className="eyebrow">Access control</p><h1>Users</h1><p>Review every account, filter by group, and invite UpSwing administrators or dealer admins.</p></div></header>
      {setupError ? <section className="admin-setup"><h2>User directory unavailable</h2><p>{setupError}</p></section> : <>
        <section className="admin-user-summary"><article><span>Total accounts</span><strong>{users.length}</strong></article><article><span>Administrators</span><strong>{administratorCount}</strong></article><article><span>Dealer admins</span><strong>{dealerCount}</strong></article><article><span>Pending invitations</span><strong>{pendingCount}</strong></article></section>
        <section className="admin-user-invite"><div><p className="eyebrow">Access assignment</p><h2>Invite a user</h2><p>Choose the user group first. Dealer admins can then be assigned to an organization with access to only the portal pages they need.</p></div><InviteUserForm organizations={activeOrganizations} /></section>
        <section className="admin-user-directory">
          <header><div><p className="eyebrow">Master directory</p><h2>All users</h2><p>{visibleUsers.length} of {users.length} accounts shown</p></div></header>
          <form className="admin-user-filters">
            <div className="admin-field admin-user-filter-search"><label htmlFor="userSearch">Search</label><input id="userSearch" name="q" defaultValue={q} placeholder="Email, name, role, or dealer" /></div>
            <div className="admin-field"><label htmlFor="userGroup">Group</label><select id="userGroup" name="group" defaultValue={group}><option value="all">All groups</option><option value="admin">Administrators</option><option value="dealer">Dealer admins</option><option value="unassigned">Unassigned</option><option value="invited">Pending invitations</option></select></div>
            <div className="admin-field"><label htmlFor="userSort">Sort by</label><select id="userSort" name="sort" defaultValue={sort}><option value="name">Name</option><option value="group">Group</option><option value="newest">Newest</option><option value="last-sign-in">Last sign in</option></select></div>
            <button className="admin-button" type="submit">Apply</button>
          </form>
          <div className="admin-user-table-wrap"><table className="admin-user-table"><thead><tr><th>User</th><th>Group</th><th>Dealer access</th><th>Account status</th><th>Last sign in</th><th>Created</th></tr></thead><tbody>{visibleUsers.map((user) => { const role = roleFor(user); const userMemberships = memberships.filter((membership) => membership.user_id === user.id); return <tr key={user.id}><td><strong>{nameFor(user)}</strong><span>{user.email}</span><small className="admin-record-id">{user.id}</small></td><td><span className={`admin-user-role admin-user-role--${role}`}>{roleLabel(role)}</span></td><td>{userMemberships.length ? userMemberships.map((membership) => { const organization = organizations.find((item) => item.id === membership.organization_id); return <span className="admin-user-membership" key={membership.organization_id}><strong>{organization?.name || "Unknown dealer"}</strong><small>{membership.active ? membership.page_permissions.join(", ") : "Paused"}</small></span>; }) : <span className="is-muted">None</span>}</td><td>{user.email_confirmed_at ? <span className="admin-status admin-status--verified">Confirmed</span> : <span className="admin-status admin-status--needs-review">Invited</span>}</td><td>{formatDate(user.last_sign_in_at)}</td><td>{formatDate(user.created_at)}</td></tr>; })}</tbody></table>{visibleUsers.length === 0 ? <p className="admin-empty">No users match these filters.</p> : null}</div>
        </section>
      </>}
    </div>
  );
}
