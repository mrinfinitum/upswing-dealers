"use client";

import Image from "next/image";
import { useCallback, useId, useState } from "react";
import type { MapConfiguration } from "@/lib/maps/provider";
import type { Dealer, DealerCoordinates } from "@/types/dealer";
import { GoogleMap } from "./google-map";

type MapPanelProps = {
  config: MapConfiguration;
  dealers: Dealer[];
  focusDealers: Dealer[];
  selectedDealer?: Dealer;
  origin?: DealerCoordinates;
  originIsUserLocation: boolean;
  useUnitedStatesOverview: boolean;
  awaitingSearch: boolean;
  searchValue: string;
  selectedState: string;
  availableStates: string[];
  locationLoading: boolean;
  locationStatus: "idle" | "loading" | "success" | "error";
  locationMessage: string;
  onSearchValueChange: (value: string) => void;
  onSelectedStateChange: (value: string) => void;
  onSubmitInitialSearch: (value: string, stateOnly: boolean) => void;
  onUseMyLocation: () => void;
  onSelectDealer: (dealerId: string) => void;
};

export function MapPanel({ config, dealers, focusDealers, selectedDealer, origin, originIsUserLocation, useUnitedStatesOverview, awaitingSearch, searchValue, selectedState, availableStates, locationLoading, locationStatus, locationMessage, onSearchValueChange, onSelectedStateChange, onSubmitInitialSearch, onUseMyLocation, onSelectDealer }: MapPanelProps) {
  const promptSearchId = useId();
  const promptStateId = useId();
  const [mapFailed, setMapFailed] = useState(false);
  const handleFailure = useCallback(() => setMapFailed(true), []);
  const useGoogleMap = config.provider === "google" && !mapFailed;

  return (
    <section className={`map-panel${awaitingSearch ? " is-awaiting-search" : ""}`} aria-labelledby="map-heading">
      <div className="map-panel__topline">
        <p id="map-heading">Dealer map</p>
        <div className="map-panel__brand-mark">
          <Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={345} height={159} />
        </div>
      </div>
      <div className={`map-panel__canvas${awaitingSearch ? " is-awaiting-search" : ""}`}>
        {useGoogleMap && (
          <GoogleMap config={config} dealers={dealers} focusDealers={focusDealers} selectedDealerId={selectedDealer?.id} origin={origin} originLabel={originIsUserLocation ? "Your location" : "Search location"} useUnitedStatesOverview={useUnitedStatesOverview} onSelectDealer={onSelectDealer} onFailure={handleFailure} />
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
              <form className="map-panel__search-form" role="search" onSubmit={(event) => {
                event.preventDefault();
                const typedLocation = searchValue.trim();
                const value = typedLocation || selectedState;
                if (value) onSubmitInitialSearch(value, !typedLocation && Boolean(selectedState));
              }}>
                <div className="map-panel__search-fields">
                  <label htmlFor={promptStateId}>
                    <span>Browse by state</span>
                    <select id={promptStateId} value={selectedState} onChange={(event) => {
                      onSelectedStateChange(event.target.value);
                      onSearchValueChange("");
                    }}>
                      <option value="" disabled>Choose a state</option>
                      {availableStates.map((state) => <option key={state} value={state}>{state}</option>)}
                    </select>
                  </label>
                  <b aria-hidden="true">or</b>
                  <label htmlFor={promptSearchId}>
                    <span>Search by location</span>
                    <div className="map-panel__search-input">
                      <input id={promptSearchId} type="search" value={searchValue} onChange={(event) => {
                        onSelectedStateChange("");
                        onSearchValueChange(event.target.value);
                      }} placeholder="ZIP code or City, State" autoComplete="postal-code" />
                      <button type="submit" disabled={locationLoading || (!searchValue.trim() && !selectedState)}>Search <i aria-hidden="true">→</i></button>
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
