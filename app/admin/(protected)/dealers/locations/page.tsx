import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DealerAdminDataError, listManagedDealers } from "@/lib/admin/dealers";
import type { Dealer } from "@/types/dealer";

function dealerInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

export default async function DealerLocationsPage({ searchParams }: { searchParams: Promise<{ dealer?: string; deleted?: string }> }) {
  const { dealer: dealerName = "", deleted } = await searchParams;
  if (!dealerName) redirect("/admin/dealers");
  let locations: Dealer[] = [];
  let setupRequired = false;
  try {
    const allLocations = await listManagedDealers();
    locations = allLocations.filter((location) => location.name.localeCompare(dealerName, undefined, { sensitivity: "base" }) === 0);
  } catch (error) {
    if (error instanceof DealerAdminDataError) setupRequired = true;
    else throw error;
  }
  const returnTo = `/admin/dealers/locations?dealer=${encodeURIComponent(dealerName)}`;
  const published = locations.filter((location) => location.active && location.verificationStatus === "verified").length;
  const mapped = locations.filter((location) => location.coordinates).length;
  const countries = [...new Set(locations.map((location) => location.country).filter(Boolean))].sort();
  const markets = [...new Set(locations.map((location) => [location.city, location.stateProvince].filter(Boolean).join(", ")).filter(Boolean))];

  return (
    <div className="admin-page admin-dealer-locations-page">
      <Link className="admin-back-link" href="/admin/dealers">← Dealers</Link>
      <section className="admin-dealer-portal-hero">
        <div className="admin-dealer-portal-hero__top"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={150} height={70} priority /><span>Authorized retail partner</span></div>
        <div className="admin-dealer-portal-hero__body"><div className="admin-dealer-portal-mark" aria-hidden="true">{dealerInitials(dealerName)}</div><div><p className="eyebrow">Dealer partner overview</p><h1>{dealerName}</h1><p>{dealerName} is part of the authorized UpSwing dealer network. Manage its public location details, publishing status, and geographic coverage from one workspace.</p><div className="admin-dealer-portal-tags"><span>{locations.length} {locations.length === 1 ? "location" : "locations"}</span>{countries.map((country) => <span key={country}>{country}</span>)}</div></div></div>
        <Link className="admin-button admin-button--light" href="/admin/locations/new">Add location <span aria-hidden="true">＋</span></Link>
      </section>

      <section className="admin-dealer-portal-stats" aria-label="Dealer summary"><article><span>Locations</span><strong>{locations.length}</strong><small>Linked records</small></article><article><span>Published</span><strong>{published}</strong><small>Verified and active</small></article><article><span>Mapped</span><strong>{mapped}</strong><small>Coordinate-bearing</small></article><article><span>Markets</span><strong>{markets.length}</strong><small>{countries.length ? countries.join(" · ") : "No countries listed"}</small></article></section>
      {deleted ? <p className="admin-notice">Location deleted.</p> : null}
      {setupRequired ? <section className="admin-setup"><h2>Database setup required</h2><p>Apply the Supabase migration and run the dealer import before managing locations.</p></section> : <section className="admin-dealer-portal-locations"><header><div><p className="eyebrow">Location network</p><h2>Dealer locations</h2><p>Review every linked location and open a record to manage its verified public details.</p></div><span>{locations.length} total</span></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Location</th><th>Market</th><th>Status</th><th>Published</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{locations.map((location) => <tr key={location.id}><td><strong>{location.locationName ?? location.city}</strong><span>{location.addressLine1 ?? "No street address"}</span></td><td>{[location.city, location.stateProvince, location.country].filter(Boolean).join(", ")}</td><td><span className={`admin-status admin-status--${location.verificationStatus}`}>{location.verificationStatus?.replace("-", " ")}</span></td><td>{location.active && location.verificationStatus === "verified" ? "Yes" : "No"}</td><td><Link href={`/admin/locations/${encodeURIComponent(location.id)}?returnTo=${encodeURIComponent(returnTo)}`}>Edit →</Link></td></tr>)}</tbody></table>{locations.length === 0 ? <p className="admin-empty">No locations are assigned to this dealer.</p> : null}</div></section>}
    </div>
  );
}
