create table if not exists public.dealers (
  id text primary key,
  name text not null check (length(trim(name)) > 0),
  location_name text,
  address_line_1 text,
  address_line_2 text,
  city text not null check (length(trim(city)) > 0),
  state_province text,
  postal_code text,
  country text not null check (length(trim(country)) > 0),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  phone text,
  website text,
  email text,
  dealer_type text,
  active boolean not null default true,
  notes text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'needs-review', 'verified', 'rejected')),
  source_workbook text not null,
  source_sheet text not null,
  source_row integer not null check (source_row >= 0),
  source_raw_city text not null,
  source_raw_region text,
  enrichment_sources jsonb not null default '[]'::jsonb,
  coordinate_evidence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealer_coordinate_pair check (
    (latitude is null and longitude is null) or
    (latitude is not null and longitude is not null)
  )
);

alter table public.dealers enable row level security;

create or replace function public.is_dealer_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

revoke all on function public.is_dealer_admin() from public;
grant execute on function public.is_dealer_admin() to authenticated;

create or replace function public.set_dealer_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dealers_set_updated_at on public.dealers;
create trigger dealers_set_updated_at
before update on public.dealers
for each row execute function public.set_dealer_updated_at();

revoke all on public.dealers from anon, authenticated;
grant select (
  id, name, location_name, address_line_1, address_line_2, city,
  state_province, postal_code, country, latitude, longitude, phone,
  website, email, dealer_type, active, verification_status
) on public.dealers to anon;
grant select, insert, update, delete on public.dealers to authenticated;

drop policy if exists "Public can view verified active dealers" on public.dealers;
create policy "Public can view verified active dealers"
on public.dealers for select to anon
using (active and verification_status = 'verified');

drop policy if exists "Admins can view every dealer" on public.dealers;
create policy "Admins can view every dealer"
on public.dealers for select to authenticated
using ((select public.is_dealer_admin()));

drop policy if exists "Admins can insert dealers" on public.dealers;
create policy "Admins can insert dealers"
on public.dealers for insert to authenticated
with check ((select public.is_dealer_admin()));

drop policy if exists "Admins can update dealers" on public.dealers;
create policy "Admins can update dealers"
on public.dealers for update to authenticated
using ((select public.is_dealer_admin()))
with check ((select public.is_dealer_admin()));

drop policy if exists "Admins can delete dealers" on public.dealers;
create policy "Admins can delete dealers"
on public.dealers for delete to authenticated
using ((select public.is_dealer_admin()));

create index if not exists dealers_public_idx
  on public.dealers (active, verification_status);
create index if not exists dealers_location_idx
  on public.dealers (country, state_province, city);
