import Link from "next/link";
import Image from "next/image";
import { DropboxConfigurationError } from "@/lib/dropbox/config";
import { listDropboxImages, type DropboxGalleryImage } from "@/lib/dropbox/client";

function fileSize(bytes: number) {
  if (!bytes) return "Size unavailable";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent ? 1 : 0)} ${units[exponent]}`;
}

export default async function AdminImageGalleryPage() {
  let images: DropboxGalleryImage[] = [];
  let setupRequired = false;
  let errorMessage = "";
  try {
    images = await listDropboxImages();
  } catch (error) {
    setupRequired = error instanceof DropboxConfigurationError;
    errorMessage = error instanceof Error ? error.message : "The Dropbox gallery could not be loaded.";
  }

  return <div className="admin-page admin-gallery-page">
    <Link className="admin-back-link" href="/admin">← Administration</Link>
    <header className="admin-page__heading"><div><p className="eyebrow">Dropbox media library</p><h1>Image gallery</h1><p>Browse approved imagery from the connected Dropbox folder and download the original files.</p></div>{!setupRequired ? <span className="admin-gallery-count">{images.length} {images.length === 1 ? "image" : "images"}</span> : null}</header>
    {setupRequired ? <section className="admin-gallery-setup"><span>Connection required</span><h2>Connect the UpSwing Dropbox folder.</h2><p>{errorMessage}</p><p>Add the documented server-only environment variables locally and in Vercel. Dropbox credentials never reach the browser.</p><Link className="admin-button admin-button--primary" href="/admin">Return to dashboard</Link></section> : null}
    {!setupRequired && errorMessage ? <p className="admin-form-error">{errorMessage} Try again after checking the Dropbox app permissions and folder path.</p> : null}
    {!errorMessage && images.length ? <section className="admin-gallery-grid" aria-label="Dropbox images">{images.map((image) => {
      const query = new URLSearchParams({ path: image.path }).toString();
      return <article key={image.id}><div className="admin-gallery-thumbnail"><Image src={`/admin/gallery/thumbnail?${query}`} alt={image.name} width={640} height={480} sizes="(max-width: 760px) 100vw, (max-width: 1200px) 50vw, 33vw" unoptimized /></div><div className="admin-gallery-card__body"><span>{image.folder}</span><h2>{image.name}</h2><p>{fileSize(image.size)}{image.modifiedAt ? ` · Updated ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(image.modifiedAt))}` : ""}</p><a className="admin-button admin-button--primary" href={`/admin/gallery/download?${query}`}>Download <span aria-hidden="true">↓</span></a></div></article>;
    })}</section> : null}
    {!errorMessage && !images.length ? <p className="admin-empty">No supported images were found in the connected Dropbox folder.</p> : null}
  </div>;
}
