import type { Metadata } from "next";
import Image from "next/image";
import { DealerResetPasswordForm } from "@/components/portal/dealer-reset-password-form";

export const metadata: Metadata = { title: "Create dealer portal password", robots: { index: false, follow: false } };

export default function DealerResetPasswordPage() {
  return <main className="portal-login"><section className="portal-login-card portal-login-card--compact"><div className="portal-login-card__brand"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={230} height={65} priority /></div><div className="portal-login-card__body"><p className="portal-kicker">Partner portal</p><h1>Create your password.</h1><p>Use a unique password with at least 12 characters.</p><DealerResetPasswordForm /></div></section></main>;
}
