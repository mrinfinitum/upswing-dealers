"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { portalSignInAction } from "@/app/actions";
import { initialPortalFormState } from "@/lib/portal/form-state";

export function PortalSignInForm() {
  const [state, action, pending] = useActionState(portalSignInAction, initialPortalFormState);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action} className="portal-home__form">
      <div className="portal-home__field">
        <label htmlFor="portal-email">Email</label>
        <input id="portal-email" name="email" type="email" autoComplete="username" placeholder="you@yourshop.com" required />
      </div>
      <div className="portal-home__field">
        <div className="portal-home__label-row"><label htmlFor="portal-password">Password</label><Link href="/forgot-password">Forgot password?</Link></div>
        <div className="portal-home__password">
          <input id="portal-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required />
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword} aria-controls="portal-password">{showPassword ? "Hide" : "Show"}</button>
        </div>
      </div>
      {state.message ? <p className="portal-home__error" role="alert">{state.message}</p> : null}
      <button className="portal-home__submit" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}<span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
