import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalAuthShell } from "@/components/auth/portal-auth-shell";
import { PortalSignInForm } from "@/components/auth/portal-sign-in-form";
import { dealerLocatorUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { getTurnstileSiteKey } from "@/lib/turnstile";

export const metadata: Metadata = {
  title: "UpSwing Dealer Portal | Sign in",
  description: "Sign in to the UpSwing Golf dealer portal.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

export default async function Home({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const { access } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const role = data?.claims?.app_metadata?.role;
  if (role === "admin") redirect("/admin");
  if (role === "dealer") redirect("/partner");

  return (
    <PortalAuthShell labelledBy="portal-home-title">
      <p className="portal-home__kicker">Welcome back</p>
      <h1 id="portal-home-title">Sign in to your account</h1>
      <p className="portal-home__lead">For UpSwing team members and authorized dealers.</p>
      {access === "inactive" ? <p className="portal-home__error" role="status">Your dealer access is inactive or hasn’t been assigned yet. Contact your UpSwing representative.</p> : null}
      <PortalSignInForm siteKey={getTurnstileSiteKey()} />
      <div className="portal-home__divider"><span>Not a dealer yet?</span></div>
      <div className="portal-home__links">
        <Link href="/become-a-dealer">Become an UpSwing dealer <span aria-hidden="true">→</span></Link>
        <a href={dealerLocatorUrl}>Find a dealer near you <span aria-hidden="true">↗</span></a>
      </div>
    </PortalAuthShell>
  );
}
