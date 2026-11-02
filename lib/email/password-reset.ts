import "server-only";

import { emailButton, emailShell, sendEmail } from "@/lib/email/resend";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const text = [
    "We received a request to reset the password for your UpSwing dealer portal account.",
    "",
    `Choose a new password: ${resetUrl}`,
    "",
    "This link works once and expires in one hour. If you didn't ask for a reset, you can ignore this email; your password won't change.",
  ].join("\n");

  const html = emailShell(`<p style="margin:0 0 6px;color:#347ee4;font-size:12px;letter-spacing:.12em;text-transform:uppercase">Dealer portal</p>
<h1 style="margin:0 0 14px;font-size:24px;line-height:1.2">Reset your password</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#333">We received a request to reset the password for your UpSwing dealer portal account.</p>
<p style="margin:0 0 24px">${emailButton(resetUrl, "Choose a new password")}</p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#626262">This link works once and expires in one hour. If you didn’t ask for a reset, you can ignore this email; your password won’t change.</p>`);

  return sendEmail({ to: [email], subject: "Reset your UpSwing dealer portal password", text, html });
}
