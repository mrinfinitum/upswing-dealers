import Link from "next/link";
import { DealerLogoForm } from "@/components/dealer-logo/dealer-logo-form";
import { LocationViewToggle, type LocationView } from "@/components/layout/location-view-toggle";
import { dealerLogoUrl } from "@/lib/dealers/logo-url";
import { requireDealerPortal } from "@/lib/portal/auth";
import { getDealerPortalLocations } from "@/lib/portal/data";
import { createClient } from "@/lib/supabase/server";
import { updateOrganizationLogoAction } from "./actions";

function locationAddress(location: Awaited<ReturnType<typeof getDealerPortalLocations>>[number]) {
  return [location.addressLine1, location.addressLine2, [location.city, location.stateProvince, location.postalCode].filter(Boolean).join(" "), location.country].filter(Boolean);
}

export default async function DealerPortalLocationsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const identity = await requireDealerPortal("locations");
  const query = await searchParams;
  const view: LocationView = query.view === "list" ? "list" : "grid";
  const organizationIds = identity.memberships.filter((membership) => membership.pagePermissions.includes("locations")).map((membership) => membership.organizationId);
  const supabase = await createClient();
  const [locations, { data: organizations }] = await Promise.all([
    getDealerPortalLocations(),
    supabase.from("dealer_organizations").select("id, name, logo_path").in("id", organizationIds).order("name"),
  ]);
  return (
    <div className="portal-content portal-page">
      <header className="portal-page-heading"><div><p className="portal-kicker">Assigned locations</p><h1>Your dealer locations.</h1></div><p>Add, edit, or remove the locations customers see on the UpSwing dealer locator. Changes go live as soon as you save.</p></header>
      {(organizations || []).map((organization) => (
        <section className="portal-logo-panel" key={organization.id}>
          <div><p className="portal-kicker">Company logo</p><h2>{organizations!.length > 1 ? organization.name : "Your logo on the locator."}</h2><p>Shown with each of your locations on the UpSwing dealer locator. Uploads go live right away.</p></div>
          <DealerLogoForm action={updateOrganizationLogoAction.bind(null, organization.id)} logoUrl={dealerLogoUrl(organization.logo_path)} organizationName={organization.name} variant="portal" />
        </section>
      ))}
      <div className="portal-location-toolbar"><p>{locations.length} assigned {locations.length === 1 ? "location" : "locations"}</p><div className="portal-location-toolbar__actions"><LocationViewToggle basePath="/partner/locations" view={view} /><Link className="portal-button portal-button--blue" href="/partner/locations/new">Add location <span aria-hidden="true">＋</span></Link></div></div>
      {locations.length && view === "grid" ? <div className="portal-location-grid">{locations.map((location) => (
        <article className="portal-location-card" key={`${location.organizationId}-${location.dealerId}`}>
          <div className="portal-location-card__top"><span>{location.organizationName}</span><span className={location.active ? "is-active" : ""}>{location.active ? "Live" : "Removed"}</span></div>
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
      {locations.length && view === "list" ? <div className="portal-location-table-wrap"><table className="portal-location-table"><thead><tr><th>Location</th><th>Address</th><th>Phone</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{locations.map((location) => <tr key={`${location.organizationId}-${location.dealerId}`}><td><strong>{location.locationName || `${location.dealerName} ${location.city}`}</strong><span>{location.organizationName}</span></td><td><address>{locationAddress(location).map((line) => <span key={line}>{line}</span>)}</address></td><td>{location.phone ? <a href={`tel:${location.phone}`}>{location.phone}</a> : <span className="is-muted">Not provided</span>}</td><td><span className={location.active ? "portal-list-status is-live" : "portal-list-status"}>{location.active ? "Live" : "Removed"}</span></td><td><Link href={`/partner/locations/${encodeURIComponent(location.dealerId)}`}>View →</Link></td></tr>)}</tbody></table></div> : null}
      {!locations.length ? <div className="portal-empty"><h2>No locations are assigned.</h2><p>Add your first location, or ask your UpSwing contact to connect existing stores to your account.</p></div> : null}
    </div>
  );
}
