"use server";

import { redirect } from "next/navigation";
import type { PortalFormState } from "@/lib/portal/form-state";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileForm } from "@/lib/turnstile";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

// Single sign-in for the portal home page: administrators land in /admin, dealers in /partner.
export async function portalSignInAction(_: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const email = text(formData, "email");
  // Passwords are compared exactly as typed; trimming would reject passwords that start or end with a space.
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { message: "Enter your email and password." };

  // Sign-ins reach Supabase from Vercel's servers, so its per-IP limits can't tell visitors apart; this stops scripted guessing.
  const verification = await verifyTurnstileForm(formData);
  if (verification === "failed") return { message: "We couldn’t confirm you’re human. Please complete the check and try again." };
  if (verification === "unavailable") return { message: "Sign-in is temporarily unavailable. Please try again in a few minutes." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { message: "That email and password combination wasn’t recognized." };

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const role = claims?.app_metadata?.role;
  if (role === "admin") redirect("/admin");

  if (role === "dealer" && claims?.sub) {
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("dealer_portal_users").select("active").eq("user_id", claims.sub).eq("active", true).maybeSingle(),
      supabase.from("dealer_memberships").select("organization_id", { count: "exact", head: true }).eq("user_id", claims.sub).eq("active", true),
    ]);
    if (profile && count) redirect("/partner");
    await supabase.auth.signOut();
    return { message: "Your dealer access is inactive or hasn’t been assigned yet. Contact your UpSwing representative." };
  }

  await supabase.auth.signOut();
  return { message: "This account doesn’t have access to the dealer portal." };
}
