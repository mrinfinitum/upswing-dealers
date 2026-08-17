import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/auth";
import { getDropboxOAuthConfig, isDropboxBootstrapEnabled } from "@/lib/dropbox/config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await getAdminIdentity()) return new Response("Unauthorized", { status: 401 });
  if (!isDropboxBootstrapEnabled()) return new Response("Dropbox OAuth bootstrap is disabled.", { status: 404 });

  const { appKey, redirectUri } = getDropboxOAuthConfig();
  const state = randomBytes(32).toString("base64url");
  const authorizationUrl = new URL("https://www.dropbox.com/oauth2/authorize");
  authorizationUrl.searchParams.set("client_id", appKey);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("token_access_type", "offline");
  authorizationUrl.searchParams.set("scope", "account_info.read files.metadata.read files.content.read");
  authorizationUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("dropbox_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/api/dropbox/callback",
    priority: "high",
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
