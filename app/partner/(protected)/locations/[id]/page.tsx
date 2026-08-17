import Link from "next/link";
import { notFound } from "next/navigation";
import { submitLocationChangeRequestAction } from "@/app/partner/actions";
import { requireDealerPortal } from "@/lib/portal/auth";
import { getDealerPortalLocations } from "@/lib/portal/data";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string; unchanged?: string; error?: string }>;
};

export default async function DealerLocationReviewPage({ params, searchParams }: PageProps) {
  const identity = await requireDealerPortal("locations");
  const { id } = await params;
  const locations = await getDealerPortalLocations();
  const location = locations.find((candidate) => candidate.dealerId === id);
  if (!location) notFound();
  const query = await searchParams;
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("dealer_location_change_requests")
    .select("id, status, proposed_changes, created_at, review_notes")
    .eq("dealer_id", id)
    .eq("requested_by", identity.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const action = submitLocationChangeRequestAction.bind(null, id);

  return (
    <div className="portal-content portal-page portal-location-review">
      <Link className="portal-back" href="/partner/locations">← All locations</Link>
      <header className="portal-page-heading"><div><p className="portal-kicker">Location review</p><h1>{location.locationName || `${location.dealerName} ${location.city}`}</h1></div><p>Submit only confirmed corrections. UpSwing will review the request before changing the public dealer locator.</p></header>
      {query.submitted ? <p className="portal-notice">Your update request was sent to UpSwing for review.</p> : null}
      {query.unchanged ? <p className="portal-notice">No changes were detected.</p> : null}
      {query.error ? <p className="portal-form-error" role="alert">The request could not be submitted. Check the website and email fields, then try again.</p> : null}
      <div className="portal-review-grid">
        <form action={action} className="portal-location-form">
          <div className="portal-field portal-field--wide"><label htmlFor="locationName">Public location name</label><input id="locationName" name="locationName" defaultValue={location.locationName} /></div>
          <div className="portal-field portal-field--wide"><label htmlFor="addressLine1">Street address</label><input id="addressLine1" name="addressLine1" defaultValue={location.addressLine1} required /></div>
          <div className="portal-field portal-field--wide"><label htmlFor="addressLine2">Address line 2</label><input id="addressLine2" name="addressLine2" defaultValue={location.addressLine2} /></div>
          <div className="portal-field"><label htmlFor="city">City</label><input id="city" name="city" defaultValue={location.city} required /></div>
          <div className="portal-field"><label htmlFor="stateProvince">State / province</label><input id="stateProvince" name="stateProvince" defaultValue={location.stateProvince} /></div>
          <div className="portal-field"><label htmlFor="postalCode">ZIP / postal code</label><input id="postalCode" name="postalCode" defaultValue={location.postalCode} /></div>
          <div className="portal-field"><label htmlFor="country">Country</label><input id="country" name="country" defaultValue={location.country} required /></div>
          <div className="portal-field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" defaultValue={location.phone} /></div>
          <div className="portal-field"><label htmlFor="email">Public email</label><input id="email" name="email" type="email" defaultValue={location.email} /></div>
          <div className="portal-field portal-field--wide"><label htmlFor="website">Location website</label><input id="website" name="website" type="url" defaultValue={location.website} /></div>
          <p className="portal-form-help">Coordinates are never entered manually. If an approved address changes, UpSwing will validate and geocode it before publication.</p>
          <button className="portal-button portal-button--dark" type="submit">Submit for review <span aria-hidden="true">→</span></button>
        </form>
        <aside className="portal-request-history"><p className="portal-kicker">Request history</p><h2>Recent submissions</h2>{requests?.length ? <ol>{requests.map((request) => <li key={request.id}><span className={`portal-request-status portal-request-status--${request.status}`}>{request.status}</span><time dateTime={request.created_at}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(request.created_at))}</time><p>{Object.keys(request.proposed_changes as Record<string, unknown>).length} proposed field changes</p>{request.review_notes ? <small>{request.review_notes}</small> : null}</li>)}</ol> : <p>No update requests have been submitted for this location.</p>}</aside>
      </div>
    </div>
  );
}
