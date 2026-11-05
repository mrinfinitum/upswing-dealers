import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === "/admin/login";
  const isPasswordRecovery = pathname === "/admin/reset-password";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdmin = data?.claims?.app_metadata?.role === "admin";
  const isPartnerLogin = pathname === "/partner/login";
  const isPartnerRecovery = pathname === "/partner/reset-password";
  const isPartnerRoute = pathname === "/partner" || pathname.startsWith("/partner/");
  const isDealer = data?.claims?.app_metadata?.role === "dealer";
  const isGalleryRoute = pathname === "/image-gallery" || pathname.startsWith("/image-gallery/");

  // Signed-out visitors go to the single sign-in page at "/"; the legacy login paths redirect there too.
  if (isAdminRoute && !isLogin && !isPasswordRecovery && !isAdmin) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isGalleryRoute && !isAdmin && !isDealer) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isPartnerRoute && !isPartnerLogin && !isPartnerRecovery && !isDealer) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
