import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getAdminIdentity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || claims?.app_metadata?.role !== "admin") return null;

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

export async function requireAdmin() {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/admin/login");
  return identity;
}
