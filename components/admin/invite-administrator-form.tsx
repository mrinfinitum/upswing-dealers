"use client";

import { useActionState, useState } from "react";
import { inviteUserAction } from "@/app/admin/(protected)/users/actions";
import { initialAdminUserFormState } from "@/lib/admin/user-form-state";
import type { PortalPageKey } from "@/types/portal";

const pages: { key: PortalPageKey; label: string; description: string }[] = [
  { key: "dashboard", label: "Overview", description: "Portal home and organization summary" },
  { key: "locations", label: "Locations", description: "Assigned stores and update requests" },
  { key: "brand", label: "Brand resources", description: "Standards and approved downloads" },
];

export function InviteUserForm({ organizations }: { organizations: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(inviteUserAction, initialAdminUserFormState);
  const [role, setRole] = useState<"admin" | "dealer">("dealer");

  return (
    <form action={action} className="admin-user-invite-form">
      <div className="admin-form-grid">
        <div className="admin-field"><label htmlFor="userDisplayName">Name</label><input id="userDisplayName" name="displayName" autoComplete="name" /></div>
        <div className="admin-field"><label htmlFor="userEmail">Email</label><input id="userEmail" name="email" type="email" autoComplete="email" required /></div>
        <div className="admin-field admin-field--wide"><label htmlFor="userRole">User group</label><select id="userRole" name="role" value={role} onChange={(event) => setRole(event.target.value as "admin" | "dealer")}><option value="dealer">Dealer admin</option><option value="admin">UpSwing administrator</option></select></div>
        {role === "dealer" ? <div className="admin-field admin-field--wide"><label htmlFor="userOrganization">Dealer organization</label><select id="userOrganization" name="organizationId" required><option value="">Choose organization</option>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></div> : null}
      </div>
      {role === "dealer" ? <fieldset className="admin-permissions"><legend>Page permissions</legend>{pages.map((page) => <label key={page.key}><input type="checkbox" name={`permission-${page.key}`} defaultChecked /><span><strong>{page.label}</strong><small>{page.description}</small></span></label>)}</fieldset> : <p className="admin-form-help">UpSwing administrators receive full access to locations, dealer accounts, requests, and user administration.</p>}
      <p className="admin-form-help">The user will receive a secure invitation to create a password. Account groups are stored in protected metadata.</p>
      {state.message ? <p className={state.success ? "admin-notice" : "admin-form-error"} role="status">{state.message}</p> : null}
      <button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? "Sending invitation…" : "Invite user"}</button>
    </form>
  );
}
