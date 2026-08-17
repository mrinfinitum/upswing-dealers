"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type RecoveryState = "checking" | "ready" | "invalid" | "saving" | "complete";

export function DealerResetPasswordForm() {
  const supabase = useMemo(() => createClient(), []);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function establishSession() {
      const code = new URLSearchParams(window.location.search).get("code");
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && active) return setRecoveryState("invalid");
        window.history.replaceState({}, "", window.location.pathname);
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error && active) return setRecoveryState("invalid");
        window.history.replaceState({}, "", window.location.pathname);
      }
      const { data } = await supabase.auth.getSession();
      if (active) setRecoveryState(data.session ? "ready" : "invalid");
    }
    establishSession();
    return () => { active = false; };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");
    if (password.length < 12) return setMessage("Use at least 12 characters.");
    if (password !== confirmation) return setMessage("The passwords do not match.");
    setRecoveryState("saving");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("The password could not be updated. Ask your UpSwing contact for a new invitation.");
      return setRecoveryState("ready");
    }
    await supabase.auth.signOut();
    setRecoveryState("complete");
  }

  if (recoveryState === "checking") return <p role="status">Checking your secure invitation…</p>;
  if (recoveryState === "invalid") return <div><p className="portal-form-error" role="alert">This invitation is invalid or has expired.</p><a href="/partner/login">Return to sign in</a></div>;
  if (recoveryState === "complete") return <div><p>Password created. You can now access the dealer portal.</p><a className="portal-button portal-button--light" href="/partner/login">Sign in <span aria-hidden="true">→</span></a></div>;

  return (
    <form className="portal-login-form" onSubmit={handleSubmit}>
      <div className="portal-field"><label htmlFor="new-password">New password</label><input id="new-password" name="password" type="password" minLength={12} autoComplete="new-password" required /></div>
      <div className="portal-field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" name="passwordConfirmation" type="password" minLength={12} autoComplete="new-password" required /></div>
      {message ? <p className="portal-form-error" role="alert">{message}</p> : null}
      <button className="portal-button portal-button--light" disabled={recoveryState === "saving"} type="submit">{recoveryState === "saving" ? "Saving…" : "Create password"}</button>
    </form>
  );
}
