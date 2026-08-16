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
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdmin = data?.claims?.app_metadata?.role === "admin";

  if (isAdminRoute && !isLogin && !isAdmin) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin && isAdmin) {
    const locationsUrl = request.nextUrl.clone();
    locationsUrl.pathname = "/admin/locations";
    locationsUrl.search = "";
    return NextResponse.redirect(locationsUrl);
  }

  return response;
}
