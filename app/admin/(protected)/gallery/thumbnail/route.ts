import { getAdminIdentity } from "@/lib/admin/auth";
import { getDropboxThumbnail } from "@/lib/dropbox/client";

export async function GET(request: Request) {
  if (!await getAdminIdentity()) return new Response("Unauthorized", { status: 401 });
  const path = new URL(request.url).searchParams.get("path");
  if (!path) return new Response("Missing Dropbox path", { status: 400 });
  try {
    const dropboxResponse = await getDropboxThumbnail(path);
    return new Response(dropboxResponse.body, { headers: { "Content-Type": dropboxResponse.headers.get("content-type") || "image/jpeg", "Cache-Control": "private, max-age=300" } });
  } catch {
    return new Response("Thumbnail unavailable", { status: 404 });
  }
}
