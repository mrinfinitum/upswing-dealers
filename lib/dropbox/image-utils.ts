import { createHmac, timingSafeEqual } from "node:crypto";
import type { GalleryImage } from "@/types/gallery";

export type DropboxFileEntry = {
  ".tag": "file";
  id: string;
  name: string;
  path_display?: string;
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

export function galleryImagesFromEntries(entries: unknown[], signingSecret: string): GalleryImage[] {
  return entries.flatMap((value) => {
    const entry = fileEntry(value);
    const path = entry?.path_display || entry?.name || "";
    if (!entry || !isSupportedGalleryFile(entry.name, path)) return [];
    const dimensions = entry.media_info?.metadata?.dimensions;
    return [{
      id: createGalleryImageId(entry.id, signingSecret),
      name: entry.name,
      width: typeof dimensions?.width === "number" ? dimensions.width : undefined,
      height: typeof dimensions?.height === "number" ? dimensions.height : undefined,
      modifiedAt: entry.server_modified || entry.client_modified,
    }];
  }).sort((left, right) => {
    const dateOrder = (Date.parse(right.modifiedAt || "") || 0) - (Date.parse(left.modifiedAt || "") || 0);
    return dateOrder || left.name.localeCompare(right.name);
  });
}
