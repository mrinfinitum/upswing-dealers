import Link from "next/link";
import { GalleryHydrationDiagnostic, ImageGallery } from "@/components/image-gallery/image-gallery";
import { DropboxConfigurationError, isDropboxBootstrapEnabled } from "@/lib/dropbox/config";
import { listGalleryImages } from "@/lib/dropbox/images";
import { DropboxApiError } from "@/lib/dropbox/server";
import type { GalleryIdentity } from "@/lib/gallery/auth";
import type { GalleryImage } from "@/types/gallery";

export async function ImageGalleryPageContent({ role }: { role: GalleryIdentity["role"] }) {
  let images: GalleryImage[] = [];
  let configurationMissing = false;
  let providerUnavailable = false;

  try {
    images = await listGalleryImages();
    console.info("Image gallery server page", { images: images.length });
  } catch (error) {
    configurationMissing = error instanceof DropboxConfigurationError;
    providerUnavailable = !configurationMissing;
    const diagnostic = error instanceof DropboxApiError
      ? { name: error.name, status: error.status }
      : { name: error instanceof Error ? error.name : "UnknownError" };
    console.error("Dropbox gallery unavailable", diagnostic);
  }

  return <div className="image-gallery-page">
    {!configurationMissing && !providerUnavailable ? <GalleryHydrationDiagnostic images={images.length} /> : null}
    <header className="image-gallery-heading"><div><p className="eyebrow">UpSwing media library</p><h1>Image Gallery</h1><p>Browse approved product and marketing images.</p></div>{!configurationMissing && !providerUnavailable ? <span>{images.length} {images.length === 1 ? "image" : "images"}</span> : null}</header>
    {configurationMissing ? <section className="image-gallery-state"><span>Connection required</span><h2>The image library is not connected yet.</h2><p>{role === "admin" ? "Complete the server-only Dropbox setup to make approved imagery available to administrators and dealer users." : "The UpSwing image library is being configured. Please check back soon."}</p>{role === "admin" && isDropboxBootstrapEnabled() ? <Link className="admin-button admin-button--primary" href="/api/dropbox/connect">Connect Dropbox</Link> : null}</section> : null}
    {providerUnavailable ? <section className="image-gallery-state"><span>Temporarily unavailable</span><h2>We couldn’t load the image library.</h2><p>Please try again shortly. No other portal features are affected.</p></section> : null}
    {!configurationMissing && !providerUnavailable && images.length ? <ImageGallery images={images} /> : null}
    {!configurationMissing && !providerUnavailable && !images.length ? <section className="image-gallery-state image-gallery-state--empty"><span>Gallery empty</span><h2>No images are currently available.</h2><p>Add supported images to the configured Dropbox gallery folder and they will appear here automatically.</p></section> : null}
  </div>;
}
