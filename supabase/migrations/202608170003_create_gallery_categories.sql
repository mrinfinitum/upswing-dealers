-- Read-only Dropbox gallery metadata. Image binaries remain in Dropbox.

create table if not exists public.gallery_image_categories (
  dropbox_file_id text primary key check (dropbox_file_id like 'id:%' and length(dropbox_file_id) <= 512),
  category text not null check (category in ('upswing', 'galaxy', 'accessories')),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gallery_image_categories enable row level security;
revoke all on public.gallery_image_categories from anon, authenticated;
grant select, insert, update, delete on public.gallery_image_categories to authenticated;

create policy "Admins manage gallery categories" on public.gallery_image_categories
for all to authenticated
using ((select public.is_dealer_admin()))
with check ((select public.is_dealer_admin()));

create policy "Active dealers view gallery categories" on public.gallery_image_categories
for select to authenticated
using ((select public.is_active_dealer_portal_user()));

create index if not exists gallery_image_categories_category_idx
on public.gallery_image_categories (category);
