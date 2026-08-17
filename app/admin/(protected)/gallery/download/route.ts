import { getAdminIdentity } from "@/lib/admin/auth";
import { downloadDropboxFile } from "@/lib/dropbox/client";

function safeFilename(path: string) {
  return path.split("/").pop()?.replace(/["\r\n]/g, "") || "download";
}

export async function GET(request: Request) {
  if (!await getAdminIdentity()) return new Response("Unauthorized", { status: 401 });
  const path = new URL(request.url).searchParams.get("path");
  if (!path) return new Response("Missing Dropbox path", { status: 400 });
  try {
    const dropboxResponse = await downloadDropboxFile(path);
    return new Response(dropboxResponse.body, {
      headers: {
        "Content-Type": dropboxResponse.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeFilename(path)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Download unavailable", { status: 404 });
  }
}
