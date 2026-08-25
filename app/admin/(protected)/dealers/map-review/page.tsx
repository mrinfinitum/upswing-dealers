import Link from "next/link";
import { approveDealerCoordinateCandidateAction } from "@/app/admin/(protected)/dealers/actions";
import { listManagedDealers } from "@/lib/admin/dealers";

export default async function DealerMapReviewPage() {
  const dealers = (await listManagedDealers())
    .filter((dealer) => dealer.active && dealer.verificationStatus === "verified" && !dealer.coordinates)
    .filter((dealer) => dealer.coordinateEvidence?.verificationStatus === "needs-review" || dealer.coordinateEvidence?.verificationStatus === "failed")
    .sort((left, right) => left.name.localeCompare(right.name) || left.city.localeCompare(right.city));

  return (
    <div className="admin-page admin-map-review-page">
      <Link className="admin-back-link" href="/admin/dealers">← Dealers</Link>
      <header className="admin-page__heading">
        <div><p className="eyebrow">Map data</p><h1>Coordinate Review</h1><p>Compare Google’s proposed map position with the verified dealer address before approving it.</p></div>
      </header>
      <div className="admin-map-review-summary"><strong>{dealers.length}</strong><span>{dealers.length === 1 ? "location requires" : "locations require"} review</span></div>
      <section className="admin-map-review-list" aria-label="Coordinate review queue">
        {dealers.map((dealer) => {
          const evidence = dealer.coordinateEvidence!;
          const address = [dealer.addressLine1, dealer.addressLine2, dealer.city, dealer.stateProvince, dealer.postalCode, dealer.country].filter(Boolean).join(", ");
          return <article key={dealer.id}>
            <header><div><span>{evidence.verificationStatus === "failed" ? "Geocode failed" : "Needs review"}</span><h2>{dealer.name}</h2><p>{dealer.locationName ?? [dealer.city, dealer.stateProvince].filter(Boolean).join(", ")}</p></div><Link href={`/admin/locations/${encodeURIComponent(dealer.id)}?returnTo=${encodeURIComponent("/admin/dealers/map-review")}`}>Edit address →</Link></header>
            <div className="admin-map-review-comparison">
              <section><small>Verified dealer address</small><strong>{address}</strong></section>
              <section><small>Google candidate</small><strong>{evidence.formattedAddress ?? "No candidate returned"}</strong>{evidence.proposedCoordinates ? <><code>{evidence.proposedCoordinates.latitude.toFixed(6)}, {evidence.proposedCoordinates.longitude.toFixed(6)}</code><a href={`https://www.google.com/maps/search/?api=1&query=${evidence.proposedCoordinates.latitude},${evidence.proposedCoordinates.longitude}`} target="_blank" rel="noreferrer">Open in Google Maps ↗</a></> : null}</section>
            </div>
            <div className="admin-map-review-details"><span>{[evidence.locationType, ...(evidence.resultTypes ?? [])].filter(Boolean).join(" · ") || "No precision data"}</span><ul>{evidence.discrepancies.map((discrepancy) => <li key={discrepancy}>{discrepancy}</li>)}</ul></div>
            {evidence.proposedCoordinates ? <form action={approveDealerCoordinateCandidateAction.bind(null, dealer.id)}><button className="admin-button admin-button--primary" type="submit">Approve map position</button><small>Only approve after confirming this candidate represents the same physical location.</small></form> : null}
          </article>;
        })}
        {!dealers.length ? <div className="admin-empty"><h2>No coordinates need review</h2><p>Run Sync Map Data from the Dealers page to validate currently unmapped addresses.</p></div> : null}
      </section>
    </div>
  );
}
