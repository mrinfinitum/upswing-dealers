"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { rawDropboxImageId } from "@/lib/gallery/categories";
import type { GalleryCategoryActionState } from "@/lib/gallery/category-form-state";
import { createClient } from "@/lib/supabase/server";
import { galleryCategories, type GalleryCategory } from "@/types/gallery";

function isGalleryCategory(value: string): value is GalleryCategory {
  return galleryCategories.includes(value as GalleryCategory);
}

export async function assignGalleryCategoryAction(_: GalleryCategoryActionState, formData: FormData): Promise<GalleryCategoryActionState> {
  const admin = await requireAdmin();
  const category = String(formData.get("category") ?? "");
  const signedIds = Array.from(new Set(formData.getAll("imageId").map(String))).slice(0, 500);
  if (!isGalleryCategory(category)) return { message: "Choose a valid category." };
  if (!signedIds.length) return { message: "Select at least one image." };

  let rawIds: string[];
  try {
    rawIds = signedIds.map(rawDropboxImageId);
  } catch {
    return { message: "One or more selected images are invalid. Refresh and try again." };
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_image_categories").upsert(
    rawIds.map((dropbox_file_id) => ({ dropbox_file_id, category, updated_by: admin.id, updated_at: now })),
    { onConflict: "dropbox_file_id" },
  );
  if (error) {
    console.warn("Gallery category assignment failed", { code: error.code });
    return { message: "Categories could not be saved. Confirm the gallery metadata migration has been applied." };
  }

  revalidatePath("/image-gallery");
  return { success: true, message: `${rawIds.length} ${rawIds.length === 1 ? "image" : "images"} assigned to ${category[0].toUpperCase()}${category.slice(1)}.`, revision: Date.now() };
}
