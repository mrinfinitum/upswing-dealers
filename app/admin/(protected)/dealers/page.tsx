import Link from "next/link";
import { DealerAdminDataError, listManagedDealers } from "@/lib/admin/dealers";
import type { Dealer } from "@/types/dealer";

type DealerGroup = {
  name: string;
  locations: Dealer[];
  countries: string[];
  published: number;
};

function groupDealers(dealers: Dealer[]): DealerGroup[] {
  const groups = new Map<string, Dealer[]>();
  for (const dealer of dealers) groups.set(dealer.name, [...(groups.get(dealer.name) || []), dealer]);
  return [...groups.entries()].map(([name, locations]) => ({
    name,
    locations,
    countries: [...new Set(locations.map((location) => location.country).filter(Boolean))].sort(),
    published: locations.filter((location) => location.active && location.verificationStatus === "verified").length,
  })).sort((left, right) => left.name.localeCompare(right.name));
}

export default async function DealersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  let dealers: Dealer[] = [];
  let setupRequired = false;
  try { dealers = await listManagedDealers(); } catch (error) { if (error instanceof DealerAdminDataError) setupRequired = true; else throw error; }
  const needle = q.trim().toLowerCase();
  const groups = groupDealers(dealers).filter((group) => !needle || group.name.toLowerCase().includes(needle) || group.countries.some((country) => country.toLowerCase().includes(needle)));

  return (
    <div className="admin-page admin-dealers-page">
      <Link className="admin-back-link" href="/admin">← Administration</Link>
      <header className="admin-page__heading"><div><p className="eyebrow">Dealer network</p><h1>Dealers</h1><p>Choose a dealer to manage only that retailer’s locations.</p></div><Link className="admin-button admin-button--primary admin-add-button" href="/admin/locations/new">Add dealer <span aria-hidden="true">＋</span></Link></header>
      {setupRequired ? <section className="admin-setup"><h2>Database setup required</h2><p>Apply the Supabase migration and run the dealer import before managing dealers. See <code>docs/supabase-admin.md</code>.</p></section> : <>
        <form className="admin-toolbar"><label htmlFor="dealer-directory-search">Search dealers</label><div><input id="dealer-directory-search" name="q" defaultValue={q} placeholder="Dealer or operating country" /><button className="admin-button" type="submit">Search</button>{q ? <Link href="/admin/dealers">Clear</Link> : null}</div></form>
        <section className="admin-dealer-directory" aria-label="Dealers">
          {groups.map((group) => <Link href={`/admin/dealers/locations?dealer=${encodeURIComponent(group.name)}`} key={group.name}><span>Retail partner</span><h2>{group.name}</h2><p>{group.locations.length} {group.locations.length === 1 ? "location" : "locations"} · {group.published} published</p><small>{group.countries.join(" · ")}</small><strong>View locations →</strong></Link>)}
        </section>
        {groups.length === 0 ? <p className="admin-empty">No dealers match this search.</p> : null}
      </>}
    </div>
  );
}
