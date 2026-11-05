"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction, type ForgotPasswordState } from "@/app/forgot-password/actions";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";

const initialState: ForgotPasswordState = { status: "idle" };

export function ForgotPasswordForm({ siteKey }: { siteKey: string }) {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.status === "sent") {
    return (
      <div className="portal-home__sent" role="status">
        <p className="portal-home__lead">If <strong>{state.email}</strong> has a dealer portal account, a reset link is on its way. It works once and expires in one hour.</p>
        <p className="portal-home__help">Don’t see it within a few minutes? Check your spam folder, or email <a href="mailto:info@upswinggolf.com">info@upswinggolf.com</a>.</p>
        <Link className="portal-home__submit" href="/">Back to sign in<span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  return (
    <>
      <p className="portal-home__lead">Enter the email you sign in with and we’ll send you a link to choose a new password.</p>
      <form action={action} className="portal-home__form">
        <div className="portal-home__field">
          <label htmlFor="forgot-email">Email</label>
          <input key={state.email} id="forgot-email" name="email" type="email" autoComplete="username" placeholder="you@yourshop.com" defaultValue={state.email} required />
        </div>
        {/* Each token is single-use, so a failed request gets a fresh challenge. */}
        <TurnstileWidget siteKey={siteKey} action="password-reset" resetKey={state.status === "error" ? state : undefined} />
        {state.status === "error" && state.message ? <p className="portal-home__error" role="alert">{state.message}</p> : null}
        <button className="portal-home__submit" disabled={pending} type="submit">
          {pending ? "Sending…" : "Send reset link"}<span aria-hidden="true">→</span>
        </button>
      </form>
    </>
  );
}
