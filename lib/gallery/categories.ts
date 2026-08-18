import "server-only";

import { createClient } from "@/lib/supabase/server";
import { defaultGalleryCategories, type GalleryCategory, type GalleryImage } from "@/types/gallery";
import { getDropboxServerConfig } from "@/lib/dropbox/config";
import { resolveGalleryImageId } from "@/lib/dropbox/image-utils";

type CategoryRow = { dropbox_file_id: string; category: string };
type CategoryDefinitionRow = { slug: string; label: string; sort_order: number };

export async function listGalleryCategories(): Promise<GalleryCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_categories")
    .select("slug, label, sort_order")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });
  if (error) {
    console.warn("Gallery category catalog unavailable", { code: error.code });
    return defaultGalleryCategories;
  }
  return (data as CategoryDefinitionRow[]).map(({ slug, label }) => ({ slug, label }));
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

  const categories = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.category) continue;
    const assigned = categories.get(row.dropbox_file_id) ?? [];
    if (!assigned.includes(row.category)) assigned.push(row.category);
    categories.set(row.dropbox_file_id, assigned);
  }
  return images.map((image, index) => ({ ...image, categories: categories.get(rawIds[index]) ?? [] }));
}
