import Link from "next/link";
import { DealerAdminDataError, listManagedDealers } from "@/lib/admin/dealers";
import type { Dealer } from "@/types/dealer";

type DealerGroup = {
  name: string;
  locations: Dealer[];
  countries: string[];
  published: number;
};

type DealerDirectoryParams = {
  q?: string | string[];
  country?: string | string[];
  sort?: string | string[];
  view?: string | string[];
};

const firstValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";

function groupDealers(dealers: Dealer[]): DealerGroup[] {
  const groups = new Map<string, Dealer[]>();
  for (const dealer of dealers) groups.set(dealer.name, [...(groups.get(dealer.name) || []), dealer]);
  return [...groups.entries()].map(([name, locations]) => ({
    name,
    locations,
    countries: [...new Set(locations.map((location) => location.country).filter(Boolean))].sort(),
    published: locations.filter((location) => location.active && location.verificationStatus === "verified").length,
  }));
}

function directoryHref(params: Record<string, string>) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
  return `/admin/dealers${query.size ? `?${query}` : ""}`;
}

export default async function DealersPage({ searchParams }: { searchParams: Promise<DealerDirectoryParams> }) {
  const rawParams = await searchParams;
  const q = firstValue(rawParams.q);
  const country = firstValue(rawParams.country);
  const sort = firstValue(rawParams.sort) || "name";
  const view = firstValue(rawParams.view) === "list" ? "list" : "cards";
  let dealers: Dealer[] = [];
  let setupRequired = false;
  try { dealers = await listManagedDealers(); } catch (error) { if (error instanceof DealerAdminDataError) setupRequired = true; else throw error; }

  const allGroups = groupDealers(dealers);
  const countries = [...new Set(allGroups.flatMap((group) => group.countries))].sort();
  const needle = q.trim().toLowerCase();
  const groups = allGroups
    .filter((group) => !needle || group.name.toLowerCase().includes(needle) || group.countries.some((item) => item.toLowerCase().includes(needle)))
    .filter((group) => !country || group.countries.includes(country))
    .sort((left, right) => {
      if (sort === "country") return (left.countries[0] || "").localeCompare(right.countries[0] || "") || left.name.localeCompare(right.name);
      if (sort === "locations") return right.locations.length - left.locations.length || left.name.localeCompare(right.name);
      if (sort === "published") return right.published - left.published || left.name.localeCompare(right.name);
      return left.name.localeCompare(right.name);
    });

  const sharedParams = { q, country, sort };
  const filtersApplied = Boolean(q || country || sort !== "name");

  return (
    <div className="admin-page admin-dealers-page">
      <Link className="admin-back-link" href="/admin">← Administration</Link>
      <header className="admin-page__heading"><div><p className="eyebrow">Dealer network</p><h1>Dealers</h1><p>Sort, filter, and choose a retailer to manage its locations.</p></div><Link className="admin-button admin-button--primary admin-add-button" href="/admin/locations/new">Add dealer <span aria-hidden="true">＋</span></Link></header>
      {setupRequired ? <section className="admin-setup"><h2>Database setup required</h2><p>Apply the Supabase migration and run the dealer import before managing dealers. See <code>docs/supabase-admin.md</code>.</p></section> : <>
        <form className="admin-dealer-controls">
          <div className="admin-field admin-dealer-search"><label htmlFor="dealer-directory-search">Search</label><input id="dealer-directory-search" name="q" defaultValue={q} placeholder="Dealer or country" /></div>
          <div className="admin-field"><label htmlFor="dealer-country">Country</label><select id="dealer-country" name="country" defaultValue={country}><option value="">All countries</option>{countries.map((item) => <option value={item} key={item}>{item}</option>)}</select></div>
          <div className="admin-field"><label htmlFor="dealer-sort">Sort by</label><select id="dealer-sort" name="sort" defaultValue={sort}><option value="name">Name A–Z</option><option value="country">Country A–Z</option><option value="locations">Most locations</option><option value="published">Most published</option></select></div>
          <input type="hidden" name="view" value={view} />
          <button className="admin-button admin-button--primary" type="submit">Apply</button>
          {filtersApplied ? <Link className="admin-dealer-controls__clear" href={directoryHref({ view })}>Clear</Link> : null}
        </form>
        <div className="admin-directory-heading"><p><strong>{groups.length}</strong> {groups.length === 1 ? "dealer" : "dealers"}</p><nav aria-label="Dealer directory view"><Link className={view === "cards" ? "is-active" : ""} href={directoryHref({ ...sharedParams, view: "cards" })}>Cards</Link><Link className={view === "list" ? "is-active" : ""} href={directoryHref({ ...sharedParams, view: "list" })}>List</Link></nav></div>
        {view === "cards" ? <section className="admin-dealer-directory" aria-label="Dealers">
          {groups.map((group) => <Link href={`/admin/dealers/locations?dealer=${encodeURIComponent(group.name)}`} key={group.name}><span>Retail partner</span><h2>{group.name}</h2><p>{group.locations.length} {group.locations.length === 1 ? "location" : "locations"} · {group.published} published</p><small>{group.countries.join(" · ")}</small><strong>View locations →</strong></Link>)}
        </section> : <div className="admin-table-wrap admin-dealer-directory-list"><table className="admin-table"><thead><tr><th>Dealer</th><th>Country</th><th>Locations</th><th>Published</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{groups.map((group) => <tr key={group.name}><td><strong>{group.name}</strong></td><td>{group.countries.join(" · ")}</td><td>{group.locations.length}</td><td>{group.published}</td><td><Link href={`/admin/dealers/locations?dealer=${encodeURIComponent(group.name)}`}>View locations →</Link></td></tr>)}</tbody></table></div>}
        {groups.length === 0 ? <p className="admin-empty">No dealers match these filters.</p> : null}
      </>}
    </div>
  );
}
