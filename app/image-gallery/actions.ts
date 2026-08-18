"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { rawDropboxImageId } from "@/lib/gallery/categories";
import type { GalleryCategoryActionState } from "@/lib/gallery/category-form-state";
import { createClient } from "@/lib/supabase/server";

function categorySlug(label: string) {
  return label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function createGalleryCategoryAction(_: GalleryCategoryActionState, formData: FormData): Promise<GalleryCategoryActionState> {
  const admin = await requireAdmin();
  const label = String(formData.get("label") ?? "").trim().replace(/\s+/g, " ");
  const slug = categorySlug(label);
  if (label.length < 2 || label.length > 40) return { message: "Category names must contain 2–40 characters." };
  if (slug.length < 2) return { message: "Use at least two letters or numbers in the category name." };

  const supabase = await createClient();
  const { data: lastCategory } = await supabase
    .from("gallery_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("gallery_categories").insert({
    slug,
    label,
    sort_order: (lastCategory?.sort_order ?? 0) + 10,
    created_by: admin.id,
  });
  if (error) {
    console.warn("Gallery category creation failed", { code: error.code });
    return { message: error.code === "23505" ? "That category already exists." : "The category could not be added." };
  }

  revalidatePath("/image-gallery");
  revalidatePath("/admin/gallery");
  return { success: true, message: `${label} is ready to use.`, revision: Date.now() };
}

export async function updateGalleryCategoryAction(_: GalleryCategoryActionState, formData: FormData): Promise<GalleryCategoryActionState> {
  const admin = await requireAdmin();
  const [operation, category = ""] = String(formData.get("categoryAction") ?? "").split(":");
  const signedIds = Array.from(new Set(formData.getAll("imageId").map(String))).slice(0, 500);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category) || category.length > 48) return { message: "Choose a valid category." };
  if (operation !== "add" && operation !== "remove") return { message: "Choose a valid category action." };
  if (!signedIds.length) return { message: "Select at least one image." };

  let rawIds: string[];
  try {
    rawIds = signedIds.map(rawDropboxImageId);
  } catch {
    return { message: "One or more selected images are invalid. Refresh and try again." };
  }

  const supabase = await createClient();
  const { data: categoryRecord, error: categoryError } = await supabase
    .from("gallery_categories")
    .select("slug")
    .eq("slug", category)
    .maybeSingle();
  if (categoryError || !categoryRecord) return { message: "That gallery category is no longer available. Refresh and try again." };
  const now = new Date().toISOString();
  const result = operation === "add"
    ? await supabase.from("gallery_image_categories").upsert(
      rawIds.map((dropbox_file_id) => ({ dropbox_file_id, category, updated_by: admin.id, updated_at: now })),
      { onConflict: "dropbox_file_id,category" },
    )
    : await supabase.from("gallery_image_categories").delete().in("dropbox_file_id", rawIds).eq("category", category);
  const { error } = result;
  if (error) {
    console.warn("Gallery category assignment failed", { code: error.code });
    return { message: "Categories could not be saved. Confirm the gallery metadata migration has been applied." };
  }

  revalidatePath("/image-gallery");
  revalidatePath("/admin/gallery");
  const verb = operation === "add" ? "added to" : "removed from";
  return { success: true, message: `${rawIds.length} ${rawIds.length === 1 ? "image" : "images"} ${verb} ${category[0].toUpperCase()}${category.slice(1)}.`, revision: Date.now() };
}
