import type { Dealer, DealerCoordinates } from "@/types/dealer";

export type MapProviderId = "mapbox" | "google" | "fallback";
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
