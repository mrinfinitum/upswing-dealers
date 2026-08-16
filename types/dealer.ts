export type DealerCoordinates = {
  latitude: number;
  longitude: number;
};

export type DealerCoordinateEvidence = {
  source: "official-retailer" | "google-maps-js-geocoder" | "manual-coordinate-review";
  retrievedAt: string;
  formattedAddress?: string;
  resultTypes?: string[];
  locationType?: string;
  verificationStatus: "verified" | "needs-review" | "failed";
  discrepancies: string[];
  resolution?: string;
  sourceUrls?: string[];
};

export type DealerSource = {
  workbook: string;
  sheet: string;
  row: number;
  rawCity: string;
  rawRegion?: string;
};

export type DealerVerificationStatus = "unverified" | "needs-review" | "verified" | "rejected";

export type DealerEnrichmentSource = {
  type: "official-retailer" | "google-geocoding" | "google-places" | "manual";
  label: string;
  url: string;
  retrievedAt: string;
  fields: Array<keyof DealerEnrichmentFields>;
};

export type DealerEnrichmentFields = {
  canonicalLocationName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
};

export type DealerEnrichmentProposal = {
  dealerId: string;
  proposed: DealerEnrichmentFields;
  verificationStatus: DealerVerificationStatus;
  confidence: "low" | "medium" | "high";
  sources: DealerEnrichmentSource[];
  discrepancies: string[];
  notes?: string;
};

export type Dealer = {
  id: string;
  name: string;
  locationName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  coordinates?: DealerCoordinates;
  coordinateEvidence?: DealerCoordinateEvidence;
  phone?: string;
  website?: string;
  email?: string;
  dealerType?: string;
  active?: boolean;
  notes?: string;
  verificationStatus?: DealerVerificationStatus;
  enrichmentSources?: DealerEnrichmentSource[];
  source: DealerSource;
};

export type DealerWithDistance = Dealer & {
  distanceMiles?: number;
};
