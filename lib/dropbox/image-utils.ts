import { createHmac, timingSafeEqual } from "node:crypto";
import type { GalleryImage } from "@/types/gallery";

export type DropboxFileEntry = {
  ".tag": "file";
  id: string;
  name: string;
  path_display?: string;
  content_hash?: string;
  server_modified?: string;
  client_modified?: string;
  media_info?: { ".tag"?: string; metadata?: { dimensions?: { width?: number; height?: number } } };
};

export type DropboxListPage = {
  entries: unknown[];
  cursor: string;
  has_more: boolean;
};

const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ignoredNames = new Set([".ds_store", "thumbs.db"]);
const ignoredContentHashes = new Set([
  // Dropbox folder-placeholder artwork; exclude identical renamed or copied instances.
  "a8b359e414c586864de4d3378f38d636a586cceb0a146e32d78b9eb5604e2213",
]);

export type GalleryFilterDiagnostics = {
  dropboxEntries: number;
  files: number;
  supportedImageExtension: number;
  nonHiddenSupportedImages: number;
  finalGalleryImages: number;
};

export class GalleryImageIdError extends Error {
  constructor() {
    super("Invalid gallery image ID.");
    this.name = "GalleryImageIdError";
  }
}

export function isSupportedGalleryFile(name: string, path = name) {
  const lowerName = name.toLowerCase();
  if (ignoredNames.has(lowerName) || name.startsWith(".")) return false;
  if (path.split("/").filter(Boolean).some((segment) => segment.startsWith("."))) return false;
  return hasSupportedGalleryExtension(name);
}

function hasSupportedGalleryExtension(name: string) {
  const lowerName = name.toLowerCase();
  const dot = lowerName.lastIndexOf(".");
  return dot >= 0 && supportedExtensions.has(lowerName.slice(dot));
}

export function galleryContentType(name: string) {
  const extension = name.toLowerCase().slice(name.lastIndexOf("."));
  return ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" } as Record<string, string>)[extension] || "application/octet-stream";
}

export function parseDropboxListPage(value: unknown): DropboxListPage {
  if (!value || typeof value !== "object") throw new Error("Dropbox returned a malformed list response.");
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.entries) || typeof candidate.cursor !== "string" || typeof candidate.has_more !== "boolean") throw new Error("Dropbox returned a malformed list response.");
  return { entries: candidate.entries, cursor: candidate.cursor, has_more: candidate.has_more };
}

export async function collectDropboxPages(first: unknown, nextPage: (cursor: string) => Promise<unknown>, maximumEntries = 10_000) {
  let page = parseDropboxListPage(first);
  const entries = [...page.entries];
  const seenCursors = new Set<string>();
  let pageCount = 1;
  while (page.has_more) {
    if (entries.length >= maximumEntries) throw new Error(`Dropbox gallery exceeds the ${maximumEntries.toLocaleString()}-item safety limit.`);
    if (!page.cursor || seenCursors.has(page.cursor) || pageCount >= 1000) throw new Error("Dropbox returned an invalid pagination cursor sequence.");
    seenCursors.add(page.cursor);
    page = parseDropboxListPage(await nextPage(page.cursor));
    pageCount += 1;
    entries.push(...page.entries);
  }
  if (entries.length > maximumEntries) throw new Error(`Dropbox gallery exceeds the ${maximumEntries.toLocaleString()}-item safety limit.`);
  return entries;
}

function fileEntry(value: unknown): DropboxFileEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  if (entry[".tag"] !== "file" || typeof entry.id !== "string" || !entry.id.startsWith("id:") || typeof entry.name !== "string") return null;
  return entry as DropboxFileEntry;
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createGalleryImageId(dropboxId: string, secret: string) {
  if (!dropboxId.startsWith("id:") || dropboxId.length > 512) throw new Error("Invalid Dropbox file ID.");
  const payload = Buffer.from(dropboxId).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function resolveGalleryImageId(imageId: string, secret: string) {
  const [payload, supplied, extra] = imageId.split(".");
  if (!payload || !supplied || extra || payload.length > 700 || supplied.length > 100) throw new GalleryImageIdError();
  const expected = signature(payload, secret);
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) throw new GalleryImageIdError();
  const dropboxId = Buffer.from(payload, "base64url").toString("utf8");
  if (!dropboxId.startsWith("id:") || dropboxId.length > 512 || /[\0\r\n]/.test(dropboxId)) throw new GalleryImageIdError();
  return dropboxId;
}

export function analyzeGalleryEntries(entries: unknown[], signingSecret: string): { images: GalleryImage[]; diagnostics: GalleryFilterDiagnostics } {
  let files = 0;
  let supportedImageExtension = 0;
  let nonHiddenSupportedImages = 0;
  const images = entries.flatMap((value) => {
    if (value && typeof value === "object" && (value as Record<string, unknown>)[".tag"] === "file") files += 1;
    const entry = fileEntry(value);
    const path = entry?.path_display || entry?.name || "";
    if (!entry || !hasSupportedGalleryExtension(entry.name)) return [];
    supportedImageExtension += 1;
    if (!isSupportedGalleryFile(entry.name, path)) return [];
    nonHiddenSupportedImages += 1;
    if (entry.content_hash && ignoredContentHashes.has(entry.content_hash.toLowerCase())) return [];
    const dimensions = entry.media_info?.metadata?.dimensions;
    return [{
      id: createGalleryImageId(entry.id, signingSecret),
      name: entry.name,
      width: typeof dimensions?.width === "number" ? dimensions.width : undefined,
      height: typeof dimensions?.height === "number" ? dimensions.height : undefined,
      modifiedAt: entry.server_modified || entry.client_modified,
      categories: [],
    }];
  }).sort((left, right) => {
    const dateOrder = (Date.parse(right.modifiedAt || "") || 0) - (Date.parse(left.modifiedAt || "") || 0);
    return dateOrder || left.name.localeCompare(right.name);
  });

  return {
    images,
    diagnostics: {
      dropboxEntries: entries.length,
      files,
      supportedImageExtension,
      nonHiddenSupportedImages,
      finalGalleryImages: images.length,
    },
  };
}

export function galleryImagesFromEntries(entries: unknown[], signingSecret: string): GalleryImage[] {
  return analyzeGalleryEntries(entries, signingSecret).images;
}
