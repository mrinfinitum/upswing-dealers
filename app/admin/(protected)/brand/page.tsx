import Link from "next/link";

export default function AdminBrandPortalPage() {
  return <div className="admin-page admin-future-page"><Link className="admin-back-link" href="/admin">← Administration</Link><section><p className="eyebrow">Reserved workspace</p><span>Coming soon</span><h1>Brand portal</h1><p>This protected area is reserved for future brand standards, dealer downloads, campaign toolkits, and approved shared assets.</p><Link className="admin-button" href="/admin">Return to dashboard</Link></section></div>;
}
