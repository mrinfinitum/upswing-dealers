"use client";

import { useActionState } from "react";
import { dealerLoginAction } from "@/app/partner/actions";
import { initialPortalFormState } from "@/lib/portal/form-state";

export function DealerLoginForm() {
  const [state, action, pending] = useActionState(dealerLoginAction, initialPortalFormState);
  return (
    <form action={action} className="portal-login-form">
      <div className="portal-field">
        <label htmlFor="dealer-email">Email</label>
        <input id="dealer-email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="portal-field">
        <label htmlFor="dealer-password">Password</label>
        <input id="dealer-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.message ? <p className="portal-form-error" role="alert">{state.message}</p> : null}
      <button className="portal-button portal-button--light" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}<span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
