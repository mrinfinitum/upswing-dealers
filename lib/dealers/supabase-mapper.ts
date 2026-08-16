import type { Dealer, DealerVerificationStatus } from "@/types/dealer";

export type DealerRow = {
  id: string;
  name: string;
  location_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  dealer_type: string | null;
  active: boolean;
  notes: string | null;
  verification_status: DealerVerificationStatus;
  source_workbook: string;
  source_sheet: string;
  source_row: number;
  source_raw_city: string;
  source_raw_region: string | null;
  enrichment_sources: Dealer["enrichmentSources"] | null;
  coordinate_evidence: Dealer["coordinateEvidence"] | null;
  created_at: string;
  updated_at: string;
};

export type PublicDealerRow = Pick<DealerRow,
  | "id" | "name" | "location_name" | "address_line_1" | "address_line_2"
  | "city" | "state_province" | "postal_code" | "country" | "latitude"
  | "longitude" | "phone" | "website" | "email" | "dealer_type" | "active"
  | "verification_status"
>;

const optional = (value: string | null) => value ?? undefined;

export function dealerRowToDealer(row: DealerRow): Dealer {
  return {
    id: row.id,
    name: row.name,
    locationName: optional(row.location_name),
    addressLine1: optional(row.address_line_1),
    addressLine2: optional(row.address_line_2),
    city: row.city,
    stateProvince: optional(row.state_province),
    postalCode: optional(row.postal_code),
    country: row.country,
    coordinates:
      row.latitude !== null && row.longitude !== null
        ? { latitude: row.latitude, longitude: row.longitude }
        : undefined,
    coordinateEvidence: row.coordinate_evidence ?? undefined,
    phone: optional(row.phone),
    website: optional(row.website),
    email: optional(row.email),
    dealerType: optional(row.dealer_type),
    active: row.active,
    notes: optional(row.notes),
    verificationStatus: row.verification_status,
    enrichmentSources: row.enrichment_sources ?? undefined,
    source: {
      workbook: row.source_workbook,
      sheet: row.source_sheet,
      row: row.source_row,
      rawCity: row.source_raw_city,
      rawRegion: optional(row.source_raw_region),
    },
  };
}

export function publicDealerRowToDealer(row: PublicDealerRow): Dealer {
  return {
    id: row.id,
    name: row.name,
    locationName: optional(row.location_name),
    addressLine1: optional(row.address_line_1),
    addressLine2: optional(row.address_line_2),
    city: row.city,
    stateProvince: optional(row.state_province),
    postalCode: optional(row.postal_code),
    country: row.country,
    coordinates: row.latitude !== null && row.longitude !== null
      ? { latitude: row.latitude, longitude: row.longitude }
      : undefined,
    phone: optional(row.phone),
    website: optional(row.website),
    email: optional(row.email),
    dealerType: optional(row.dealer_type),
    active: row.active,
    verificationStatus: row.verification_status,
    source: { workbook: "Managed dealer database", sheet: "Public", row: 0, rawCity: row.city },
  };
}

export function dealerToMutation(dealer: Omit<Dealer, "source"> & { source?: Dealer["source"] }) {
  return {
    id: dealer.id,
    name: dealer.name,
    location_name: dealer.locationName ?? null,
    address_line_1: dealer.addressLine1 ?? null,
    address_line_2: dealer.addressLine2 ?? null,
    city: dealer.city,
    state_province: dealer.stateProvince ?? null,
    postal_code: dealer.postalCode ?? null,
    country: dealer.country,
    latitude: dealer.coordinates?.latitude ?? null,
    longitude: dealer.coordinates?.longitude ?? null,
    phone: dealer.phone ?? null,
    website: dealer.website ?? null,
    email: dealer.email ?? null,
    dealer_type: dealer.dealerType ?? null,
    active: dealer.active ?? true,
    notes: dealer.notes ?? null,
    verification_status: dealer.verificationStatus ?? "unverified",
    source_workbook: dealer.source?.workbook ?? "Admin",
    source_sheet: dealer.source?.sheet ?? "Admin",
    source_row: dealer.source?.row ?? 0,
    source_raw_city: dealer.source?.rawCity ?? dealer.city,
    source_raw_region: dealer.source?.rawRegion ?? dealer.stateProvince ?? null,
    enrichment_sources: dealer.enrichmentSources ?? [],
    coordinate_evidence: dealer.coordinateEvidence ?? null,
  };
}
