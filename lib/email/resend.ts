import "server-only";

import { canonicalSiteUrl } from "@/lib/site";

// send.upswinggolf.com is the Resend-verified domain shared with the storefront; bare upswinggolf.com is not.
const DEFAULT_FROM = "UpSwing Dealer Portal <dealers@send.upswinggolf.com>";

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export function emailShell(content: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f3f3f1;font-family:Helvetica,Arial,sans-serif;color:#000">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#000;padding:20px 28px"><img src="${canonicalSiteUrl}/email-assets/upswing-logo-white.png" alt="UpSwing Golf" width="140" style="display:block;height:auto"></td></tr>
<tr><td style="padding:28px">${content}</td></tr></table></body></html>`;
}

export function emailButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#347ee4;color:#fff;font-weight:bold;text-decoration:none">${escapeHtml(label)}</a>`;
}

type EmailMessage = { to: string[]; subject: string; text: string; html: string; replyTo?: string };

// Sends through the Resend REST API. Failures are logged and reported as false, never thrown.
export async function sendEmail(message: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`RESEND_API_KEY is not configured; skipping email "${message.subject}".`);
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.DEALER_PORTAL_EMAIL_FROM || process.env.DEALER_APPLICATION_EMAIL_FROM || DEFAULT_FROM,
        to: message.to,
        reply_to: message.replyTo,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`Email "${message.subject}" failed`, response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Email "${message.subject}" failed`, error);
    return false;
  }
}
