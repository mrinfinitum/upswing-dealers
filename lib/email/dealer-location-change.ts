import "server-only";

import { emailButton, emailShell, escapeHtml, sendEmail } from "@/lib/email/resend";
import { canonicalSiteUrl } from "@/lib/site";
import type { Dealer } from "@/types/dealer";

export type LocationChange = { label: string; before?: string; after?: string };

const headlines = {
  added: "added a location",
  edited: "edited a location",
  removed: "removed a location from the locator",
  restored: "restored a location to the locator",
} as const;

// Dealer changes publish immediately, so this email is UpSwing's record of what changed and who changed it.
export async function sendDealerLocationChangeEmail({ kind, dealer, organizationName, actorEmail, changes }: {
  kind: keyof typeof headlines;
  dealer: Dealer;
  organizationName: string;
  actorEmail: string;
  changes: LocationChange[];
}) {
  const adminUrl = `${canonicalSiteUrl}/admin/locations/${encodeURIComponent(dealer.id)}`;
  const label = dealer.locationName || `${dealer.name} ${dealer.city}`;
  const place = [dealer.city, dealer.stateProvince, dealer.country].filter(Boolean).join(", ");
  const summary = `${actorEmail} (${organizationName}) ${headlines[kind]}.`;
  const showBefore = kind === "edited";

  const text = [
    summary,
    `${label} — ${place}`,
    "",
    ...changes.map((change) => showBefore ? `${change.label}: ${change.before ?? "(blank)"} → ${change.after ?? "(blank)"}` : `${change.label}: ${change.after ?? ""}`),
    "",
    "This change is already live on the public locator.",
    `View in admin: ${adminUrl}`,
  ].join("\n");

  const rows = changes.map((change) => `<tr><td style="padding:6px 12px 6px 0;color:#626262;vertical-align:top;white-space:nowrap">${escapeHtml(change.label)}</td><td style="padding:6px 0">${showBefore ? `<span style="color:#8a2f2b;text-decoration:line-through">${escapeHtml(change.before ?? "(blank)")}</span><br>` : ""}<strong>${escapeHtml(change.after ?? "(blank)")}</strong></td></tr>`).join("\n");

  const html = emailShell(`<p style="margin:0 0 6px;color:#347ee4;font-size:12px;letter-spacing:.12em;text-transform:uppercase">Dealer location ${escapeHtml(kind)}</p>
<h1 style="margin:0 0 8px;font-size:24px;line-height:1.2">${escapeHtml(label)}<br><span style="color:#626262;font-size:16px;font-weight:normal">${escapeHtml(place)}</span></h1>
<p style="margin:0 0 20px;font-size:14px;color:#333">${escapeHtml(summary)}</p>
${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5">${rows}</table>` : ""}
<p style="margin:24px 0 8px;font-size:13px;color:#626262">This change is already live on the public locator.</p>
<p style="margin:0">${emailButton(adminUrl, "View in admin")}</p>`);

  await sendEmail({
    to: (process.env.DEALER_APPLICATION_EMAIL_TO || "info@upswinggolf.com").split(",").map((address) => address.trim()).filter(Boolean),
    replyTo: actorEmail,
    subject: `Dealer location ${kind}: ${label} (${organizationName})`,
    text,
    html,
  });
}
