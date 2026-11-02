import Link from "next/link";
import { notFound } from "next/navigation";
import { setDealerLocationActiveAction } from "@/app/partner/(protected)/locations/actions";
import { requireDealerPortal } from "@/lib/portal/auth";
import { getDealerPortalLocations } from "@/lib/portal/data";

const savedMessages: Record<string, string> = {
  created: "Location added. It’s now live on the dealer locator.",
  updated: "Changes saved. They’re now live on the dealer locator.",
  removed: "Location removed from the dealer locator. You can restore it at any time.",
  restored: "Location restored. It’s live on the dealer locator again.",
};

export default async function DealerLocationDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireDealerPortal("locations");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locations = await getDealerPortalLocations();
  const location = locations.find((candidate) => candidate.dealerId === decodeURIComponent(id));
  if (!location) notFound();
  const address = [location.addressLine1, location.addressLine2, [location.city, location.stateProvince, location.postalCode].filter(Boolean).join(" "), location.country].filter(Boolean);
  const toggleActive = setDealerLocationActiveAction.bind(null, location.dealerId, !location.active);

  return (
    <div className="portal-content portal-page portal-location-detail">
      <Link className="portal-back" href="/partner/locations">← All locations</Link>
      <header className="portal-page-heading"><div><p className="portal-kicker">Location details</p><h1>{location.locationName || `${location.dealerName} ${location.city}`}</h1></div><p>These details appear on the public UpSwing dealer locator while the location is live.</p></header>
      {query.saved && savedMessages[query.saved] ? <p className="portal-notice" role="status">{savedMessages[query.saved]}</p> : null}
      {query.error ? <p className="portal-form-error" role="alert">That change couldn’t be saved. Please try again.</p> : null}
      <section className="portal-location-detail-card">
        <div><p className="portal-kicker">Public address</p><address>{address.map((line) => <span key={line}>{line}</span>)}</address></div>
        <dl>
          <div><dt>Status</dt><dd>{location.active ? "Live" : "Removed from locator"}</dd></div>
          <div><dt>Dealer</dt><dd>{location.organizationName}</dd></div>
          <div><dt>Phone</dt><dd>{location.phone ? <a href={`tel:${location.phone}`}>{location.phone}</a> : "Not provided"}</dd></div>
          <div><dt>Email</dt><dd>{location.email ? <a href={`mailto:${location.email}`}>{location.email}</a> : "Not provided"}</dd></div>
          <div><dt>Website</dt><dd>{location.website ? <a href={location.website} target="_blank" rel="noreferrer">Visit location site ↗</a> : "Not provided"}</dd></div>
        </dl>
      </section>
      <div className="portal-location-actions">
        <Link className="portal-button portal-button--dark" href={`/partner/locations/${encodeURIComponent(location.dealerId)}/edit`}>Edit location <span aria-hidden="true">→</span></Link>
        <form action={toggleActive}>
          <button className={`portal-button${location.active ? " portal-button--danger" : " portal-button--blue"}`} type="submit">{location.active ? "Remove from locator" : "Restore to locator"}</button>
        </form>
      </div>
      {location.active ? <p className="portal-form-help">Removing hides this location from the public locator. It stays here so you can restore it later.</p> : null}
    </div>
  );
}
