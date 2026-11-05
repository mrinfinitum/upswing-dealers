"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { logoutAction } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";

type Enrollment = { factorId: string; qrCode: string; secret: string };

// With a verified factor, checks a code; without one, enrolls a new authenticator and confirms it with a first code.
// Either way a correct code upgrades the session to aal2, which the proxy, admin pages, and RLS all require.
export function AdminMfaForm({ factorId, email }: { factorId?: string; email: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [enrollment, setEnrollment] = useState<Enrollment>();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (factorId || started.current) return;
    started.current = true;

    async function enroll() {
      // Abandoned setups leave unverified factors behind; clear them so this attempt gets a fresh secret.
      const { data: factors } = await supabase.auth.mfa.listFactors();
      for (const factor of factors?.all ?? []) {
        if (factor.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "UpSwing Dealer Portal",
        friendlyName: `Authenticator ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
      });
      if (error || !data) return setMessage("Authenticator setup couldn’t start. Reload the page to try again.");
      setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    }

    enroll();
  }, [factorId, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").replace(/\s+/g, "");
    const targetFactor = factorId ?? enrollment?.factorId;
    if (!/^\d{6}$/.test(code)) return setMessage("Enter the 6-digit code from your authenticator app.");
    if (!targetFactor) return;

    setPending(true);
    setMessage("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: targetFactor, code });
    if (error) {
      setPending(false);
      return setMessage(error.code === "over_request_rate_limit" || error.status === 429
        ? "Too many attempts. Wait a few minutes and try again."
        : "That code didn’t work. Codes change every 30 seconds, so enter the newest one.");
    }
    // The browser client has already stored the upgraded (aal2) session cookies, so the next request is admitted.
    router.replace("/admin");
    router.refresh();
  }

  const needsEnrollment = !factorId;

  return (
    <div className="admin-mfa">
      {needsEnrollment ? (
        enrollment ? (
          <div className="admin-mfa__setup">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase returns the QR code as an SVG data URL */}
            <img className="admin-mfa__qr" src={enrollment.qrCode} alt={`QR code to add ${email || "this account"} to an authenticator app`} width={200} height={200} />
            <div>
              <p>Can’t scan it? Add the account manually with this setup key:</p>
              {showSecret ? <code className="admin-mfa__secret">{enrollment.secret.match(/.{1,4}/g)?.join(" ")}</code> : null}
              <button className="admin-text-button" type="button" onClick={() => setShowSecret((value) => !value)}>{showSecret ? "Hide setup key" : "Show setup key"}</button>
            </div>
          </div>
        ) : !message ? <p className="admin-form-help" role="status">Preparing your authenticator setup…</p> : null
      ) : null}

      {!needsEnrollment || enrollment ? (
        <form className="admin-login__form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label htmlFor="mfa-code">{needsEnrollment ? "Enter the 6-digit code it shows" : "6-digit code"}</label>
            <input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus />
          </div>
          {message ? <p className="admin-form-error" role="alert">{message}</p> : null}
          <button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? "Verifying…" : needsEnrollment ? "Turn on two-step verification" : "Verify"}</button>
        </form>
      ) : message ? <p className="admin-form-error" role="alert">{message}</p> : null}

      <form action={logoutAction} className="admin-mfa__signout">
        <p>{needsEnrollment ? "Lost access or need help? Another UpSwing administrator can reset two-step verification from the Users page." : "Lost your phone? Ask another UpSwing administrator to reset your two-step verification from the Users page."}</p>
        <button className="admin-text-button" type="submit">Sign out</button>
      </form>
    </div>
  );
}
