import type { Dealer } from "@/types/dealer";
import { dealerAddressFingerprint } from "@/lib/geo/address";
import { reviewGeocodeCandidate, type GeocodeCandidate } from "@/lib/geo/geocode-review";

export type GeocodeFormError = { message: string; fieldErrors?: Record<string, string> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

// Shared by the admin and dealer location forms: the browser geocodes with Google and posts the
// candidates; the server accepts the address only when exactly one candidate is a precise match.
function parseGeocodeCandidates(formData: FormData): GeocodeCandidate[] {
  const raw = text(formData, "geocodeCandidates");
  if (!raw || raw.length > 100_000) return [];
  try {
    const candidates = JSON.parse(raw) as unknown;
    if (!Array.isArray(candidates) || candidates.length > 10) return [];
    return candidates.filter((candidate): candidate is GeocodeCandidate => {
      if (!candidate || typeof candidate !== "object") return false;
      const item = candidate as Partial<GeocodeCandidate>;
      return Boolean(
        item.coordinates
        && Number.isFinite(item.coordinates.latitude)
        && item.coordinates.latitude >= -90
        && item.coordinates.latitude <= 90
        && Number.isFinite(item.coordinates.longitude)
        && item.coordinates.longitude >= -180
        && item.coordinates.longitude <= 180
        && typeof item.formattedAddress === "string"
        && Array.isArray(item.resultTypes)
        && typeof item.locationType === "string"
        && Array.isArray(item.addressComponents),
      );
    });
  } catch {
    return [];
  }
}

export function applyAutomaticCoordinates(dealer: Dealer, formData: FormData, existing?: Dealer): GeocodeFormError | null {
  const addressChanged = !existing || dealerAddressFingerprint(dealer) !== dealerAddressFingerprint(existing);
  if (!addressChanged && existing?.coordinates) return null;

  const reviewed = parseGeocodeCandidates(formData).map((candidate) => ({
    candidate,
    review: reviewGeocodeCandidate(dealer, candidate),
  }));
  const verified = reviewed.filter(({ review }) => review.status === "verified");
  if (verified.length !== 1) {
    return {
      message: verified.length > 1
        ? "Google returned multiple precise matches. Add more address detail and try again."
        : "The address did not produce one unambiguous precise match. Review the address and postal code.",
      fieldErrors: { addressLine1: "A unique, precise Google address match is required." },
    };
  }

  const { candidate } = verified[0];
  dealer.coordinates = candidate.coordinates;
  dealer.coordinateEvidence = {
    source: "google-maps-js-geocoder",
    retrievedAt: new Date().toISOString(),
    formattedAddress: candidate.formattedAddress,
    resultTypes: candidate.resultTypes,
    locationType: candidate.locationType,
    verificationStatus: "verified",
    discrepancies: [],
  };
  return null;
}
