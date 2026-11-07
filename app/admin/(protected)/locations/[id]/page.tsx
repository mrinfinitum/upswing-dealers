import { notFound } from "next/navigation";
import { DeleteLocationButton } from "@/components/admin/delete-location-button";
import { LocationForm } from "@/components/admin/location-form";
import { getManagedDealer } from "@/lib/admin/dealers";
import { loadOrganizationMatchCandidates, organizationsForDealer } from "@/lib/admin/organizations";
import { matchOrganization } from "@/lib/dealers/organization-match";
import { APPLICATION_SOURCE_WORKBOOK } from "@/lib/dealers/application";
import { getMapConfiguration } from "@/lib/maps/provider";
import Link from "next/link";
import { adminReturnLabel, safeAdminReturnPath } from "@/lib/admin/return-path";

export default async function EditLocationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string; returnTo?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const dealer = await getManagedDealer(decodeURIComponent(id));
  if (!dealer) notFound();
  const returnTo = safeAdminReturnPath(query.returnTo);
  const [linked, candidates] = await Promise.all([organizationsForDealer(dealer.id), loadOrganizationMatchCandidates()]);
  const match = linked.length ? null : matchOrganization(dealer, candidates);
  const organizations = {
    linked,
    options: candidates.map(({ id, name, locationCount }) => ({ id, name, locationCount })),
    suggestion: match ? { id: match.organization.id, reason: match.reason } : undefined,
    joinsWhenVerified: dealer.source.workbook === APPLICATION_SOURCE_WORKBOOK && dealer.verificationStatus !== "verified",
  };
  const backLabel = adminReturnLabel(returnTo);
  return <div className="admin-page admin-page--form"><Link className="admin-back-link" href={returnTo}>← {backLabel}</Link><div className="admin-page__heading"><div><p className="eyebrow">Dealer network</p><h1>Edit location</h1><p className="admin-record-id">Stable ID: {dealer.id}</p></div></div>{query.saved ? <p className="admin-notice">Location saved. <Link href={returnTo}>Back to {backLabel.toLowerCase()} →</Link></p> : null}{query.error === "delete" ? <p className="admin-form-error">The location could not be deleted.</p> : null}<LocationForm dealer={dealer} mapConfig={getMapConfiguration()} cancelHref={returnTo} cancelLabel={query.saved ? `Back to ${backLabel.toLowerCase()}` : undefined} organizations={organizations} /><section className="admin-danger-zone"><h2>Delete location</h2><p>Deactivation is usually safer because it preserves history.</p><DeleteLocationButton id={dealer.id} name={dealer.locationName ?? dealer.name} returnTo={returnTo} /></section></div>;
}
