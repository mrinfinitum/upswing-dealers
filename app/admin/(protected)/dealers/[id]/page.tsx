import Link from "next/link";
import { notFound } from "next/navigation";
import { DealerMembershipForm } from "@/components/admin/dealer-access-forms";
import { DealerOrganizationForm } from "@/components/admin/dealer-organization-form";
import { LocationViewToggle, type LocationView } from "@/components/layout/location-view-toggle";
import { dealerRowToDealer, type DealerRow } from "@/lib/dealers/supabase-mapper";
import { createClient } from "@/lib/supabase/server";
import type { PortalPageKey } from "@/types/portal";

type Organization = { id: string; name: string; slug: string; active: boolean };
type Membership = { user_id: string; organization_id: string; page_permissions: PortalPageKey[]; active: boolean };
type Profile = { user_id: string; email: string; display_name: string | null; active: boolean };

export default async function DealerOrganizationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const view: LocationView = query.view === "list" ? "list" : "grid";
  const returnTo = `/admin/dealers/${id}?view=${view}`;
  const supabase = await createClient();
  const { data: organizationData, error: organizationError } = await supabase.from("dealer_organizations").select("id, name, slug, active").eq("id", id).maybeSingle();
  if (organizationError || !organizationData) notFound();
  const organization = organizationData as Organization;

  const [{ data: locationLinks }, { data: membershipData }] = await Promise.all([
    supabase.from("dealer_organization_locations").select("dealer_id").eq("organization_id", id),
    supabase.from("dealer_memberships").select("user_id, organization_id, page_permissions, active").eq("organization_id", id),
  ]);
  const dealerIds = (locationLinks || []).map((link) => link.dealer_id);
  const memberIds = (membershipData || []).map((membership) => membership.user_id);
  const [{ data: dealerData }, { data: profileData }] = await Promise.all([
    dealerIds.length ? supabase.from("dealers").select("*").in("id", dealerIds).order("country").order("state_province").order("city") : Promise.resolve({ data: [] }),
    memberIds.length ? supabase.from("dealer_portal_users").select("user_id, email, display_name, active").in("user_id", memberIds) : Promise.resolve({ data: [] }),
  ]);
  const dealers = ((dealerData || []) as DealerRow[]).map(dealerRowToDealer);
  const memberships = (membershipData || []) as Membership[];
  const profiles = (profileData || []) as Profile[];

  return (
    <div className="admin-page admin-organization-page">
      <Link className="admin-back-link" href="/admin/users#dealer-organizations">← Users</Link>
      <header className="admin-page__heading"><div><p className="eyebrow">Dealer organization</p><h1>{organization.name}</h1><p>{dealers.length} linked {dealers.length === 1 ? "location" : "locations"} · {memberships.length} portal {memberships.length === 1 ? "user" : "users"}</p></div><span className={organization.active ? "admin-status admin-status--verified" : "admin-status"}>{organization.active ? "Active" : "Inactive"}</span></header>

      <section className="admin-organization-settings"><div><p className="eyebrow">Organization settings</p><h2>Dealer details</h2><p>These settings control the dealer organization and portal access. Individual public location information is edited below.</p></div><DealerOrganizationForm organization={organization} /></section>

      <section className="admin-organization-section"><header><div><p className="eyebrow">Dealer network</p><h2>Locations</h2><p>Review every public and internal field, then open the full editor to make verified changes.</p></div><div className="admin-location-view-actions"><LocationViewToggle basePath={`/admin/dealers/${id}`} view={view} /><Link className="admin-button" href={`/admin/locations?q=${encodeURIComponent(organization.name)}`}>Search all locations</Link></div></header>{dealers.length && view === "grid" ? <div className="admin-dealer-location-grid">{dealers.map((dealer) => {
        const address = [dealer.addressLine1, dealer.addressLine2, [dealer.city, dealer.stateProvince, dealer.postalCode].filter(Boolean).join(" "), dealer.country].filter(Boolean);
        return <article key={dealer.id}><header><div><span>{dealer.name}</span><h3>{dealer.locationName || dealer.city}</h3></div><span className={`admin-status admin-status--${dealer.verificationStatus}`}>{dealer.verificationStatus?.replace("-", " ")}</span></header><address>{address.map((line) => <span key={line}>{line}</span>)}</address><dl><div><dt>Published</dt><dd>{dealer.active && dealer.verificationStatus === "verified" ? "Yes" : "No"}</dd></div><div><dt>Phone</dt><dd>{dealer.phone || "Not provided"}</dd></div><div><dt>Email</dt><dd>{dealer.email || "Not provided"}</dd></div><div><dt>Website</dt><dd>{dealer.website ? <a href={dealer.website} target="_blank" rel="noreferrer">Open website ↗</a> : "Not provided"}</dd></div><div><dt>Coordinates</dt><dd>{dealer.coordinates ? `${dealer.coordinates.latitude.toFixed(6)}, ${dealer.coordinates.longitude.toFixed(6)}` : "Not mapped"}</dd></div><div><dt>Dealer type</dt><dd>{dealer.dealerType || "Not provided"}</dd></div><div><dt>Source</dt><dd>{dealer.source ? `${dealer.source.sheet}, row ${dealer.source.row}` : "Admin record"}</dd></div><div><dt>Stable ID</dt><dd className="admin-record-id">{dealer.id}</dd></div></dl>{dealer.notes ? <p className="admin-location-notes"><strong>Internal notes</strong>{dealer.notes}</p> : null}<Link className="admin-button admin-button--primary" href={`/admin/locations/${encodeURIComponent(dealer.id)}?returnTo=${encodeURIComponent(returnTo)}`}>Edit full location</Link></article>;
      })}</div> : null}{dealers.length && view === "list" ? <div className="admin-dealer-list-wrap"><table className="admin-dealer-list"><thead><tr><th>Location</th><th>Address</th><th>Contact</th><th>Verification</th><th>Published</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{dealers.map((dealer) => <tr key={dealer.id}><td><strong>{dealer.locationName || dealer.city}</strong><span>{dealer.name}</span><small className="admin-record-id">{dealer.id}</small></td><td><address>{[dealer.addressLine1, dealer.addressLine2, [dealer.city, dealer.stateProvince, dealer.postalCode].filter(Boolean).join(" "), dealer.country].filter(Boolean).map((line) => <span key={line}>{line}</span>)}</address></td><td>{dealer.phone ? <a href={`tel:${dealer.phone}`}>{dealer.phone}</a> : <span>Phone not provided</span>}{dealer.email ? <a href={`mailto:${dealer.email}`}>{dealer.email}</a> : null}</td><td><span className={`admin-status admin-status--${dealer.verificationStatus}`}>{dealer.verificationStatus?.replace("-", " ")}</span></td><td>{dealer.active && dealer.verificationStatus === "verified" ? "Yes" : "No"}</td><td><Link href={`/admin/locations/${encodeURIComponent(dealer.id)}?returnTo=${encodeURIComponent(returnTo)}`}>Edit →</Link></td></tr>)}</tbody></table></div> : null}{!dealers.length ? <p className="admin-empty">No locations are linked to this dealer organization.</p> : null}</section>

      <section className="admin-organization-section"><header><div><p className="eyebrow">Portal access</p><h2>Authorized dealer admins</h2><p>Control which pages each dealer contact can access.</p></div></header>{memberships.length ? <div className="admin-membership-grid">{memberships.map((membership) => { const profile = profiles.find((candidate) => candidate.user_id === membership.user_id); return <article key={membership.user_id}><header><div><span>{organization.name}</span><h3>{profile?.display_name || profile?.email || "Dealer admin"}</h3><p>{profile?.email}</p></div><span className={membership.active ? "admin-status admin-status--verified" : "admin-status"}>{membership.active ? "Active" : "Paused"}</span></header><DealerMembershipForm membership={{ userId: membership.user_id, organizationId: id, permissions: membership.page_permissions, active: membership.active }} /></article>; })}</div> : <p className="admin-empty">No dealer admins are assigned to this organization.</p>}</section>
    </div>
  );
}
