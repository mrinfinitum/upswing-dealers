import Link from "next/link";
import { requireDealerPortal } from "@/lib/portal/auth";
import { getDealerPortalLocations } from "@/lib/portal/data";

function locationAddress(location: Awaited<ReturnType<typeof getDealerPortalLocations>>[number]) {
  return [location.addressLine1, location.addressLine2, [location.city, location.stateProvince, location.postalCode].filter(Boolean).join(" "), location.country].filter(Boolean);
}

export default async function DealerPortalLocationsPage() {
  await requireDealerPortal("locations");
  const locations = await getDealerPortalLocations();
  return (
    <div className="portal-content portal-page">
      <header className="portal-page-heading"><div><p className="portal-kicker">Assigned locations</p><h1>Keep every location current.</h1></div><p>These are the public-facing locations connected to your dealer account. Submit a correction when something changes; UpSwing will review it before publication.</p></header>
      {locations.length ? <div className="portal-location-grid">{locations.map((location) => (
        <article className="portal-location-card" key={`${location.organizationId}-${location.dealerId}`}>
          <div className="portal-location-card__top"><span>{location.organizationName}</span><span className={location.active ? "is-active" : ""}>{location.active ? "Live" : "Inactive"}</span></div>
          <h2>{location.locationName || `${location.dealerName} ${location.city}`}</h2>
          <address>{locationAddress(location).map((line) => <span key={line}>{line}</span>)}</address>
          <dl>
            {location.phone ? <><dt>Phone</dt><dd><a href={`tel:${location.phone}`}>{location.phone}</a></dd></> : null}
            {location.website ? <><dt>Website</dt><dd><a href={location.website} target="_blank" rel="noreferrer">Visit location site ↗</a></dd></> : null}
            {location.email ? <><dt>Email</dt><dd><a href={`mailto:${location.email}`}>{location.email}</a></dd></> : null}
          </dl>
          <Link className="portal-button portal-button--dark" href={`/partner/locations/${encodeURIComponent(location.dealerId)}`}>Review or request an update <span aria-hidden="true">→</span></Link>
        </article>
      ))}</div> : <div className="portal-empty"><h2>No locations are assigned.</h2><p>Ask your UpSwing administrator to connect this account to a dealer organization.</p></div>}
    </div>
  );
}
