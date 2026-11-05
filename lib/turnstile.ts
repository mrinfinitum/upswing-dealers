import "server-only";

import { headers } from "next/headers";

// Cloudflare's documented always-pass test keys, used only outside production.
const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";
// Public site key for the "UpSwing Golf site forms" widget (covers upswinggolf.com and subdomains).
const PRODUCTION_SITE_KEY = "0x4AAAAAAFivclYk3k3GRhKl";

const isProduction = process.env.NODE_ENV === "production";

export function getTurnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (isProduction ? PRODUCTION_SITE_KEY : TEST_SITE_KEY);
}

function getTurnstileSecretKey() {
  return process.env.TURNSTILE_SECRET_KEY || (isProduction ? "" : TEST_SECRET_KEY);
}

export type TurnstileResult = "ok" | "failed" | "unavailable";

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<TurnstileResult> {
  const secret = getTurnstileSecretKey();
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not configured; protected forms cannot be verified.");
    return "unavailable";
  }
  if (!token) return "failed";

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
    if (!response.ok) return "unavailable";
    const result = await response.json() as { success?: boolean };
    return result.success ? "ok" : "failed";
  } catch {
    return "unavailable";
  }
}

// Verifies the widget token a form posted. Vercel sets x-real-ip and x-forwarded-for itself, so unlike
// cf-connecting-ip (which a visitor could send) they reflect the real client address.
export async function verifyTurnstileForm(formData: FormData) {
  const requestHeaders = await headers();
  const remoteIp = requestHeaders.get("x-real-ip") || requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  return verifyTurnstileToken(String(formData.get("cf-turnstile-response") ?? ""), remoteIp);
}
