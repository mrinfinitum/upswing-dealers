-- Administrator access requires a session that has completed multi-factor authentication (aal2).
-- Every admin RLS policy calls this function, so a password-only session cannot read or change admin data
-- even if it bypasses the portal's own checks.
-- Apply after 202611020001_dealer_logos.sql.

create or replace function public.is_dealer_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      and (auth.jwt() ->> 'aal') = 'aal2',
    false
  )
$$;

revoke all on function public.is_dealer_admin() from public;
grant execute on function public.is_dealer_admin() to authenticated;
