# Supabase dealer administration

The `/admin` area uses Supabase Auth and the `public.dealers` table. The original workbook, `source.ts`, stable IDs, enrichment evidence, and coordinate evidence remain the import source of record.

## Environment

Add these values to `.env.local` and to the appropriate Vercel environments:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The project URL and publishable key may be used by browser code because Row Level Security controls access. `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must remain server-only. It is used by the manually invoked import script and authenticated admin-only user administration. It is imported only by a `server-only` module and must never be exposed to client components.

## One-time database setup

1. Apply `supabase/migrations/202608150001_create_dealers.sql` in the Supabase SQL editor or through a linked Supabase CLI project.
2. Import the 71 preserved source records:

   ```bash
   npm run supabase:import
   ```

   The import is deterministic and upserts by stable dealer ID. It aborts unless all 71 records are present and Preston, WA remains non-verified. It does not delete admin-created rows.

3. Create the first administrator in Supabase Auth. Disable public sign-up unless it is required elsewhere in the project.
4. Assign the role in the user's protected app metadata (never user metadata):

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'ADMIN_EMAIL_HERE';
   ```

5. Have the administrator sign out and back in so the refreshed JWT contains the role.
6. Apply `supabase/migrations/202608170001_create_dealer_portal.sql` to add dealer organizations, memberships, page permissions, and the safe portal location function, then apply `202608170002_remove_location_change_requests.sql` to remove the retired request feature.
7. In Supabase Auth URL Configuration, allow both `https://dealers.upswinggolf.com/admin/reset-password` and `https://dealers.upswinggolf.com/partner/reset-password` as additional redirect URLs. Add localhost equivalents only to the development project when local password-recovery testing is required.

## Access model

- Anonymous clients may select only active, verified records and only the explicitly granted public columns; provenance, evidence, and internal notes remain inaccessible.
- Authenticated users without an authorized protected role receive no direct dealer-table access.
- Administrators can read, insert, update, and delete through RLS-protected requests.
- Dealer users carry protected `app_metadata.role = "dealer"`. They can read their own active profile, organization memberships, and page permissions. A security-definer function returns only the safe location columns for assigned organizations; internal notes, provenance, and evidence remain inaccessible.
- Proxy route protection improves navigation behavior, but every Server Action independently validates signed JWT claims before mutating data.
- The admin has no public sign-up route and admin pages are `noindex`.
- `/admin/users` is the master Supabase Auth directory. It combines protected Auth metadata with dealer organization memberships, supports search/group filters/sorting, and lets an administrator directly create either an UpSwing administrator or dealer user. Dealer accounts require an organization and explicit portal-page permissions. Administrators can delete other accounts but cannot delete the account they are currently using.

## Dealer batch imports

The Add Dealer screen supports CSV and XLSX uploads of up to 500 locations and 4 MB per file. Use the protected CSV template linked from the page and keep its header names unchanged. The import validates all rows and existing-address duplicates before writing anything; if one row fails, no rows are inserted. Uploaded locations preserve the filename and source row as provenance and always enter as `unverified` without coordinates. Legacy `.xls` workbooks must be saved as `.xlsx` or CSV before upload.

## Public locator behavior

At request time the public locator reads active, verified Supabase rows. Until the migration exists—or during a Supabase query failure—it falls back to the preserved workbook-backed 70-record dataset so the locator remains usable. A valid empty database response remains empty and is never replaced with stale workbook rows.

## Operational notes

- Prefer deactivation over deletion when historical provenance matters.
- A row is published only when both `active = true` and `verification_status = 'verified'`.
- Coordinates require a complete latitude/longitude pair and database range checks.
- Editing an imported location retains its stable ID and source provenance fields.
- Admins enter a complete address rather than latitude/longitude. The server calculates coordinates with Google and stores them only when a unique precise result passes component validation.
- Rotate the service-role key immediately if it is ever exposed. Never paste it into browser code, logs, tickets, or screenshots.
