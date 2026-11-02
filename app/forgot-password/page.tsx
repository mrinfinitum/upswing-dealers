import type { Metadata } from "next";
import Link from "next/link";
import { PortalAuthShell } from "@/components/auth/portal-auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getTurnstileSiteKey } from "@/lib/turnstile";

export const metadata: Metadata = {
  title: "Reset your password | UpSwing Dealer Portal",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <PortalAuthShell labelledBy="forgot-password-title">
      <Link className="portal-home__back" href="/"><span aria-hidden="true">←</span> Back to sign in</Link>
      <p className="portal-home__kicker">Password help</p>
      <h1 id="forgot-password-title">Reset your password</h1>
      <ForgotPasswordForm siteKey={getTurnstileSiteKey()} />
    </PortalAuthShell>
  );
}
