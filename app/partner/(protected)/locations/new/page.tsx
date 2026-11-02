import Link from "next/link";
import { DealerLocationForm } from "@/components/portal/dealer-location-form";
import { getMapConfiguration } from "@/lib/maps/provider";
import { requireDealerPortal } from "@/lib/portal/auth";

export default async function NewDealerLocationPage() {
  const identity = await requireDealerPortal("locations");
  const organizations = identity.memberships
    .filter((membership) => membership.pagePermissions.includes("locations"))
    .map((membership) => ({ id: membership.organizationId, name: membership.organizationName }));
  return (
    <div className="portal-content portal-page">
      <Link className="portal-back" href="/partner/locations">← All locations</Link>
      <header className="portal-page-heading"><div><p className="portal-kicker">New location</p><h1>Add a location.</h1></div><p>Add a store where customers can find UpSwing. It appears on the dealer locator as soon as you save.</p></header>
      <DealerLocationForm organizations={organizations} mapConfig={getMapConfiguration()} />
    </div>
  );
}
