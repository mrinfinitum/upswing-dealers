"use client";

import { useActionState, useState } from "react";
import { deleteUserAction } from "@/app/admin/(protected)/users/actions";
import { initialAdminUserFormState } from "@/lib/admin/user-form-state";

export function DeleteUserButton({ userId, email, isCurrent }: { userId: string; email: string; isCurrent: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteUserAction.bind(null, userId), initialAdminUserFormState);
  if (isCurrent) return <span className="is-muted">Current account</span>;
  if (!confirming) return <button className="admin-danger-link" type="button" onClick={() => setConfirming(true)}>Delete</button>;
  return <form action={action} className="admin-user-delete"><p>Delete {email}? This permanently removes login access.</p>{state.message ? <span className={state.success ? "admin-notice" : "admin-form-error"} role="status">{state.message}</span> : null}<div><button className="admin-button admin-button--danger" disabled={pending} type="submit">{pending ? "Deleting…" : "Confirm delete"}</button><button className="admin-button" type="button" onClick={() => setConfirming(false)}>Cancel</button></div></form>;
}
