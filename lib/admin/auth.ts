import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_MFA_PATH = "/admin/mfa";

// Administrator sessions only count once the second factor is verified (aal2); a password alone is not enough.
export async function getAdminIdentity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || claims?.app_metadata?.role !== "admin" || claims.aal !== "aal2") return null;

  const email = typeof claims.email === "string" ? claims.email : "Administrator";
  const metadata = claims.user_metadata && typeof claims.user_metadata === "object" ? claims.user_metadata as Record<string, unknown> : {};
  const metadataName = typeof metadata.display_name === "string" ? metadata.display_name.trim() : "";
  const fallbackName = email.split("@")[0].split(/[._-]+/).filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");

  return {
    id: claims.sub,
    email,
    displayName: metadataName || fallbackName || "Administrator",
  };
}

// True for an administrator who has signed in with a password but not yet completed the authenticator step.
export async function adminNeedsMfa() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.app_metadata?.role === "admin" && data.claims.aal !== "aal2";
}

export async function requireAdmin() {
  const identity = await getAdminIdentity();
  if (!identity) redirect(await adminNeedsMfa() ? ADMIN_MFA_PATH : "/");
  return identity;
}
