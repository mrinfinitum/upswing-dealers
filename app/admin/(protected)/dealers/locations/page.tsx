import Link from "next/link";
import { redirect } from "next/navigation";
import { DealerAdminDataError, listManagedDealers } from "@/lib/admin/dealers";
import type { Dealer } from "@/types/dealer";

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

  return (
    <div className="admin-page admin-dealer-locations-page">
      <Link className="admin-back-link" href="/admin/dealers">← Dealers</Link>
      <header className="admin-page__heading"><div><p className="eyebrow">Dealer locations</p><h1>{dealerName}</h1><p>{locations.length} {locations.length === 1 ? "location" : "locations"} · {published} published</p></div><Link className="admin-button admin-button--primary" href="/admin/locations/new">Add location</Link></header>
      {deleted ? <p className="admin-notice">Location deleted.</p> : null}
      {setupRequired ? <section className="admin-setup"><h2>Database setup required</h2><p>Apply the Supabase migration and run the dealer import before managing locations.</p></section> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Location</th><th>Market</th><th>Status</th><th>Published</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{locations.map((location) => <tr key={location.id}><td><strong>{location.locationName ?? location.city}</strong><span>{location.addressLine1 ?? "No street address"}</span></td><td>{[location.city, location.stateProvince, location.country].filter(Boolean).join(", ")}</td><td><span className={`admin-status admin-status--${location.verificationStatus}`}>{location.verificationStatus?.replace("-", " ")}</span></td><td>{location.active && location.verificationStatus === "verified" ? "Yes" : "No"}</td><td><Link href={`/admin/locations/${encodeURIComponent(location.id)}?returnTo=${encodeURIComponent(returnTo)}`}>Edit</Link></td></tr>)}</tbody></table>{locations.length === 0 ? <p className="admin-empty">No locations are assigned to this dealer.</p> : null}</div>}
    </div>
  );
}
