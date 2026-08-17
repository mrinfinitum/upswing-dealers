# UpSwing dealer partner portal

The dealer portal is part of the locator application because it shares the same verified location records, authentication service, and UpSwing operational ownership. It remains isolated from the public locator and internal admin UI through separate routes, roles, database policies, and server-side authorization checks.

## Routes

- `/partner/login` — dealer-only sign in
- `/partner` — permitted organization overview
- `/partner/locations` — safe assigned-location fields
- `/partner/brand` — UpSwing standards and approved downloads
- `/admin/users` — combined user directory, direct account creation, organization assignment, and page permissions

All portal and admin routes are `noindex` and protected by Supabase cookie sessions. Proxy redirects improve navigation, but each protected layout and every mutation independently validates authorization.

## Database setup

Apply migrations in order:

1. `202608150001_create_dealers.sql`
2. `202608170001_create_dealer_portal.sql`
3. `202608170002_remove_location_change_requests.sql`

The portal migration seeds `PGA TOUR Superstore` as the first organization and assigns its active, verified `PGATSS` records. Preston, Washington remains excluded because it is not verified. It creates no user automatically.

## Invite the first dealer

1. Confirm `SUPABASE_SERVICE_ROLE_KEY` is present only in `.env.local` and the Vercel server environment.
2. Add `https://dealers.upswinggolf.com/partner/reset-password` to the Supabase Auth redirect allowlist.
3. Sign in as an UpSwing administrator and open `/admin/users` to create or manage dealer accounts.
4. Enter the PGA TOUR Superstore contact, select the organization, and choose permitted pages.
5. Share the temporary password securely with the recipient and have them sign in to the dealer portal.

Inviting the same non-admin email again can add another organization membership without creating a duplicate Auth user. Administrator accounts are explicitly protected from conversion to the dealer role.

## Authorization model

- `admin`: full dealer management through existing RLS policies; may manage portal users and permissions.
- `dealer`: limited to active memberships and the pages listed on each membership.
- Organization memberships support both a single-location organization and a multi-location retailer.
- Dealers cannot query the complete dealer table. A guarded RPC returns only name, public address/contact fields, organization, and active status for assigned verified locations.
- Dealers have read-only access to the safe public fields for assigned locations. They cannot publish, change verification state, edit coordinates, or alter provenance.

## Secrets and production configuration

`SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. It is used only by server-only import and user-administration code. Never prefix it with `NEXT_PUBLIC_`, include it in screenshots/logs, or send it to a browser bundle. Rotate it immediately if exposed.

The canonical portal origin is `https://dealers.upswinggolf.com`. Preview hosts should not be added as canonical URLs. Add preview redirect URLs only when a deliberate preview password-recovery workflow is required.

## Initial brand resources

The brand page uses the existing UpSwing logo and established locator visual system. The current approved download is the white transparent PNG already stored in `public/brand`. Add future master SVGs, print assets, PDFs, photography, and campaign kits through a private Supabase Storage bucket and asset metadata table; do not place confidential dealer assets in `public/`.
