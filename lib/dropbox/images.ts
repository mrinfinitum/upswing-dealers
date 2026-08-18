import "server-only";

import { getDropboxServerConfig } from "./config";
import { analyzeGalleryEntries, collectDropboxPages, resolveGalleryImageId, type GalleryFilterDiagnostics } from "./image-utils";
import { dropboxContent, dropboxRpc } from "./server";
import { applyGalleryCategories } from "@/lib/gallery/categories";
import type { GalleryImage } from "@/types/gallery";

const metadataTtl = 10 * 60 * 1000;
let metadataCache: { expiresAt: number; images: GalleryImage[]; diagnostics: GalleryFilterDiagnostics } | undefined;

function logListing(diagnostics: GalleryFilterDiagnostics, cacheStatus: "hit" | "miss" | "empty-not-cached") {
  console.info("Dropbox gallery listing", { ...diagnostics, cacheStatus });
}

export async function listGalleryImages(): Promise<GalleryImage[]> {
  if (metadataCache && metadataCache.expiresAt > Date.now()) {
    logListing(metadataCache.diagnostics, "hit");
    return applyGalleryCategories(metadataCache.images);
  }
  const config = getDropboxServerConfig();
  const first = await dropboxRpc("files/list_folder", {
    path: config.galleryPath,
    recursive: true,
    include_deleted: false,
    include_media_info: true,
    include_non_downloadable_files: false,
    limit: 2000,
  });
  const entries = await collectDropboxPages(first, (cursor) => dropboxRpc("files/list_folder/continue", { cursor }));
  const { images, diagnostics } = analyzeGalleryEntries(entries, config.appSecret);
  logListing(diagnostics, images.length ? "miss" : "empty-not-cached");
  metadataCache = images.length ? { expiresAt: Date.now() + metadataTtl, images, diagnostics } : undefined;
  return applyGalleryCategories(images);
}

function dropboxId(imageId: string) {
  return resolveGalleryImageId(imageId, getDropboxServerConfig().appSecret);
}

export function getGalleryThumbnail(imageId: string) {
  return dropboxContent("files/get_thumbnail_v2", {
    resource: { ".tag": "path", path: dropboxId(imageId) },
    format: { ".tag": "webp" },
    size: { ".tag": "w640h480" },
    mode: { ".tag": "fitone_bestfit" },
  });
}

export function getGalleryImage(imageId: string) {
  return dropboxContent("files/download", { path: dropboxId(imageId) });
}
