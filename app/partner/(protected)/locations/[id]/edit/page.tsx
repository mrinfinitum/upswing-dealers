import Link from "next/link";
import { notFound } from "next/navigation";
import { DealerLocationForm } from "@/components/portal/dealer-location-form";
import { getMapConfiguration } from "@/lib/maps/provider";
import { requireDealerPortal } from "@/lib/portal/auth";
import { getDealerPortalLocations } from "@/lib/portal/data";

export default async function EditDealerLocationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireDealerPortal("locations");
  const { id } = await params;
  const location = (await getDealerPortalLocations()).find((candidate) => candidate.dealerId === decodeURIComponent(id));
  if (!location) notFound();
  return (
    <div className="portal-content portal-page">
      <Link className="portal-back" href={`/partner/locations/${encodeURIComponent(location.dealerId)}`}>← Back to location</Link>
      <header className="portal-page-heading"><div><p className="portal-kicker">Edit location</p><h1>{location.locationName || `${location.dealerName} ${location.city}`}</h1></div><p>Update the public details for this location. Changes go live on the dealer locator as soon as you save.</p></header>
      <DealerLocationForm location={location} organizations={[{ id: location.organizationId, name: location.organizationName }]} mapConfig={getMapConfiguration()} />
    </div>
  );
}
