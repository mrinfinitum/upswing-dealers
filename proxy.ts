import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Keep public static files, including /email-assets/:path*, outside the auth proxy.
  matcher: ["/admin/:path*", "/partner/:path*", "/image-gallery/:path*"],
};
