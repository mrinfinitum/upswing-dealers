-- Replace the fixed gallery category check with an administrator-managed catalog.
-- Existing assignments are retained and the original categories are seeded.

create table if not exists public.gallery_categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 2 and 48),
  label text not null check (length(trim(label)) between 2 and 40),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.gallery_categories (slug, label, sort_order)
values
  ('upswing', 'UpSwing', 10),
  ('galaxy', 'Galaxy', 20),
  ('accessories', 'Accessories', 30)
on conflict (slug) do nothing;

alter table public.gallery_categories enable row level security;
revoke all on public.gallery_categories from anon, authenticated;
grant select, insert, update, delete on public.gallery_categories to authenticated;

create policy "Admins manage gallery category catalog" on public.gallery_categories
for all to authenticated
using ((select public.is_dealer_admin()))
with check ((select public.is_dealer_admin()));

create policy "Active dealers view gallery category catalog" on public.gallery_categories
for select to authenticated
using ((select public.is_active_dealer_portal_user()));

alter table public.gallery_image_categories
drop constraint if exists gallery_image_categories_category_check;

alter table public.gallery_image_categories
add constraint gallery_image_categories_category_fkey
foreign key (category) references public.gallery_categories(slug) on update cascade on delete cascade;

create index if not exists gallery_categories_sort_idx
on public.gallery_categories (sort_order, label);
