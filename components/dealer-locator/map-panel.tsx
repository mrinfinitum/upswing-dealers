import { fallbackMapProvider } from "@/lib/maps/provider";
import type { Dealer, DealerCoordinates } from "@/types/dealer";

type MapPanelProps = {
  dealerCount: number;
  selectedDealer?: Dealer;
  userLocation?: DealerCoordinates;
};

export function MapPanel({ dealerCount, selectedDealer, userLocation }: MapPanelProps) {
  return (
    <section className="map-panel" aria-labelledby="map-heading">
      <div className="map-panel__topline">
        <p id="map-heading">Dealer map</p>
        <span><i aria-hidden="true" />{fallbackMapProvider.label}</span>
      </div>
      <div className="map-panel__canvas">
        <div className="map-panel__grid" aria-hidden="true" />
        <div className="map-panel__message">
          <p className="eyebrow">Map-ready experience</p>
          <h2>{selectedDealer ? selectedDealer.city : `${dealerCount} locations`}</h2>
          <p>{selectedDealer
            ? `${selectedDealer.name}${selectedDealer.stateProvince ? ` · ${selectedDealer.stateProvince}` : ` · ${selectedDealer.country}`}`
            : "Browse every current UpSwing retail partner from the list."}</p>
          <span>{userLocation ? "Your location is available" : "Interactive mapping activates when a provider and verified coordinates are connected."}</span>
        </div>
        <div className="map-panel__legend" aria-hidden="true"><span /><b>UpSwing dealer</b></div>
      </div>
    </section>
  );
}
