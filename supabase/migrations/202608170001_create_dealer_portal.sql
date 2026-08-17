-- Dealer portal authorization and organization model.
-- Apply after 202608150001_create_dealers.sql.

create table if not exists public.dealer_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dealer_portal_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'dealer' check (role = 'dealer'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dealer_memberships (
  user_id uuid not null references public.dealer_portal_users(user_id) on delete cascade,
  organization_id uuid not null references public.dealer_organizations(id) on delete cascade,
  page_permissions text[] not null default array['dashboard', 'locations', 'brand']::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, organization_id),
  constraint dealer_membership_pages check (
    page_permissions <@ array['dashboard', 'locations', 'brand']::text[]
    and cardinality(page_permissions) > 0
  )
);

create table if not exists public.dealer_organization_locations (
  organization_id uuid not null references public.dealer_organizations(id) on delete cascade,
  dealer_id text not null references public.dealers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (organization_id, dealer_id)
);

create table if not exists public.dealer_location_change_requests (
  id uuid primary key default gen_random_uuid(),
  dealer_id text not null references public.dealers(id) on delete cascade,
  organization_id uuid not null references public.dealer_organizations(id) on delete cascade,
  requested_by uuid not null references public.dealer_portal_users(user_id) on delete cascade,
  proposed_changes jsonb not null check (jsonb_typeof(proposed_changes) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create or replace function public.is_active_dealer_portal_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'dealer', false)
    and exists (
      select 1 from public.dealer_portal_users u
      where u.user_id = auth.uid() and u.active
    )
$$;

create or replace function public.has_dealer_page_access(target_organization uuid, page_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_active_dealer_portal_user() and exists (
    select 1
    from public.dealer_memberships m
    join public.dealer_organizations o on o.id = m.organization_id
    where m.user_id = auth.uid()
      and m.organization_id = target_organization
      and m.active
      and o.active
      and page_key = any(m.page_permissions)
  )
$$;

revoke all on function public.is_active_dealer_portal_user() from public;
revoke all on function public.has_dealer_page_access(uuid, text) from public;
grant execute on function public.is_active_dealer_portal_user() to authenticated;
grant execute on function public.has_dealer_page_access(uuid, text) to authenticated;

alter table public.dealer_organizations enable row level security;
alter table public.dealer_portal_users enable row level security;
alter table public.dealer_memberships enable row level security;
alter table public.dealer_organization_locations enable row level security;
alter table public.dealer_location_change_requests enable row level security;

revoke all on public.dealer_organizations from anon, authenticated;
revoke all on public.dealer_portal_users from anon, authenticated;
revoke all on public.dealer_memberships from anon, authenticated;
revoke all on public.dealer_organization_locations from anon, authenticated;
revoke all on public.dealer_location_change_requests from anon, authenticated;
grant select, insert, update, delete on public.dealer_organizations to authenticated;
grant select, insert, update, delete on public.dealer_portal_users to authenticated;
grant select, insert, update, delete on public.dealer_memberships to authenticated;
grant select, insert, update, delete on public.dealer_organization_locations to authenticated;
grant select, insert, update, delete on public.dealer_location_change_requests to authenticated;

create policy "Admins manage dealer organizations" on public.dealer_organizations
for all to authenticated using ((select public.is_dealer_admin()))
with check ((select public.is_dealer_admin()));
create policy "Dealers view member organizations" on public.dealer_organizations
for select to authenticated using (
  active and (select public.is_active_dealer_portal_user()) and exists (
    select 1 from public.dealer_memberships m
    where m.organization_id = id and m.user_id = auth.uid() and m.active
  )
);

create policy "Admins manage portal users" on public.dealer_portal_users
for all to authenticated using ((select public.is_dealer_admin()))
with check ((select public.is_dealer_admin()));
create policy "Dealers view their profile" on public.dealer_portal_users
for select to authenticated using (
  user_id = auth.uid() and active and (select public.is_active_dealer_portal_user())
);

create policy "Admins manage dealer memberships" on public.dealer_memberships
for all to authenticated using ((select public.is_dealer_admin()))
with check ((select public.is_dealer_admin()));
create policy "Dealers view their memberships" on public.dealer_memberships
for select to authenticated using (
  user_id = auth.uid() and active and (select public.is_active_dealer_portal_user())
);

create policy "Admins manage organization locations" on public.dealer_organization_locations
for all to authenticated using ((select public.is_dealer_admin()))
with check ((select public.is_dealer_admin()));
create policy "Dealers view assigned organization locations" on public.dealer_organization_locations
for select to authenticated using (
  (select public.is_active_dealer_portal_user()) and exists (
    select 1 from public.dealer_memberships m
    where m.organization_id = dealer_organization_locations.organization_id
      and m.user_id = auth.uid() and m.active
  )
);

create policy "Admins manage location change requests" on public.dealer_location_change_requests
for all to authenticated using ((select public.is_dealer_admin()))
with check ((select public.is_dealer_admin()));
create policy "Dealers view their organization requests" on public.dealer_location_change_requests
for select to authenticated using (
  requested_by = auth.uid()
  and (select public.has_dealer_page_access(organization_id, 'locations'))
);
create policy "Dealers submit assigned location requests" on public.dealer_location_change_requests
for insert to authenticated with check (
  requested_by = auth.uid()
  and status = 'pending'
  and (select public.has_dealer_page_access(organization_id, 'locations'))
  and exists (
    select 1 from public.dealer_organization_locations l
    where l.organization_id = dealer_location_change_requests.organization_id
      and l.dealer_id = dealer_location_change_requests.dealer_id
  )
);

create or replace function public.get_dealer_portal_locations()
returns table (
  organization_id uuid,
  organization_name text,
  dealer_id text,
  dealer_name text,
  location_name text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_province text,
  postal_code text,
  country text,
  phone text,
  website text,
  email text,
  active boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id, o.name, d.id, d.name, d.location_name, d.address_line_1,
    d.address_line_2, d.city, d.state_province, d.postal_code,
    d.country, d.phone, d.website, d.email, d.active
  from public.dealer_memberships m
  join public.dealer_organizations o on o.id = m.organization_id
  join public.dealer_organization_locations l on l.organization_id = o.id
  join public.dealers d on d.id = l.dealer_id
  where m.user_id = auth.uid()
    and public.is_active_dealer_portal_user()
    and m.active and o.active
    and 'locations' = any(m.page_permissions)
  order by o.name, d.country, d.state_province, d.city
$$;

revoke all on function public.get_dealer_portal_locations() from public;
grant execute on function public.get_dealer_portal_locations() to authenticated;

create index if not exists dealer_memberships_user_idx on public.dealer_memberships (user_id, active);
create index if not exists dealer_org_locations_dealer_idx on public.dealer_organization_locations (dealer_id);
create index if not exists dealer_change_requests_review_idx on public.dealer_location_change_requests (status, created_at desc);

-- Seed the first multi-location dealer. Only active, independently verified
-- PGA TOUR Superstore records are assigned; Preston, WA remains excluded.
insert into public.dealer_organizations (id, name, slug)
values ('55c7039e-0f4b-4e4e-a27d-ff29ac5d7f4c', 'PGA TOUR Superstore', 'pga-tour-superstore')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

insert into public.dealer_organization_locations (organization_id, dealer_id)
select '55c7039e-0f4b-4e4e-a27d-ff29ac5d7f4c', id
from public.dealers
where source_sheet = 'PGATSS'
  and active
  and verification_status = 'verified'
on conflict do nothing;
