"use client";

import { useActionState, useState } from "react";
import { addUserAction } from "@/app/admin/(protected)/users/actions";
import { initialAdminUserFormState } from "@/lib/admin/user-form-state";
import type { PortalPageKey } from "@/types/portal";

const pages: { key: PortalPageKey; label: string; description: string }[] = [
  { key: "dashboard", label: "Overview", description: "Portal home and organization summary" },
  { key: "locations", label: "Locations", description: "View assigned dealer locations" },
  { key: "brand", label: "Brand resources", description: "Standards and approved downloads" },
];

export function AddUserForm({ organizations }: { organizations: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addUserAction, initialAdminUserFormState);
  const [role, setRole] = useState<"admin" | "dealer">("dealer");

  return (
    <form action={action} className="admin-user-create-form">
      <div className="admin-form-grid">
        <div className="admin-field"><label htmlFor="userDisplayName">Name</label><input id="userDisplayName" name="displayName" autoComplete="name" /></div>
        <div className="admin-field"><label htmlFor="userEmail">Email</label><input id="userEmail" name="email" type="email" autoComplete="email" required /></div>
        <div className="admin-field"><label htmlFor="userRole">User group</label><select id="userRole" name="role" value={role} onChange={(event) => setRole(event.target.value as "admin" | "dealer")}><option value="dealer">Dealer</option><option value="admin">UpSwing administrator</option></select></div>
        <div className="admin-field admin-field--wide"><label className="admin-field-label-split" htmlFor="userPassword"><span>Temporary password</span><small>At least 12 characters</small></label><input id="userPassword" name="password" type="password" minLength={12} autoComplete="new-password" required /></div>
        {role === "dealer" ? <div className="admin-field admin-field--wide"><label htmlFor="userOrganization">Dealer organization</label><select id="userOrganization" name="organizationId" required><option value="">Choose organization</option>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></div> : null}
      </div>
      {role === "dealer" ? <fieldset className="admin-permissions"><legend>Page permissions</legend>{pages.map((page) => <label key={page.key}><input type="checkbox" name={`permission-${page.key}`} defaultChecked /><span><strong>{page.label}</strong><small>{page.description}</small></span></label>)}</fieldset> : <p className="admin-form-help">UpSwing administrators receive full access to dealers, locations, users, and account permissions.</p>}
      {state.message ? <p className={state.success ? "admin-notice" : "admin-form-error"} role="status">{state.message}</p> : null}
      <button className="admin-button admin-button--primary admin-add-button" disabled={pending} type="submit">{pending ? "Creating…" : <>Add user <span aria-hidden="true">＋</span></>}</button>
    </form>
  );
}
