-- Corporate logos for dealer organizations, shown beside their locations on the public locator.
-- Apply after 202608250001_remove_dealer_type.sql.

alter table public.dealer_organizations
  add column if not exists logo_path text,
  add column if not exists logo_updated_at timestamptz;

-- Public read through the storage CDN; uploads happen only through the portal's service-role server actions.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dealer-logos', 'dealer-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Logo for every published location whose active organization has one. Anonymous clients cannot read the
-- organization tables, so the storefront locator joins this to its dealer list by dealer_id.
create or replace function public.get_public_dealer_logos()
returns table (dealer_id text, organization_name text, logo_path text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (d.id) d.id, o.name, o.logo_path
  from public.dealers d
  join public.dealer_organization_locations l on l.dealer_id = d.id
  join public.dealer_organizations o on o.id = l.organization_id
  where d.active
    and d.verification_status = 'verified'
    and o.active
    and o.logo_path is not null
  order by d.id, o.logo_updated_at desc nulls last;
$$;

revoke all on function public.get_public_dealer_logos() from public;
grant execute on function public.get_public_dealer_logos() to anon, authenticated;
