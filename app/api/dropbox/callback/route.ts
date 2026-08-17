import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/auth";
import { isDropboxBootstrapEnabled } from "@/lib/dropbox/config";
import { exchangeDropboxAuthorizationCode } from "@/lib/dropbox/server";

export const dynamic = "force-dynamic";

function secureText(message: string, status = 200) {
  const response = new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
  response.cookies.set("dropbox_oauth_state", "", { path: "/api/dropbox/callback", maxAge: 0, httpOnly: true, sameSite: "lax" });
  return response;
}

function validState(expected: string | undefined, supplied: string | null) {
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function GET(request: NextRequest) {
  if (!await getAdminIdentity()) return secureText("Unauthorized", 401);
  if (!isDropboxBootstrapEnabled()) return secureText("Dropbox OAuth bootstrap is disabled.", 404);

  const expectedState = request.cookies.get("dropbox_oauth_state")?.value;
  const suppliedState = request.nextUrl.searchParams.get("state");
  if (!validState(expectedState, suppliedState)) return secureText("Invalid or expired Dropbox OAuth state. Start the connection again.", 400);
  if (request.nextUrl.searchParams.get("error")) return secureText("Dropbox authorization was not completed.", 400);
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return secureText("Dropbox did not return an authorization code.", 400);

  try {
    const refreshToken = await exchangeDropboxAuthorizationCode(code);
    return secureText([
      "Dropbox authorization completed successfully.",
      "",
      "Copy the following line into Vercel as a server-only environment variable:",
      `DROPBOX_REFRESH_TOKEN=${refreshToken}`,
      "",
      "Then remove or set DROPBOX_OAUTH_BOOTSTRAP_ENABLED=false and redeploy.",
      "Close this browser tab after copying the token. This response is not cached.",
    ].join("\n"));
  } catch {
    return secureText("Dropbox authorization could not be completed. Verify the app configuration and try again.", 502);
  }
}
