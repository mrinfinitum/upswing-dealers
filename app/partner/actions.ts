"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PortalFormState } from "@/lib/portal/form-state";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function dealerLoginAction(_: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const email = text(formData, "email");
  const password = text(formData, "password");
  if (!email || !password) return { message: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { message: "The email or password was not accepted." };

  const { data: claimsData } = await supabase.auth.getClaims();
  if (claimsData?.claims?.app_metadata?.role !== "dealer") {
    await supabase.auth.signOut();
    return { message: "This account does not have dealer portal access." };
  }

  const { data: profile } = await supabase
    .from("dealer_portal_users")
    .select("active")
    .eq("user_id", claimsData.claims.sub)
    .eq("active", true)
    .maybeSingle();
  const { count } = await supabase
    .from("dealer_memberships")
    .select("organization_id", { count: "exact", head: true })
    .eq("user_id", claimsData.claims.sub)
    .eq("active", true);

  if (!profile || !count) {
    await supabase.auth.signOut();
    return { message: "Your dealer access is inactive or has not been assigned." };
  }

  redirect("/partner");
}

export async function dealerLogoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/partner/login");
}
