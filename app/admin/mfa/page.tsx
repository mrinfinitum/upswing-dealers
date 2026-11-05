import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminMfaForm } from "@/components/admin/admin-mfa-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Two-step verification", robots: { index: false, follow: false } };

// Every administrator passes through here after the password: first-time setup if no authenticator is
// verified yet, otherwise a code check that upgrades the session to aal2.
export default async function AdminMfaPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (claims?.app_metadata?.role !== "admin") redirect("/");
  if (claims.aal === "aal2") redirect("/admin");

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verified = factors?.totp[0];
  const email = typeof claims.email === "string" ? claims.email : "";

  return (
    <main className="admin-login">
      <section className="admin-login__card" aria-labelledby="admin-mfa-title">
        <Link className="admin-login__logo" href="/"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={230} height={65} priority /></Link>
        <div className="admin-login__body">
          <p className="eyebrow">Two-step verification</p>
          <h1 id="admin-mfa-title">{verified ? "Enter your code" : "Set up your authenticator"}</h1>
          <p>{verified
            ? "Open your authenticator app and enter the 6-digit code for UpSwing Dealer Portal."
            : "Administrator accounts need a second step at sign-in. Scan the code below with an authenticator app such as Google Authenticator, 1Password, or Microsoft Authenticator."}</p>
          <AdminMfaForm factorId={verified?.id} email={email} />
        </div>
      </section>
    </main>
  );
}
