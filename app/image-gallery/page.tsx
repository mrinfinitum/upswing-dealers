import { ImageGalleryPageContent } from "@/components/image-gallery/image-gallery-page-content";
import { requireGalleryIdentity } from "@/lib/gallery/auth";

export const dynamic = "force-dynamic";

export default async function ImageGalleryPage() {
  const identity = await requireGalleryIdentity();
  return <ImageGalleryPageContent role={identity.role} />;
}
