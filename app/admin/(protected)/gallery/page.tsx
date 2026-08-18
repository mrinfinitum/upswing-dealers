import type { Metadata } from "next";
import { ImageGalleryPageContent } from "@/components/image-gallery/image-gallery-page-content";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery Admin | UpSwing Administration",
  robots: { index: false, follow: false },
};

export default async function AdminImageGalleryPage() {
  await requireAdmin();
  return <ImageGalleryPageContent role="admin" />;
}
