import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDealerPortal } from "@/lib/portal/auth";
import { getDealerPortalLocations } from "@/lib/portal/data";

export default async function DealerLocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireDealerPortal("locations");
  const { id } = await params;
  const locations = await getDealerPortalLocations();
  const location = locations.find((candidate) => candidate.dealerId === id);
  if (!location) notFound();
  const address = [location.addressLine1, location.addressLine2, [location.city, location.stateProvince, location.postalCode].filter(Boolean).join(" "), location.country].filter(Boolean);

  return (
    <div className="portal-content portal-page portal-location-detail">
      <Link className="portal-back" href="/partner/locations">← All locations</Link>
      <header className="portal-page-heading"><div><p className="portal-kicker">Location details</p><h1>{location.locationName || `${location.dealerName} ${location.city}`}</h1></div><p>Review the current public information assigned to your dealer account.</p></header>
      <section className="portal-location-detail-card">
        <div><p className="portal-kicker">Public address</p><address>{address.map((line) => <span key={line}>{line}</span>)}</address></div>
        <dl>
          <div><dt>Status</dt><dd>{location.active ? "Live" : "Inactive"}</dd></div>
          <div><dt>Dealer</dt><dd>{location.organizationName}</dd></div>
          <div><dt>Phone</dt><dd>{location.phone ? <a href={`tel:${location.phone}`}>{location.phone}</a> : "Not provided"}</dd></div>
          <div><dt>Email</dt><dd>{location.email ? <a href={`mailto:${location.email}`}>{location.email}</a> : "Not provided"}</dd></div>
          <div><dt>Website</dt><dd>{location.website ? <a href={location.website} target="_blank" rel="noreferrer">Visit location site ↗</a> : "Not provided"}</dd></div>
        </dl>
      </section>
    </div>
  );
}
