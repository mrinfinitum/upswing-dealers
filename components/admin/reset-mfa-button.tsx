"use client";

import { useActionState, useState } from "react";
import { resetUserMfaAction } from "@/app/admin/(protected)/users/actions";
import { initialAdminUserFormState } from "@/lib/admin/user-form-state";

export function ResetMfaButton({ userId, email }: { userId: string; email: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(resetUserMfaAction.bind(null, userId), initialAdminUserFormState);
  if (state.success) return <span className="admin-notice" role="status">{state.message}</span>;
  if (!confirming) return <button className="admin-danger-link" type="button" onClick={() => setConfirming(true)}>Reset 2-step</button>;
  return <form action={action} className="admin-user-delete"><p>Reset two-step verification for {email}? Only do this after confirming who is asking. They’ll set up a new authenticator at their next sign-in.</p>{state.message ? <span className="admin-form-error" role="status">{state.message}</span> : null}<div><button className="admin-button admin-button--danger" disabled={pending} type="submit">{pending ? "Resetting…" : "Confirm reset"}</button><button className="admin-button" type="button" onClick={() => setConfirming(false)}>Cancel</button></div></form>;
}
