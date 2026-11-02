# Dealer applications

Prospective retailers apply at `/become-a-dealer`. The homepage "Become a retailer" button links there, and the "Become a retailer" button on the storefront's www.upswinggolf.com/pages/find-a-dealer page should link there as well.

## Flow

1. The applicant fills in their business details, store address (United States or Canada only), and a private contact. Cloudflare Turnstile and a hidden honeypot field filter out bots.
2. `submitDealerApplicationAction` (`app/become-a-dealer/actions.ts`) verifies the Turnstile token server-side, validates the fields, and checks for duplicates:
   - If a dealer with the same name and postal code is already **verified**, the applicant is told they're already listed.
   - If one is already **needs-review**, the applicant gets a success message and no new row is created.
   - A contact email with five or more pending applications gets the same success message and no new row.
3. The action inserts a `dealers` row with the service-role client:
   - `active = false` and `verification_status = 'needs-review'`, so the row is never public.
   - `source_workbook = 'Website application'`.
   - The store phone and website go into the normal columns. The contact's name, email, phone, business type, years in business, and message go only into `notes`, which is admin-only.
4. The admin dashboard shows a banner with the pending count. `/admin/applications` lists every application.
   - **Approve:** open the application, confirm the address, set the status to **Verified**, tick **Active**, and save. Saving geocodes the address, and the store appears on the locator.
   - **Decline:** set the status to **Rejected**.

No email notifications are sent yet. The project uses Supabase's default SMTP, so admins have to check `/admin`.

## Configuration

| Variable | Where | Notes |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Vercel Production (and Preview if you test there) | Same value as the storefront project's. Required in production: without it the form shows an "email us instead" message. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Defaults to the "UpSwing Golf site forms" widget key in production, and to Cloudflare's test key elsewhere. |

The Turnstile widget's hostname list must include `dealers.upswinggolf.com`. The storefront team says the widget covers upswinggolf.com subdomains.

Note that `.env.local` points at the production Supabase project, so test submissions from local development create real rows. Delete them afterwards.
