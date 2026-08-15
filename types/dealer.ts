export type DealerCoordinates = {
  latitude: number;
  longitude: number;
};

export type DealerSource = {
  workbook: string;
  sheet: string;
  row: number;
  rawCity: string;
  rawRegion?: string;
};

export type Dealer = {
  id: string;
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  coordinates?: DealerCoordinates;
  phone?: string;
  website?: string;
  email?: string;
  dealerType?: string;
  active?: boolean;
  notes?: string;
  source: DealerSource;
};

export type DealerWithDistance = Dealer & {
  distanceMiles?: number;
};
