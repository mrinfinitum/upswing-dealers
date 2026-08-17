import Link from "next/link";

export default function AdminImageGalleryPage() {
  return <div className="admin-page admin-future-page"><Link className="admin-back-link" href="/admin">← Administration</Link><section><p className="eyebrow">Reserved workspace</p><span>Coming soon</span><h1>Image gallery</h1><p>This protected area is reserved for future product photography, lifestyle imagery, campaign media, and dealer-ready downloads.</p><Link className="admin-button" href="/admin">Return to dashboard</Link></section></div>;
}
