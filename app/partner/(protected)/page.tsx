import Link from "next/link";
import { requireDealerPortal } from "@/lib/portal/auth";
import { getDealerPortalLocations } from "@/lib/portal/data";

export default async function DealerPortalDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const identity = await requireDealerPortal("dashboard");
  const canViewLocations = identity.permissions.includes("locations");
  const locations = canViewLocations ? await getDealerPortalLocations() : [];
  const { denied } = await searchParams;

  return (
    <div className="portal-dashboard">
      <section className="portal-dashboard-hero">
        <div><p className="portal-kicker">UpSwing dealer portal</p><h1>Everything your team needs to grow the game.</h1><p>Review approved locations and use the latest UpSwing brand resources.</p></div>
        <div className="portal-dashboard-hero__meta"><span>{identity.memberships.length}</span><p>{identity.memberships.length === 1 ? "dealer organization" : "dealer organizations"}</p><span>{locations.length}</span><p>assigned locations</p></div>
      </section>

      <div className="portal-content">
        {denied ? <p className="portal-notice" role="alert">Your administrator has not enabled that page for this account.</p> : null}
        <section className="portal-welcome"><div><p className="portal-kicker">Your access</p><h2>{identity.memberships.map((membership) => membership.organizationName).join(", ")}</h2></div><p>Your page and location access is managed by UpSwing. Contact your UpSwing representative if another teammate or organization should be added.</p></section>
        <section className="portal-dashboard-grid" aria-label="Portal sections">
          {canViewLocations ? <Link href="/partner/locations" className="portal-dashboard-card portal-dashboard-card--blue"><span>01 / Locations</span><h2>Keep every store easy to find.</h2><p>Review the storefront details currently published for your assigned locations.</p><strong>View locations →</strong></Link> : null}
          {identity.permissions.includes("brand") ? <Link href="/partner/brand" className="portal-dashboard-card portal-dashboard-card--dark"><span>02 / Brand</span><h2>One brand. Every touchpoint.</h2><p>Find approved logos, colors, usage guidance, and ready-to-use assets.</p><strong>Open brand resources →</strong></Link> : null}
          <Link href="/image-gallery" className="portal-dashboard-card portal-dashboard-card--blue"><span>03 / Image gallery</span><h2>Approved imagery. Ready when you are.</h2><p>Browse and download current UpSwing product and marketing images.</p><strong>Open image gallery →</strong></Link>
        </section>
      </div>
    </div>
  );
}
