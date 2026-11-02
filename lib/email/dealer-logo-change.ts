import "server-only";

import { dealerLogoUrl } from "@/lib/dealers/logo-url";
import { emailButton, emailShell, escapeHtml, sendEmail } from "@/lib/email/resend";
import { canonicalSiteUrl } from "@/lib/site";

// Dealer logo changes publish immediately, so this email is UpSwing's record of the new artwork.
export async function sendDealerLogoChangeEmail({ organizationId, organizationName, actorEmail, logoPath }: {
  organizationId: string;
  organizationName: string;
  actorEmail: string;
  logoPath: string | null;
}) {
  const adminUrl = `${canonicalSiteUrl}/admin/dealers/${encodeURIComponent(organizationId)}`;
  const logoUrl = dealerLogoUrl(logoPath);
  const summary = `${actorEmail} (${organizationName}) ${logoUrl ? "uploaded a new logo" : "removed their logo"}.`;

  const text = [
    summary,
    ...(logoUrl ? ["", `Logo: ${logoUrl}`] : []),
    "",
    "This change is already live on the public locator.",
    `View in admin: ${adminUrl}`,
  ].join("\n");

  const html = emailShell(`<p style="margin:0 0 6px;color:#347ee4;font-size:12px;letter-spacing:.12em;text-transform:uppercase">Dealer logo ${logoUrl ? "updated" : "removed"}</p>
<h1 style="margin:0 0 8px;font-size:24px;line-height:1.2">${escapeHtml(organizationName)}</h1>
<p style="margin:0 0 20px;font-size:14px;color:#333">${escapeHtml(summary)}</p>
${logoUrl ? `<p style="margin:0 0 20px;padding:24px;border:1px solid #e3e3e0;border-radius:10px;text-align:center"><img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(organizationName)} logo" style="max-width:260px;max-height:90px;height:auto"></p>` : ""}
<p style="margin:0 0 8px;font-size:13px;color:#626262">This change is already live on the public locator.</p>
<p style="margin:0">${emailButton(adminUrl, "View in admin")}</p>`);

  await sendEmail({
    to: (process.env.DEALER_APPLICATION_EMAIL_TO || "info@upswinggolf.com").split(",").map((address) => address.trim()).filter(Boolean),
    replyTo: actorEmail,
    subject: `Dealer logo ${logoUrl ? "updated" : "removed"}: ${organizationName}`,
    text,
    html,
  });
}
