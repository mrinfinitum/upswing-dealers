import { notFound } from "next/navigation";
import { DeleteLocationButton } from "@/components/admin/delete-location-button";
import { LocationForm } from "@/components/admin/location-form";
import { getManagedDealer } from "@/lib/admin/dealers";
import { getMapConfiguration } from "@/lib/maps/provider";
import { safeAdminReturnPath } from "@/lib/admin/return-path";

export default async function EditLocationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string; returnTo?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const dealer = await getManagedDealer(decodeURIComponent(id));
  if (!dealer) notFound();
  const returnTo = safeAdminReturnPath(query.returnTo);
  return <div className="admin-page admin-page--form"><div className="admin-page__heading"><div><p className="eyebrow">Dealer network</p><h1>Edit location</h1><p className="admin-record-id">Stable ID: {dealer.id}</p></div></div>{query.saved ? <p className="admin-notice">Location saved.</p> : null}{query.error === "delete" ? <p className="admin-form-error">The location could not be deleted.</p> : null}<LocationForm dealer={dealer} mapConfig={getMapConfiguration()} cancelHref={returnTo} /><section className="admin-danger-zone"><h2>Delete location</h2><p>Deactivation is usually safer because it preserves history.</p><DeleteLocationButton id={dealer.id} name={dealer.locationName ?? dealer.name} /></section></div>;
}
