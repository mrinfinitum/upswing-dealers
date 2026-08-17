import "server-only";

import { getDropboxConfig } from "./config";

const imageExtensions = new Set(["bmp", "gif", "jpeg", "jpg", "png", "ppm", "tif", "tiff", "webp"]);
const maximumGalleryFiles = 10_000;

type DropboxEntry = {
  ".tag": "file" | "folder" | "deleted";
  id?: string;
  name: string;
  path_display?: string;
  path_lower?: string;
  client_modified?: string;
  server_modified?: string;
  size?: number;
};

type DropboxListResponse = {
  entries: DropboxEntry[];
  cursor: string;
  has_more: boolean;
};

export type DropboxGalleryImage = {
  id: string;
  name: string;
  path: string;
  folder: string;
  size: number;
  modifiedAt: string;
};

let cachedToken: { value: string; expiresAt: number } | undefined;

async function accessToken() {
  const config = getDropboxConfig();
  if (config.accessToken) return config.accessToken;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const authorization = Buffer.from(`${config.appKey}:${config.appSecret}`).toString("base64");
  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: config.refreshToken! }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Dropbox token refresh failed (${response.status}).`);
  const payload = await response.json() as { access_token?: string; expires_in?: number };
  if (!payload.access_token) throw new Error("Dropbox did not return an access token.");
  cachedToken = { value: payload.access_token, expiresAt: Date.now() + (payload.expires_in ?? 14_400) * 1000 };
  return cachedToken.value;
}

async function rpc<T>(endpoint: string, body: object) {
  const response = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Dropbox ${endpoint} failed (${response.status}).`);
  return response.json() as Promise<T>;
}

function isSupportedImage(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();
  return extension ? imageExtensions.has(extension) : false;
}

export function isAllowedGalleryPath(path: string) {
  const { galleryFolder } = getDropboxConfig();
  const normalized = path.toLowerCase();
  const folder = galleryFolder.toLowerCase();
  return normalized.startsWith("/") && (!folder || normalized === folder || normalized.startsWith(`${folder}/`));
}

export async function listDropboxImages(): Promise<DropboxGalleryImage[]> {
  const { galleryFolder } = getDropboxConfig();
  let result = await rpc<DropboxListResponse>("files/list_folder", { path: galleryFolder, recursive: true, include_deleted: false, include_non_downloadable_files: false, limit: 2000 });
  const entries = [...result.entries];
  while (result.has_more) {
    if (entries.length >= maximumGalleryFiles) throw new Error(`Dropbox gallery exceeds the ${maximumGalleryFiles.toLocaleString()}-item safety limit.`);
    result = await rpc<DropboxListResponse>("files/list_folder/continue", { cursor: result.cursor });
    entries.push(...result.entries);
  }

  return entries
    .filter((entry) => entry[".tag"] === "file" && entry.path_display && isSupportedImage(entry.name))
    .map((entry) => {
      const path = entry.path_display!;
      const relative = galleryFolder && path.toLowerCase().startsWith(galleryFolder.toLowerCase()) ? path.slice(galleryFolder.length) : path;
      const folderParts = relative.split("/").filter(Boolean).slice(0, -1);
      return {
        id: entry.id || entry.path_lower || path,
        name: entry.name,
        path,
        folder: folderParts.join(" / ") || "Gallery root",
        size: entry.size ?? 0,
        modifiedAt: entry.server_modified || entry.client_modified || "",
      };
    })
    .sort((left, right) => left.folder.localeCompare(right.folder) || left.name.localeCompare(right.name));
}

export async function getDropboxThumbnail(path: string) {
  if (!isAllowedGalleryPath(path)) throw new Error("Requested file is outside the configured gallery folder.");
  const response = await fetch("https://content.dropboxapi.com/2/files/get_thumbnail_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Dropbox-API-Arg": JSON.stringify({ resource: { ".tag": "path", path }, format: { ".tag": "jpeg" }, size: { ".tag": "w640h480" }, mode: { ".tag": "fitone_bestfit" } }),
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Dropbox thumbnail failed (${response.status}).`);
  return response;
}

export async function downloadDropboxFile(path: string) {
  if (!isAllowedGalleryPath(path)) throw new Error("Requested file is outside the configured gallery folder.");
  const response = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Dropbox-API-Arg": JSON.stringify({ path }) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Dropbox download failed (${response.status}).`);
  return response;
}
