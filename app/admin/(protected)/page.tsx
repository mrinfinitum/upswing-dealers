import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";

const administrationLinks = [
  { href: "/admin/dealers", eyebrow: "Dealer network", title: "Dealers", description: "Choose a retailer, then manage only that dealer’s locations." },
  { href: "/admin/users", eyebrow: "Access control", title: "Users", description: "Manage user accounts, groups, dealer access, and page permissions." },
  { href: "/image-gallery", eyebrow: "Media library", title: "Image gallery", description: "Browse and download approved imagery from the connected Dropbox library." },
];

const reservedSections = [
  { href: "/admin/brand", eyebrow: "Brand resources", title: "Brand portal", description: "Manage approved brand standards, dealer downloads, and shared marketing assets." },
];

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  return (
    <div className="admin-page admin-dashboard">
      <header className="admin-dashboard-welcome"><div><p className="eyebrow">UpSwing administration</p><h1>Welcome, {admin.displayName}.</h1><p>Everything you need to manage the dealer network, portal access, and public locator is ready in one secure workspace.</p></div><div className="admin-dashboard-welcome__actions"><Link className="admin-button admin-button--primary admin-add-button" href="/admin/locations/new">Add dealer <span aria-hidden="true">＋</span></Link><Link className="admin-button" href="/" target="_blank" rel="noreferrer">View locator ↗</Link></div></header>
      <section className="admin-dashboard-grid" aria-label="Administration sections">
        {administrationLinks.map((item, index) => <Link href={item.href} key={item.href}><span>{String(index + 1).padStart(2, "0")} / {item.eyebrow}</span><i aria-hidden="true">↗</i><h2>{item.title}</h2><p>{item.description}</p><strong>Open {item.title} <b aria-hidden="true">→</b></strong></Link>)}
        {reservedSections.map((item, index) => <Link className="admin-dashboard-card--reserved" href={item.href} key={item.title}><span>{String(index + administrationLinks.length + 1).padStart(2, "0")} / {item.eyebrow}</span><i aria-hidden="true">＋</i><h2>{item.title}</h2><p>{item.description}</p><strong>Reserved <b>Coming soon</b></strong></Link>)}
      </section>
    </div>
  );
}
