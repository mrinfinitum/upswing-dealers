import { redirect } from "next/navigation";
import { portalPagePaths } from "@/lib/portal/access";
import { getDealerPortalIdentity } from "@/lib/portal/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Server Components cannot clear the session cookies, so revoked dealer sessions are ended here.
// Proxy only admits dealer-role sessions, and a dealer with usable access is never signed out.
export async function GET() {
  if (await getDealerPortalIdentity()) redirect(portalPagePaths.dashboard);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/partner/login?access=inactive");
}
