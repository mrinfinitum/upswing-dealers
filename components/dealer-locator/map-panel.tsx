"use client";

import { useCallback, useState } from "react";
import { fallbackMapProvider } from "@/lib/maps/provider";
import type { MapConfiguration } from "@/lib/maps/provider";
import type { Dealer, DealerCoordinates } from "@/types/dealer";
import { GoogleMap } from "./google-map";

type MapPanelProps = {
  config: MapConfiguration;
  dealers: Dealer[];
  selectedDealer?: Dealer;
  origin?: DealerCoordinates;
  originIsUserLocation: boolean;
  useUnitedStatesOverview: boolean;
  awaitingSearch: boolean;
  locationLoading: boolean;
  onStartSearch: () => void;
  onUseMyLocation: () => void;
  onSelectDealer: (dealerId: string) => void;
};

export function MapPanel({ config, dealers, selectedDealer, origin, originIsUserLocation, useUnitedStatesOverview, awaitingSearch, locationLoading, onStartSearch, onUseMyLocation, onSelectDealer }: MapPanelProps) {
  const [mapFailed, setMapFailed] = useState(false);
  const handleFailure = useCallback(() => setMapFailed(true), []);
  const useGoogleMap = config.provider === "google" && !mapFailed;

  return (
    <section className="map-panel" aria-labelledby="map-heading">
      <div className="map-panel__topline">
        <p id="map-heading">Dealer map</p>
        <span><i className={useGoogleMap ? "is-live" : ""} aria-hidden="true" />{useGoogleMap ? "Google Maps" : fallbackMapProvider.label}</span>
      </div>
      <div className={`map-panel__canvas${awaitingSearch ? " is-awaiting-search" : ""}`}>
        {useGoogleMap && (
          <GoogleMap config={config} dealers={dealers} selectedDealerId={selectedDealer?.id} origin={origin} originLabel={originIsUserLocation ? "Your location" : "Search location"} useUnitedStatesOverview={useUnitedStatesOverview} onSelectDealer={onSelectDealer} onFailure={handleFailure} />
        )}
        {!useGoogleMap && (
          <>
            <div className="map-panel__grid" aria-hidden="true" />
            {!awaitingSearch && <div className="map-panel__message">
              <p className="eyebrow">Map-ready experience</p>
              <h2>{selectedDealer ? selectedDealer.city : `${dealers.length} locations`}</h2>
              <p>{selectedDealer
                ? `${selectedDealer.name}${selectedDealer.stateProvince ? ` · ${selectedDealer.stateProvince}` : ` · ${selectedDealer.country}`}`
                : "Browse every current UpSwing retail partner from the list."}</p>
              <span>{origin
                ? `${originIsUserLocation ? "Your" : "The search"} location is available`
                : mapFailed
                  ? "The map could not load. Search and dealer actions remain available in the location list."
                  : "Interactive mapping activates when restricted Google Maps credentials and verified coordinates are connected."}</span>
            </div>}
            {!awaitingSearch && <div className="map-panel__legend" aria-hidden="true"><span /><b>UpSwing dealer</b></div>}
          </>
        )}
        {awaitingSearch && (
          <div className="map-panel__search-prompt" role="region" aria-label="Start a dealer search">
            <span className="map-panel__search-icon" aria-hidden="true">◎</span>
            <p className="eyebrow">Find your closest dealer</p>
            <h2>Start with your location.</h2>
            <p>Enter a ZIP code or a city and state to find authorized UpSwing dealers near you.</p>
            <div className="map-panel__search-examples" aria-hidden="true">
              <span>ZIP code</span>
              <span>City, State</span>
            </div>
            <div className="map-panel__search-actions">
              <button type="button" onClick={onStartSearch}>Enter a location <span aria-hidden="true">→</span></button>
              <button type="button" onClick={onUseMyLocation} disabled={locationLoading}>
                <span aria-hidden="true">◎</span>{locationLoading ? "Locating…" : "Use my location"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
