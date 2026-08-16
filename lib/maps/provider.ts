import type { Dealer, DealerCoordinates } from "@/types/dealer";

export type MapProviderId = "mapbox" | "google" | "fallback";
export type GoogleMapConfiguration = {
  provider: "google";
  apiKey: string;
  mapId: string;
};
export type FallbackMapConfiguration = { provider: "fallback" };
export type MapConfiguration = GoogleMapConfiguration | FallbackMapConfiguration;
export type MapProviderProps = {
  dealers: Dealer[];
  selectedDealer?: Dealer;
  userLocation?: DealerCoordinates;
  onSelectDealer?: (dealerId: string) => void;
};
export interface MapProviderAdapter {
  id: MapProviderId;
  isConfigured: boolean;
  label: string;
}
export const fallbackMapProvider: MapProviderAdapter = {
  id: "fallback",
  isConfigured: false,
  label: "Location list mode",
};

export function getMapConfiguration(): MapConfiguration {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  return apiKey && mapId ? { provider: "google", apiKey, mapId } : { provider: "fallback" };
}
