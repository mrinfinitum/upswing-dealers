import type { Dealer } from "@/types/dealer";
import { reviewGeocodeCandidate } from "@/lib/geo/geocode-review";
import type { GoogleBrowserGeocodeBatch, GoogleBrowserGeocodeRecord } from "./google-geocodes";
import { dealerCoordinateApprovals } from "./coordinate-approvals";
import type { DealerCoordinateApproval } from "./coordinate-approvals";

export type ReviewedGoogleCoordinate = GoogleBrowserGeocodeRecord & {
  finalStatus: "verified" | "needs-review" | "failed";
  discrepancies: string[];
};

export function reviewGoogleCoordinates(
  dealers: Dealer[],
  batch: GoogleBrowserGeocodeBatch,
): ReviewedGoogleCoordinate[] {
  const byId = new Map(dealers.map((dealer) => [dealer.id, dealer]));

  return batch.records.map((record) => {
    const dealer = byId.get(record.dealerId);
    if (!dealer) {
      return { ...record, finalStatus: "failed", discrepancies: ["No dealer matches this stable ID."] };
    }
    if (
      record.responseStatus !== "OK"
      || !record.coordinates
      || !record.formattedAddress
      || !record.resultTypes
      || !record.locationType
      || !record.addressComponents
    ) {
      return {
        ...record,
        finalStatus: "failed",
        discrepancies: [`Google geocoding failed with status ${record.responseStatus || "unknown"}.`],
      };
    }

    const review = reviewGeocodeCandidate(dealer, {
      coordinates: record.coordinates,
      formattedAddress: record.formattedAddress,
      resultTypes: record.resultTypes,
      locationType: record.locationType,
      addressComponents: record.addressComponents,
      partialMatch: record.partialMatch,
    });
    return { ...record, finalStatus: review.status, discrepancies: review.discrepancies };
  });
}

export function applyVerifiedGoogleCoordinates(
  dealers: Dealer[],
  batch: GoogleBrowserGeocodeBatch,
): Dealer[] {
  const reviewedById = new Map(reviewGoogleCoordinates(dealers, batch).map((record) => [record.dealerId, record]));
  const approvedById = new Map(dealerCoordinateApprovals.map((approval) => [approval.dealerId, approval]));

  return dealers.map((dealer) => {
    if (dealer.coordinates) return dealer;
    const approval = approvedById.get(dealer.id);
    if (approval) {
      return {
        ...dealer,
        coordinates: approval.coordinates,
        coordinateEvidence: {
          source: "manual-coordinate-review",
          retrievedAt: approval.reviewedAt,
          formattedAddress: approval.googleFormattedAddress,
          locationType: approval.precisionResultType,
          verificationStatus: approval.verificationDecision,
          discrepancies: [],
          resolution: approval.reason,
          sourceUrls: approval.sourceUrls,
        },
      };
    }
    const record = reviewedById.get(dealer.id);
    if (!record || record.finalStatus !== "verified" || !record.coordinates) return dealer;
    return {
      ...dealer,
      coordinates: record.coordinates,
      coordinateEvidence: {
        source: "google-maps-js-geocoder",
        retrievedAt: batch.generatedAt,
        formattedAddress: record.formattedAddress,
        resultTypes: record.resultTypes,
        locationType: record.locationType,
        verificationStatus: record.finalStatus,
        discrepancies: record.discrepancies,
      },
    };
  });
}

export function validateCoordinateApprovals(
  dealers: Dealer[],
  batch: GoogleBrowserGeocodeBatch,
  approvals: DealerCoordinateApproval[] = dealerCoordinateApprovals,
): string[] {
  const dealerIds = new Set(dealers.map((dealer) => dealer.id));
  const reviewedById = new Map(reviewGoogleCoordinates(dealers, batch).map((record) => [record.dealerId, record]));
  const seen = new Set<string>();
  const issues: string[] = [];

  for (const approval of approvals) {
    if (seen.has(approval.dealerId)) issues.push(`Duplicate coordinate approval: ${approval.dealerId}`);
    seen.add(approval.dealerId);
    if (!dealerIds.has(approval.dealerId)) issues.push(`Unknown approved dealer ID: ${approval.dealerId}`);
    if (reviewedById.get(approval.dealerId)?.finalStatus !== "needs-review") {
      issues.push(`Coordinate approval does not resolve a needs-review result: ${approval.dealerId}`);
    }
    if (approval.coordinates.latitude < -90 || approval.coordinates.latitude > 90) {
      issues.push(`Approved latitude out of range: ${approval.dealerId}`);
    }
    if (approval.coordinates.longitude < -180 || approval.coordinates.longitude > 180) {
      issues.push(`Approved longitude out of range: ${approval.dealerId}`);
    }
    if (!approval.sourceUrls.length) issues.push(`Approved coordinate has no source: ${approval.dealerId}`);
    if (!approval.reason.trim()) issues.push(`Approved coordinate has no resolution reason: ${approval.dealerId}`);
  }

  return issues;
}
