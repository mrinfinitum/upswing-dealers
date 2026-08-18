-- Allow one Dropbox image to appear in multiple dealer-facing gallery categories.
-- Existing category assignments are preserved.

alter table public.gallery_image_categories
drop constraint if exists gallery_image_categories_pkey;

alter table public.gallery_image_categories
add constraint gallery_image_categories_pkey primary key (dropbox_file_id, category);
