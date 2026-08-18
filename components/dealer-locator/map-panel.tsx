"use client";

import { useCallback, useId, useState, type FormEvent } from "react";
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
  searchValue: string;
  availableStates: string[];
  locationLoading: boolean;
  locationStatus: "idle" | "loading" | "success" | "error";
  locationMessage: string;
  onSearchValueChange: (value: string) => void;
  onSubmitSearch: (event: FormEvent<HTMLFormElement>) => void;
  onSelectState: (state: string) => void;
  onUseMyLocation: () => void;
  onSelectDealer: (dealerId: string) => void;
};

export function MapPanel({ config, dealers, selectedDealer, origin, originIsUserLocation, useUnitedStatesOverview, awaitingSearch, searchValue, availableStates, locationLoading, locationStatus, locationMessage, onSearchValueChange, onSubmitSearch, onSelectState, onUseMyLocation, onSelectDealer }: MapPanelProps) {
  const promptSearchId = useId();
  const promptStateId = useId();
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
            <div className="map-panel__search-content">
              <span className="map-panel__search-icon" aria-hidden="true">◎</span>
              <p className="eyebrow">Find your closest dealer</p>
              <h2>Start with your location.</h2>
              <p>Choose a state or enter a ZIP code, city, or address. We’ll open the map with the closest authorized UpSwing dealers.</p>
              <form className="map-panel__search-form" role="search" onSubmit={onSubmitSearch}>
                <div className="map-panel__search-fields">
                  <label htmlFor={promptStateId}>
                    <span>Browse by state</span>
                    <select id={promptStateId} defaultValue="" onChange={(event) => event.target.value && onSelectState(event.target.value)}>
                      <option value="" disabled>Choose a state</option>
                      {availableStates.map((state) => <option key={state} value={state}>{state}</option>)}
                    </select>
                  </label>
                  <b aria-hidden="true">or</b>
                  <label htmlFor={promptSearchId}>
                    <span>Search by location</span>
                    <div className="map-panel__search-input">
                      <input id={promptSearchId} type="search" value={searchValue} onChange={(event) => onSearchValueChange(event.target.value)} placeholder="ZIP code or City, State" autoComplete="postal-code" />
                      <button type="submit" disabled={locationLoading}>Search <i aria-hidden="true">→</i></button>
                    </div>
                  </label>
                </div>
              </form>
              <div className="map-panel__location-option">
                <span>Or find the closest dealer automatically.</span>
                <button type="button" onClick={onUseMyLocation} disabled={locationLoading}>
                  <i aria-hidden="true">◎</i>{locationLoading ? "Locating…" : "Use my location"}
                </button>
              </div>
              {locationMessage && <p className={`map-panel__search-status is-${locationStatus}`} role="status">{locationMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
