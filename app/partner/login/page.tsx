import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DealerLoginForm } from "@/components/portal/dealer-login-form";

export const metadata: Metadata = { title: "Dealer portal sign in", robots: { index: false, follow: false } };

export default function DealerLoginPage() {
  return (
    <main className="portal-login">
      <section className="portal-login-card" aria-labelledby="dealer-login-title">
        <div className="portal-login-card__brand"><Link href="/"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={230} height={65} priority /></Link><p>Authorized dealer resources</p></div>
        <div className="portal-login-card__body"><p className="portal-kicker">Partner portal</p><h1 id="dealer-login-title">Welcome back.</h1><p>Sign in to manage assigned locations and access approved UpSwing brand resources.</p><DealerLoginForm /></div>
      </section>
    </main>
  );
}
