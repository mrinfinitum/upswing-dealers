import { getGalleryIdentity } from "@/lib/gallery/auth";
import { GalleryImageIdError } from "@/lib/dropbox/image-utils";
import { getGalleryThumbnail } from "@/lib/dropbox/images";
import { DropboxConfigurationError } from "@/lib/dropbox/config";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getGalleryIdentity()) return new Response("Unauthorized", { status: 401 });
  try {
    const response = await getGalleryThumbnail((await params).id);
    return new Response(response.body, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof GalleryImageIdError) return new Response("Invalid image ID", { status: 400 });
    if (error instanceof DropboxConfigurationError) return new Response("Image service unavailable", { status: 503 });
    return new Response("Thumbnail unavailable", { status: 502 });
  }
}
