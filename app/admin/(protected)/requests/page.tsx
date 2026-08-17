import Link from "next/link";
import { resolveDealerRequestAction } from "@/app/admin/(protected)/requests/actions";
import { createClient } from "@/lib/supabase/server";

type RequestRow = { id: string; dealer_id: string; organization_id: string; requested_by: string; proposed_changes: Record<string, string | null>; status: string; review_notes: string | null; created_at: string };
type Profile = { user_id: string; email: string; display_name: string | null };
type Organization = { id: string; name: string };
type Dealer = { id: string; name: string; location_name: string | null; city: string; state_province: string | null };

const labels: Record<string, string> = { locationName: "Location name", addressLine1: "Street address", addressLine2: "Address line 2", city: "City", stateProvince: "State / province", postalCode: "ZIP / postal code", country: "Country", phone: "Phone", website: "Website", email: "Email" };

export default async function DealerRequestsAdminPage() {
  const supabase = await createClient();
  const [requestsResult, profilesResult, organizationsResult, dealersResult] = await Promise.all([
    supabase.from("dealer_location_change_requests").select("id, dealer_id, organization_id, requested_by, proposed_changes, status, review_notes, created_at").order("created_at", { ascending: false }),
    supabase.from("dealer_portal_users").select("user_id, email, display_name"),
    supabase.from("dealer_organizations").select("id, name"),
    supabase.from("dealers").select("id, name, location_name, city, state_province"),
  ]);
  const setupError = requestsResult.error || profilesResult.error || organizationsResult.error;
  const requests = (requestsResult.data || []) as RequestRow[];
  const profiles = (profilesResult.data || []) as Profile[];
  const organizations = (organizationsResult.data || []) as Organization[];
  const dealers = (dealersResult.data || []) as Dealer[];

  return <div className="admin-page"><header className="admin-page__heading"><div><p className="eyebrow">Dealer submissions</p><h1>Update requests</h1><p>Compare submitted changes against authoritative sources, update and geocode the dealer record, then close the request.</p></div></header>{setupError ? <section className="admin-setup"><h2>Dealer portal migration required</h2><p>Apply the dealer portal migration to enable the review queue.</p></section> : requests.length ? <div className="admin-request-list">{requests.map((request) => { const dealer = dealers.find((item) => item.id === request.dealer_id); const profile = profiles.find((item) => item.user_id === request.requested_by); const organization = organizations.find((item) => item.id === request.organization_id); return <article key={request.id}><header><div><span>{organization?.name}</span><h2>{dealer?.location_name || `${dealer?.name || "Dealer"} ${dealer?.city || ""}`}</h2><p>Submitted by {profile?.display_name || profile?.email || "dealer user"} · {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(request.created_at))}</p></div><span className={`admin-status admin-status--${request.status}`}>{request.status}</span></header><dl>{Object.entries(request.proposed_changes).map(([field, value]) => <div key={field}><dt>{labels[field] || field}</dt><dd>{value || <em>Remove value</em>}</dd></div>)}</dl>{request.status === "pending" ? <div className="admin-request-actions"><Link className="admin-button admin-button--primary" href={`/admin/locations/${encodeURIComponent(request.dealer_id)}?returnTo=${encodeURIComponent("/admin/requests")}`}>Review location record</Link><form action={resolveDealerRequestAction.bind(null, request.id, "approved")}><input name="reviewNotes" aria-label="Approval note" placeholder="Optional approval note" /><button className="admin-button" type="submit">Mark applied</button></form><form action={resolveDealerRequestAction.bind(null, request.id, "rejected")}><input name="reviewNotes" aria-label="Rejection reason" placeholder="Reason for rejection" /><button className="admin-button admin-button--danger" type="submit">Reject</button></form></div> : request.review_notes ? <p className="admin-request-note">Review note: {request.review_notes}</p> : null}</article>; })}</div> : <p className="admin-empty">No dealer update requests have been submitted.</p>}</div>;
}
