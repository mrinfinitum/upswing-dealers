import Link from "next/link";

const administrationLinks = [
  { href: "/admin/locations", eyebrow: "Dealer network", title: "Locations", description: "Create, review, geocode, and publish dealer locations." },
  { href: "/admin/dealers", eyebrow: "Portal access", title: "Dealer admins", description: "Manage dealer organizations, locations, memberships, and page access." },
  { href: "/admin/requests", eyebrow: "Review queue", title: "Update requests", description: "Review location changes submitted by authorized dealer admins." },
  { href: "/admin/users", eyebrow: "Access control", title: "Users", description: "View every account, invite users, and assign groups and permissions." },
];

export default function AdminDashboardPage() {
  return (
    <div className="admin-page admin-dashboard">
      <header className="admin-page__heading"><div><p className="eyebrow">UpSwing operations</p><h1>Administration</h1><p>Manage the dealer locator and portal from one secure workspace.</p></div></header>
      <nav className="admin-dashboard-grid" aria-label="Administration sections">
        {administrationLinks.map((item, index) => <Link href={item.href} key={item.href}><span>{String(index + 1).padStart(2, "0")} / {item.eyebrow}</span><h2>{item.title}</h2><p>{item.description}</p><strong>Open {item.title} →</strong></Link>)}
      </nav>
    </div>
  );
}
