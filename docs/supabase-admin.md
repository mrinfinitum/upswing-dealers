# Supabase dealer administration

The `/admin` area uses Supabase Auth and the `public.dealers` table. The original workbook, `source.ts`, stable IDs, enrichment evidence, and coordinate evidence remain the import source of record.

## Environment

Add these values to `.env.local` and to the appropriate Vercel environments:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The project URL and publishable key may be used by browser code because Row Level Security controls access. `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must remain server-only. This application only uses it in the manually invoked import script; it is never imported by the Next.js runtime.

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

## Access model

- Anonymous clients may select only active, verified records and only the explicitly granted public columns; provenance, evidence, and internal notes remain inaccessible.
- Authenticated users without `app_metadata.role = "admin"` receive no dealer-table access.
- Administrators can read, insert, update, and delete through RLS-protected requests.
- Proxy route protection improves navigation behavior, but every Server Action independently validates signed JWT claims before mutating data.
- The admin has no public sign-up route and admin pages are `noindex`.

## Public locator behavior

At request time the public locator reads active, verified Supabase rows. Until the migration exists—or during a Supabase query failure—it falls back to the preserved workbook-backed 70-record dataset so the locator remains usable. A valid empty database response remains empty and is never replaced with stale workbook rows.

## Operational notes

- Prefer deactivation over deletion when historical provenance matters.
- A row is published only when both `active = true` and `verification_status = 'verified'`.
- Coordinates require a complete latitude/longitude pair and database range checks.
- Editing an imported location retains its stable ID and source provenance fields.
- Rotate the service-role key immediately if it is ever exposed. Never paste it into browser code, logs, tickets, or screenshots.
