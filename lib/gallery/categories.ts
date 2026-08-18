import "server-only";

import { createClient } from "@/lib/supabase/server";
import { galleryCategories, type GalleryCategory, type GalleryImage } from "@/types/gallery";
import { getDropboxServerConfig } from "@/lib/dropbox/config";
import { resolveGalleryImageId } from "@/lib/dropbox/image-utils";

type CategoryRow = { dropbox_file_id: string; category: string };

function isGalleryCategory(value: string): value is GalleryCategory {
  return galleryCategories.includes(value as GalleryCategory);
}

export function rawDropboxImageId(imageId: string) {
  return resolveGalleryImageId(imageId, getDropboxServerConfig().appSecret);
}

export async function applyGalleryCategories(images: GalleryImage[]): Promise<GalleryImage[]> {
  if (!images.length) return images;
  const rawIds = images.map((image) => rawDropboxImageId(image.id));
  const supabase = await createClient();
  const rows: CategoryRow[] = [];

  for (let index = 0; index < rawIds.length; index += 200) {
    const { data, error } = await supabase
      .from("gallery_image_categories")
      .select("dropbox_file_id, category")
      .in("dropbox_file_id", rawIds.slice(index, index + 200));
    if (error) {
      console.warn("Gallery category metadata unavailable", { code: error.code });
      return images;
    }
    rows.push(...(data as CategoryRow[]));
  }

  const categories = new Map(rows.filter((row) => isGalleryCategory(row.category)).map((row) => [row.dropbox_file_id, row.category as GalleryCategory]));
  return images.map((image, index) => ({ ...image, category: categories.get(rawIds[index]) }));
}
