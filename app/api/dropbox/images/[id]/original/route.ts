import type { NextRequest } from "next/server";
import { getGalleryIdentity } from "@/lib/gallery/auth";
import { GalleryImageIdError, galleryContentType } from "@/lib/dropbox/image-utils";
import { getGalleryImage } from "@/lib/dropbox/images";
import { DropboxConfigurationError } from "@/lib/dropbox/config";

export const dynamic = "force-dynamic";

function metadata(response: Response) {
  const raw = response.headers.get("dropbox-api-result");
  if (!raw) return {} as { name?: string };
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" ? value as { name?: string } : {};
  } catch {
    return {};
  }
}

function filenameHeaders(name: string) {
  const clean = name.replace(/["\r\n]/g, "").slice(0, 240) || "upswing-image";
  const ascii = clean.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(clean).replace(/'/g, "%27");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getGalleryIdentity()) return new Response("Unauthorized", { status: 401 });
  try {
    const response = await getGalleryImage((await params).id);
    const file = metadata(response);
    const download = request.nextUrl.searchParams.get("download") === "1";
    const filename = typeof file.name === "string" ? file.name : "upswing-image";
    const upstreamType = response.headers.get("content-type");
    const headers: Record<string, string> = {
      "Content-Type": upstreamType && upstreamType !== "application/octet-stream" ? upstreamType : galleryContentType(filename),
      "Cache-Control": download ? "private, no-store" : "private, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    };
    if (download) headers["Content-Disposition"] = filenameHeaders(filename);
    return new Response(response.body, { headers });
  } catch (error) {
    if (error instanceof GalleryImageIdError) return new Response("Invalid image ID", { status: 400 });
    if (error instanceof DropboxConfigurationError) return new Response("Image service unavailable", { status: 503 });
    return new Response("Image unavailable", { status: 502 });
  }
}
