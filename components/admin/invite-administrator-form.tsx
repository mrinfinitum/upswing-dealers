"use client";

import { useActionState } from "react";
import { inviteAdministratorAction } from "@/app/admin/(protected)/users/actions";
import { initialAdminUserFormState } from "@/lib/admin/user-form-state";

export function InviteAdministratorForm() {
  const [state, action, pending] = useActionState(inviteAdministratorAction, initialAdminUserFormState);
  return (
    <form action={action} className="admin-user-invite-form">
      <div className="admin-form-grid">
        <div className="admin-field"><label htmlFor="adminDisplayName">Name</label><input id="adminDisplayName" name="displayName" autoComplete="name" /></div>
        <div className="admin-field"><label htmlFor="adminEmail">Email</label><input id="adminEmail" name="email" type="email" autoComplete="email" required /></div>
      </div>
      <p className="admin-form-help">The user will receive a secure invitation to create a password. Administrator access is stored in protected account metadata.</p>
      {state.message ? <p className={state.success ? "admin-notice" : "admin-form-error"} role="status">{state.message}</p> : null}
      <button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? "Sending invitation…" : "Invite administrator"}</button>
    </form>
  );
}
