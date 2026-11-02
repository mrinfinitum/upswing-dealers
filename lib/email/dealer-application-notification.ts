import "server-only";

import { BUSINESS_TYPES, type DealerApplication } from "@/lib/dealers/application";
import { emailButton, emailShell, escapeHtml, sendEmail } from "@/lib/email/resend";
import { canonicalSiteUrl } from "@/lib/site";

const DEFAULT_TO = "info@upswinggolf.com";

// The application is already saved when this runs, so a failed send is only logged.
export async function sendDealerApplicationNotification(dealerId: string, application: DealerApplication) {
  const reviewUrl = `${canonicalSiteUrl}/admin/locations/${encodeURIComponent(dealerId)}?returnTo=${encodeURIComponent("/admin/applications")}`;
  const listUrl = `${canonicalSiteUrl}/admin/applications`;
  const location = [application.city, application.region, application.country].join(", ");
  const rows: Array<[string, string | undefined]> = [
    ["Business", application.businessName],
    ["Type", BUSINESS_TYPES[application.businessType]],
    ["Address", [application.addressLine1, application.addressLine2, `${application.city}, ${application.region} ${application.postalCode}`, application.country].filter(Boolean).join("\n")],
    ["Store phone", application.storePhone],
    ["Website", application.website],
    ["Years in business", application.yearsInBusiness],
    ["Contact", application.contactName],
    ["Contact email", application.contactEmail],
    ["Contact phone", application.contactPhone],
    ["Message", application.message],
  ];
  const presentRows = rows.filter((row): row is [string, string] => Boolean(row[1]));

  const text = [
    "A new dealer application was submitted on dealers.upswinggolf.com.",
    "",
    ...presentRows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Review this application: ${reviewUrl}`,
    `All applications: ${listUrl}`,
  ].join("\n");

  const html = emailShell(`<p style="margin:0 0 6px;color:#347ee4;font-size:12px;letter-spacing:.12em;text-transform:uppercase">New dealer application</p>
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.2">${escapeHtml(application.businessName)}<br><span style="color:#626262;font-size:16px;font-weight:normal">${escapeHtml(location)}</span></h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5">
${presentRows.map(([label, value]) => `<tr><td style="padding:6px 12px 6px 0;color:#626262;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;white-space:pre-line">${escapeHtml(value)}</td></tr>`).join("\n")}
</table>
<p style="margin:28px 0 12px">${emailButton(reviewUrl, "Review application")}</p>
<p style="margin:0;font-size:13px;color:#626262">Or see <a href="${listUrl}" style="color:#347ee4">all applications</a>. The store stays off the public locator until it’s approved.</p>`);

  await sendEmail({
    to: (process.env.DEALER_APPLICATION_EMAIL_TO || DEFAULT_TO).split(",").map((address) => address.trim()).filter(Boolean),
    replyTo: application.contactEmail,
    subject: `New dealer application: ${application.businessName} (${location})`,
    text,
    html,
  });
}
