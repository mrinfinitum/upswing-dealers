import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getAdminIdentity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || claims?.app_metadata?.role !== "admin") return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "Administrator",
  };
}

export async function requireAdmin() {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/admin/login");
  return identity;
}
