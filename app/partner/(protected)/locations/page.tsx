import Link from "next/link";
import { LocationViewToggle, type LocationView } from "@/components/layout/location-view-toggle";
import { requireDealerPortal } from "@/lib/portal/auth";
import { getDealerPortalLocations } from "@/lib/portal/data";

function locationAddress(location: Awaited<ReturnType<typeof getDealerPortalLocations>>[number]) {
  return [location.addressLine1, location.addressLine2, [location.city, location.stateProvince, location.postalCode].filter(Boolean).join(" "), location.country].filter(Boolean);
}

export default async function DealerPortalLocationsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireDealerPortal("locations");
  const query = await searchParams;
  const view: LocationView = query.view === "list" ? "list" : "grid";
  const locations = await getDealerPortalLocations();
  return (
    <div className="portal-content portal-page">
      <header className="portal-page-heading"><div><p className="portal-kicker">Assigned locations</p><h1>Your dealer locations.</h1></div><p>Review the public-facing locations connected to your dealer account.</p></header>
      <div className="portal-location-toolbar"><p>{locations.length} assigned {locations.length === 1 ? "location" : "locations"}</p><LocationViewToggle basePath="/partner/locations" view={view} /></div>
      {locations.length && view === "grid" ? <div className="portal-location-grid">{locations.map((location) => (
        <article className="portal-location-card" key={`${location.organizationId}-${location.dealerId}`}>
          <div className="portal-location-card__top"><span>{location.organizationName}</span><span className={location.active ? "is-active" : ""}>{location.active ? "Live" : "Inactive"}</span></div>
          <h2>{location.locationName || `${location.dealerName} ${location.city}`}</h2>
          <address>{locationAddress(location).map((line) => <span key={line}>{line}</span>)}</address>
          <dl>
            {location.phone ? <><dt>Phone</dt><dd><a href={`tel:${location.phone}`}>{location.phone}</a></dd></> : null}
            {location.website ? <><dt>Website</dt><dd><a href={location.website} target="_blank" rel="noreferrer">Visit location site ↗</a></dd></> : null}
            {location.email ? <><dt>Email</dt><dd><a href={`mailto:${location.email}`}>{location.email}</a></dd></> : null}
          </dl>
          <Link className="portal-button portal-button--dark" href={`/partner/locations/${encodeURIComponent(location.dealerId)}`}>View details <span aria-hidden="true">→</span></Link>
        </article>
      ))}</div> : null}
      {locations.length && view === "list" ? <div className="portal-location-table-wrap"><table className="portal-location-table"><thead><tr><th>Location</th><th>Address</th><th>Phone</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{locations.map((location) => <tr key={`${location.organizationId}-${location.dealerId}`}><td><strong>{location.locationName || `${location.dealerName} ${location.city}`}</strong><span>{location.organizationName}</span></td><td><address>{locationAddress(location).map((line) => <span key={line}>{line}</span>)}</address></td><td>{location.phone ? <a href={`tel:${location.phone}`}>{location.phone}</a> : <span className="is-muted">Not provided</span>}</td><td><span className={location.active ? "portal-list-status is-live" : "portal-list-status"}>{location.active ? "Live" : "Inactive"}</span></td><td><Link href={`/partner/locations/${encodeURIComponent(location.dealerId)}`}>View →</Link></td></tr>)}</tbody></table></div> : null}
      {!locations.length ? <div className="portal-empty"><h2>No locations are assigned.</h2><p>Ask your UpSwing administrator to connect this account to a dealer organization.</p></div> : null}
    </div>
  );
}
