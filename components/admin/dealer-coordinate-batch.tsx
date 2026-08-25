"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveDealerCoordinateBatchAction } from "@/app/admin/(protected)/dealers/actions";
import { buildDealerGeocodeQuery } from "@/lib/geo/geocode-query";
import { geocodeCandidatesWithGoogle } from "@/lib/maps/google-loader";
import type { MapConfiguration } from "@/lib/maps/provider";
import type { Dealer } from "@/types/dealer";

const BATCH_SIZE = 5;

export function DealerCoordinateBatch({ dealers, mapConfig, reviewCount }: { dealers: Dealer[]; mapConfig: MapConfiguration; reviewCount: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [needsReview, setNeedsReview] = useState(0);
  const [failed, setFailed] = useState(0);
  const [message, setMessage] = useState("");

  async function geocodeDealers() {
    if (mapConfig.provider !== "google" || running) return;
    setRunning(true);
    setProcessed(0);
    setAccepted(0);
    setNeedsReview(0);
    setFailed(0);
    setMessage("Keep this page open while Google validates each published address.");

    let nextAccepted = 0;
    let nextNeedsReview = 0;
    let nextFailed = 0;
    try {
      for (let index = 0; index < dealers.length; index += BATCH_SIZE) {
        const batch = dealers.slice(index, index + BATCH_SIZE);
        const submissions = await Promise.all(batch.map(async (dealer) => {
          try {
            const candidates = await geocodeCandidatesWithGoogle(buildDealerGeocodeQuery(dealer), mapConfig);
            return { dealerId: dealer.id, candidates };
          } catch {
            return { dealerId: dealer.id, candidates: [] };
          }
        }));
        const result = await saveDealerCoordinateBatchAction(submissions);
        nextAccepted += result.accepted;
        nextNeedsReview += result.needsReview;
        nextFailed += result.failed;
        setAccepted(nextAccepted);
        setNeedsReview(nextNeedsReview);
        setFailed(nextFailed);
        setProcessed(Math.min(index + batch.length, dealers.length));
      }
      setMessage(`Coordinate review complete: ${nextAccepted} mapped, ${nextNeedsReview} need review, and ${nextFailed} failed.`);
      router.refresh();
    } catch {
      setMessage("Coordinate processing stopped unexpectedly. Saved coordinates were retained; run it again to continue with the remaining locations.");
    } finally {
      setRunning(false);
    }
  }

  if (!dealers.length) return null;

  return (
    <section className="admin-coordinate-batch" aria-labelledby="coordinate-batch-heading">
      <div>
        <p className="eyebrow">Map data</p>
        <h2 id="coordinate-batch-heading">Sync Map Data</h2>
        <p>{dealers.length} published {dealers.length === 1 ? "location is" : "locations are"} missing coordinates. Google automatically maps exact address matches; only ambiguous or materially mismatched results are held for review.</p>
      </div>
      <div className="admin-coordinate-batch__action">
        <button className="admin-button admin-button--primary" type="button" onClick={geocodeDealers} disabled={running || mapConfig.provider !== "google"}>
          {running ? `Syncing ${processed} of ${dealers.length}…` : "Sync Map Data"}
        </button>
        {mapConfig.provider !== "google" ? <small>Google Maps is not configured.</small> : null}
        {message ? <p role="status">{message}</p> : null}
        {running || processed ? <small>{accepted} mapped · {needsReview} review · {failed} failed</small> : null}
        {reviewCount ? <Link className="admin-coordinate-batch__review" href="/admin/dealers/map-review">Review {reviewCount} flagged {reviewCount === 1 ? "location" : "locations"} →</Link> : null}
      </div>
    </section>
  );
}
