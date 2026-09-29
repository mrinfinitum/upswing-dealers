import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DealerLoginForm } from "@/components/portal/dealer-login-form";

export const metadata: Metadata = { title: "Dealer portal sign in", robots: { index: false, follow: false } };

export default async function DealerLoginPage({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const { access } = await searchParams;
  return (
    <main className="portal-login">
      <section className="portal-login-card" aria-labelledby="dealer-login-title">
        <div className="portal-login-card__brand"><Link href="/"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={230} height={65} priority /></Link><p>Authorized dealer resources</p></div>
        <div className="portal-login-card__body"><p className="portal-kicker">Partner portal</p><h1 id="dealer-login-title">Welcome back.</h1><p>Sign in to manage assigned locations and access approved UpSwing brand resources.</p>{access === "inactive" ? <p className="portal-notice" role="status">Your dealer access is inactive or has not been assigned. Contact your UpSwing representative for help.</p> : null}<DealerLoginForm /></div>
      </section>
    </main>
  );
}
