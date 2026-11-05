"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type RecoveryState = "checking" | "ready" | "invalid" | "saving" | "complete";

export function ResetPasswordForm() {
  const supabase = useMemo(() => createClient(), []);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const [message, setMessage] = useState("");
  // Supabase only lets an aal2 session change the password of an account with two-step verification.
  const [mfaFactorId, setMfaFactorId] = useState<string>();

  useEffect(() => {
    let active = true;

    async function establishRecoverySession() {
      const code = new URLSearchParams(window.location.search).get("code");
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      const recoveryError = fragment.get("error_description");

      if (recoveryError) {
        if (active) {
          setMessage("This password-reset link is invalid or has expired.");
          setRecoveryState("invalid");
        }
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && active) {
          setMessage("This password-reset link is invalid or has expired.");
          setRecoveryState("invalid");
          return;
        }
        window.history.replaceState({}, "", window.location.pathname);
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error && active) {
          setMessage("This password-reset link is invalid or has expired.");
          setRecoveryState("invalid");
          return;
        }
        window.history.replaceState({}, "", window.location.pathname);
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        const [{ data: assurance }, { data: factors }] = await Promise.all([
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
          supabase.auth.mfa.listFactors(),
        ]);
        if (!active) return;
        if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") setMfaFactorId(factors?.totp[0]?.id);
        setRecoveryState("ready");
      }
      else {
        setMessage("This password-reset link is invalid or has expired.");
        setRecoveryState("invalid");
      }
    }

    establishRecoverySession();
    return () => { active = false; };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");

    if (password.length < 12) {
      setMessage("Use at least 12 characters.");
      return;
    }
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }

    const mfaCode = String(formData.get("mfaCode") ?? "").replace(/\s+/g, "");
    if (mfaFactorId && !/^\d{6}$/.test(mfaCode)) {
      setMessage("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setRecoveryState("saving");
    setMessage("");
    if (mfaFactorId) {
      const { error: mfaError } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactorId, code: mfaCode });
      if (mfaError) {
        setMessage("That authenticator code didn’t work. Enter the newest code and try again.");
        setRecoveryState("ready");
        return;
      }
      setMfaFactorId(undefined);
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("The password could not be updated. Request a new reset link and try again.");
      setRecoveryState("ready");
      return;
    }

    await supabase.auth.signOut();
    setRecoveryState("complete");
  }

  if (recoveryState === "checking") return <p className="admin-form-help" role="status">Checking your reset link…</p>;
  if (recoveryState === "complete") return <div className="admin-reset-complete"><p>Your password has been updated.</p><Link className="admin-button admin-button--primary" href="/">Return to sign in</Link></div>;
  if (recoveryState === "invalid") return <div><p className="admin-form-error" role="alert">{message}</p><Link href="/">Return to sign in</Link></div>;

  return (
    <form className="admin-login__form" onSubmit={handleSubmit}>
      <div className="admin-field"><label htmlFor="password">New password</label><input id="password" name="password" type="password" minLength={12} autoComplete="new-password" required /></div>
      <div className="admin-field"><label htmlFor="passwordConfirmation">Confirm new password</label><input id="passwordConfirmation" name="passwordConfirmation" type="password" minLength={12} autoComplete="new-password" required /></div>
      {mfaFactorId ? <div className="admin-field"><label htmlFor="mfaCode">Authenticator code</label><input id="mfaCode" name="mfaCode" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required /><small>Two-step verification is on for this account, so enter the 6-digit code from your app.</small></div> : null}
      {message ? <p className="admin-form-error" role="alert">{message}</p> : null}
      <button className="admin-button admin-button--primary" disabled={recoveryState === "saving"} type="submit">{recoveryState === "saving" ? "Updating…" : "Update password"}</button>
    </form>
  );
}
