import type { Dealer, DealerCoordinates } from "@/types/dealer";

export type GeocodeAddressComponent = {
  longName: string;
  shortName: string;
  types: string[];
};

export type GeocodeCandidate = {
  coordinates: DealerCoordinates;
  formattedAddress: string;
  resultTypes: string[];
  locationType: string;
  addressComponents: GeocodeAddressComponent[];
  partialMatch?: boolean;
};

export type CoordinateReview = {
  status: "verified" | "needs-review";
  discrepancies: string[];
};

const clean = (value: string | undefined) => value?.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim() ?? "";

function component(candidate: GeocodeCandidate, type: string) {
  return candidate.addressComponents.find((item) => item.types.includes(type));
}

function components(candidate: GeocodeCandidate, types: string[]) {
  return candidate.addressComponents.filter((item) => item.types.some((type) => types.includes(type)));
}

export function reviewGeocodeCandidate(dealer: Dealer, candidate: GeocodeCandidate): CoordinateReview {
  const discrepancies: string[] = [];
  const localities = components(candidate, ["locality", "postal_town", "administrative_area_level_3", "sublocality_level_1"]);
  const regions = components(candidate, ["administrative_area_level_1", "administrative_area_level_2"]);
  const postal = component(candidate, "postal_code");
  const country = component(candidate, "country");

  if (!localities.some((locality) => [locality.shortName, locality.longName].some((value) => clean(value) === clean(dealer.city)))) {
    discrepancies.push(`City mismatch: expected ${dealer.city}; geocoder returned ${localities.map((item) => item.longName).join(" / ") || "none"}.`);
  }
  if (dealer.stateProvince && !regions.some((region) => [region.shortName, region.longName].some((value) => clean(value) === clean(dealer.stateProvince)))) {
    discrepancies.push(`Region mismatch: expected ${dealer.stateProvince}; geocoder returned ${regions.map((item) => item.shortName).join(" / ") || "none"}.`);
  }
  const expectedPostal = clean(dealer.postalCode);
  const returnedPostal = clean(postal?.longName);
  if (dealer.postalCode && (!postal || (!expectedPostal.startsWith(returnedPostal) && !returnedPostal.startsWith(expectedPostal)))) {
    discrepancies.push(`Postal mismatch: expected ${dealer.postalCode}; geocoder returned ${postal?.longName ?? "none"}.`);
  }
  if (!country || clean(country.longName) !== clean(dealer.country)) {
    discrepancies.push(`Country mismatch: expected ${dealer.country}; geocoder returned ${country?.longName ?? "none"}.`);
  }
  if (!["ROOFTOP", "RANGE_INTERPOLATED"].includes(candidate.locationType)) {
    discrepancies.push(`Low coordinate precision: ${candidate.locationType || "unknown"}.`);
  }
  if (!candidate.resultTypes.some((type) => ["street_address", "premise", "subpremise"].includes(type))) {
    discrepancies.push(`Ambiguous result type: ${candidate.resultTypes.join(", ") || "none"}.`);
  }
  if (candidate.partialMatch) {
    discrepancies.push("Google returned a partial address match.");
  }

  return { status: discrepancies.length ? "needs-review" : "verified", discrepancies };
}
