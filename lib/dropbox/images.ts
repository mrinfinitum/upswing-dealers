import "server-only";

import { getDropboxServerConfig } from "./config";
import { collectDropboxPages, galleryImagesFromEntries, resolveGalleryImageId } from "./image-utils";
import { dropboxContent, dropboxRpc } from "./server";
import type { GalleryImage } from "@/types/gallery";

const metadataTtl = 10 * 60 * 1000;
let metadataCache: { expiresAt: number; images: GalleryImage[] } | undefined;

export async function listGalleryImages(): Promise<GalleryImage[]> {
  if (metadataCache && metadataCache.expiresAt > Date.now()) return metadataCache.images;
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
  const images = galleryImagesFromEntries(entries, config.appSecret);
  metadataCache = { expiresAt: Date.now() + metadataTtl, images };
  return images;
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
