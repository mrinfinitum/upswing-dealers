import rawBatch from "@/reports/google-browser-geocodes.json";
import type { GeocodeAddressComponent } from "@/lib/geo/geocode-review";

export type GoogleBrowserGeocodeRecord = {
  dealerId: string;
  queriedAddress: string;
  responseStatus: string;
  formattedAddress?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  resultTypes?: string[];
  locationType?: string;
  partialMatch?: boolean;
  addressComponents?: GeocodeAddressComponent[];
};

export type GoogleBrowserGeocodeBatch = {
  generatedAt: string;
  provider: string;
  records: GoogleBrowserGeocodeRecord[];
};

export const googleBrowserGeocodeBatch = rawBatch as GoogleBrowserGeocodeBatch;
