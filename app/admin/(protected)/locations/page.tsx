import { DealerAdminDataError, listManagedDealers } from "@/lib/admin/dealers";
import Link from "next/link";
import type { Dealer } from "@/types/dealer";

export default async function LocationsPage({ searchParams }: { searchParams: Promise<{ q?: string; deleted?: string }> }) {
  const params = await searchParams;
  let dealers: Dealer[] = [];
  let setupRequired = false;
  try { dealers = await listManagedDealers(params.q); } catch (error) { if (error instanceof DealerAdminDataError) setupRequired = true; else throw error; }
  return (
    <div className="admin-page">
      <div className="admin-page__heading"><div><p className="eyebrow">Dealer network</p><h1>Locations</h1><p>Manage the records that power the public dealer locator.</p></div><Link className="admin-button admin-button--primary" href="/admin/locations/new">Add location</Link></div>
      {params.deleted ? <p className="admin-notice">Location deleted.</p> : null}
      {setupRequired ? <section className="admin-setup"><h2>Database setup required</h2><p>Apply the Supabase migration and run the dealer import before managing locations. See <code>docs/supabase-admin.md</code>.</p></section> : (
        <>
          <form className="admin-toolbar"><label htmlFor="dealer-search">Search locations</label><div><input id="dealer-search" name="q" defaultValue={params.q} placeholder="Retailer, city, state, or country" /><button className="admin-button" type="submit">Search</button>{params.q ? <Link href="/admin/locations">Clear</Link> : null}</div></form>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Location</th><th>Market</th><th>Status</th><th>Published</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{dealers.map((dealer) => <tr key={dealer.id}><td><strong>{dealer.name}</strong><span>{dealer.locationName ?? dealer.addressLine1 ?? "No street address"}</span></td><td>{[dealer.city, dealer.stateProvince, dealer.country].filter(Boolean).join(", ")}</td><td><span className={`admin-status admin-status--${dealer.verificationStatus}`}>{dealer.verificationStatus?.replace("-", " ")}</span></td><td>{dealer.active && dealer.verificationStatus === "verified" ? "Yes" : "No"}</td><td><Link href={`/admin/locations/${encodeURIComponent(dealer.id)}`}>Edit</Link></td></tr>)}</tbody></table>{dealers.length === 0 ? <p className="admin-empty">No locations match this search.</p> : null}</div>
        </>
      )}
    </div>
  );
}
