"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";
import { initialAdminFormState } from "@/lib/admin/form-state";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialAdminFormState);
  return (
    <form action={action} className="admin-login__form">
      <div className="admin-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="admin-field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.message ? <p className="admin-form-error" role="alert">{state.message}</p> : null}
      <button className="admin-button admin-button--primary" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="admin-login__recovery">Lost your password? Ask an authorized project owner to send a recovery email.</p>
    </form>
  );
}
