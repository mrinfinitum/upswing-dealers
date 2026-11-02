"use server";

import { headers } from "next/headers";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";
import { canonicalSiteUrl } from "@/lib/site";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstileToken } from "@/lib/turnstile";

export type ForgotPasswordState = { status: "idle" | "error" | "sent"; message?: string; email?: string };

const resetPaths = { admin: "/admin/reset-password", dealer: "/partner/reset-password" } as const;

export async function requestPasswordResetAction(_: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "error", message: "Enter the email address you sign in with.", email };

  const requestHeaders = await headers();
  const remoteIp = requestHeaders.get("cf-connecting-ip") || requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  const verification = await verifyTurnstileToken(String(formData.get("cf-turnstile-response") ?? ""), remoteIp);
  if (verification === "failed") return { status: "error", message: "We couldn’t confirm you’re human. Please complete the check and try again.", email };
  if (verification === "unavailable") return { status: "error", message: "Password resets are temporarily unavailable. Please email info@upswinggolf.com.", email };

  // Every outcome below returns the same "sent" state so the form never reveals which emails have accounts.
  const supabase = createSupabaseAdminClient();
  const generate = (role: keyof typeof resetPaths) => supabase.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: `${canonicalSiteUrl}${resetPaths[role]}` } });

  let { data, error } = await generate("admin");
  const role = data?.user?.app_metadata?.role;
  if (!error && role === "dealer") ({ data, error } = await generate("dealer"));

  if (!error && data?.properties?.action_link && (role === "admin" || role === "dealer")) {
    await sendPasswordResetEmail(email, data.properties.action_link);
  } else if (error && error.status !== 404 && error.code !== "user_not_found") {
    console.error("Password reset link generation failed", error.status, error.code);
  }

  return { status: "sent", email };
}
