"use client";

import { useCallback, useId, useMemo, useState, useTransition } from "react";
import { getStateCodeForQuery, queryLooksPostal, queryMatchesCountry, queryMatchesDealerName, searchDealers, searchDealersByExactState, sortDealersAlphabetically } from "@/lib/dealers/search";
import { dealersWithinRadius, sortDealersByDistance } from "@/lib/geo/distance";
import { geocodeWithGoogle } from "@/lib/maps/google-loader";
import type { MapConfiguration } from "@/lib/maps/provider";
import type { Dealer, DealerCoordinates, DealerWithDistance } from "@/types/dealer";
import { MapPanel } from "./map-panel";
import { ResultsList } from "./results-list";

type RadiusMiles = 25 | 50 | 100;

export function DealerLocator({ dealers, mapConfig }: { dealers: Dealer[]; mapConfig: MapConfiguration }) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [activeState, setActiveState] = useState("");
  const [selectedDealerId, setSelectedDealerId] = useState<string>();
  const [userLocation, setUserLocation] = useState<DealerCoordinates>();
  const [searchOrigin, setSearchOrigin] = useState<DealerCoordinates>();
  const [radiusMiles, setRadiusMiles] = useState<RadiusMiles>(50);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasCoordinateDealers = dealers.some((dealer) => dealer.coordinates);
  const availableStates = useMemo(() => [...new Set(dealers
    .filter((dealer) => dealer.country === "United States" && dealer.stateProvince)
    .map((dealer) => dealer.stateProvince!))].sort(), [dealers]);
  const origin = userLocation ?? searchOrigin;
  const hasSearchContext = Boolean(activeQuery || activeState || origin);
  const filteredDealers = useMemo(
    () => activeState ? searchDealersByExactState(dealers, activeState) : searchDealers(dealers, activeQuery),
    [activeQuery, activeState, dealers],
  );
  const results = useMemo<DealerWithDistance[]>(() => {
    if (!hasSearchContext) return [];
    if (origin && hasCoordinateDealers) return dealersWithinRadius(dealers, origin, radiusMiles);
    return sortDealersAlphabetically(sortDealersByDistance(filteredDealers, origin));
  }, [dealers, filteredDealers, hasCoordinateDealers, hasSearchContext, origin, radiusMiles]);
  const selectedDealer = results.find((dealer) => dealer.id === selectedDealerId) ?? results[0];

  async function runSearch(value: string, geocode = true) {
    const nextQuery = value.trim();
    const exactState = getStateCodeForQuery(nextQuery);
    setQuery(nextQuery);
    startTransition(() => {
      setActiveQuery(nextQuery);
      setActiveState(exactState ?? "");
      setSelectedDealerId(undefined);
      setShowAll(false);
    });
    setUserLocation(undefined);
    setSearchOrigin(undefined);
    setLocationStatus("idle");
    setLocationMessage("");
    if (!nextQuery || exactState || !geocode || mapConfig.provider !== "google" || queryMatchesDealerName(dealers, nextQuery) || queryMatchesCountry(dealers, nextQuery)) return;

    setLocationStatus("loading");
    setLocationMessage("Locating your search…");
    try {
      const match = await geocodeWithGoogle(nextQuery, mapConfig);
      if (!match) throw new Error("No geocoding result");
      const lexicalMatches = searchDealers(dealers, nextQuery);
      if (lexicalMatches.some((dealer) => !dealer.coordinates)) {
        setLocationStatus("success");
        setLocationMessage(`Located ${match.formattedAddress}. Showing exact text matches because one or more matching dealer coordinates are still under review.`);
        return;
      }
      setSearchOrigin(match.coordinates);
      setLocationStatus("success");
      setLocationMessage(hasCoordinateDealers
        ? `Showing verified dealers near ${match.formattedAddress}.`
        : `Located ${match.formattedAddress}. Dealer coordinates are still awaiting verification, so text matches remain available.`);
    } catch {
      setLocationStatus("error");
      setLocationMessage("Map search is temporarily unavailable. Showing retailer, city, state, and country text matches instead.");
    }
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  function resetSearch() {
    setQuery("");
    setStateQuery("");
    setActiveQuery("");
    setActiveState("");
    setSelectedDealerId(undefined);
    setLocationStatus("idle");
    setLocationMessage("");
    setUserLocation(undefined);
    setSearchOrigin(undefined);
    setRadiusMiles(50);
    setShowAll(false);
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      setLocationMessage("Location services are not supported by this browser. Search by city or state instead.");
      return;
    }
    setLocationStatus("loading");
    setLocationMessage("Finding your location…");
    setQuery("");
    setStateQuery("");
    setActiveQuery("");
    setActiveState("");
    setSelectedDealerId(undefined);
    setUserLocation(undefined);
    setSearchOrigin(undefined);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setSearchOrigin(undefined);
        setLocationStatus("success");
        setLocationMessage(hasCoordinateDealers
          ? "Results are sorted nearest first."
          : "Location received. Verified dealer coordinates are still needed for distance sorting; search by city or state for now.");
      },
      () => {
        setLocationStatus("error");
        setLocationMessage("We couldn’t access your location. You can still search by city or state.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  const selectDealer = useCallback((dealerId: string) => {
    setSelectedDealerId(dealerId);
    requestAnimationFrame(() => document.getElementById(`dealer-${dealerId}`)?.scrollIntoView({ block: "nearest" }));
  }, []);

  return (
    <section id="locator" className={`locator-shell${hasSearchContext ? "" : " is-awaiting-search"}`} aria-labelledby="locator-heading">
      {hasSearchContext && <div className="locator-panel">
        <div className="locator-panel__intro">
          <p className="eyebrow">Find your fit. Find your dealer.</p>
          <h1 id="locator-heading">Find an UpSwing Dealer</h1>
          <p>Search current retail partners by address, postal code, city, state, province, country, or dealer name.</p>
        </div>
        {hasSearchContext && <form className="locator-search" role="search" onSubmit={submitSearch}>
          <label htmlFor={searchId}>ZIP code or City, State</label>
          <div className="locator-search__row">
            <input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. 74133 or Tulsa, OK" autoComplete="postal-code" />
            <button type="submit" disabled={isPending || locationStatus === "loading"}>{isPending || locationStatus === "loading" ? "Searching" : "Search"}</button>
          </div>
          <div className="locator-search__utilities">
            <button type="button" onClick={requestLocation} disabled={locationStatus === "loading"}>
              <span aria-hidden="true">◎</span>{locationStatus === "loading" ? "Locating…" : "Use my location"}
            </button>
            {(activeQuery || origin) && <button type="button" onClick={resetSearch}>Clear search</button>}
          </div>
          {locationMessage && <p className={`locator-search__status is-${locationStatus}`} role="status">{locationMessage}</p>}
          {origin && hasCoordinateDealers && (
            <fieldset className="locator-radius">
              <legend>Search radius</legend>
              {[25, 50, 100].map((miles) => (
                <label key={miles}>
                  <input type="radio" name="radius" value={miles} checked={radiusMiles === miles} onChange={() => setRadiusMiles(miles as RadiusMiles)} />
                  <span>{miles} mi</span>
                </label>
              ))}
            </fieldset>
          )}
        </form>}
        {hasSearchContext ? (
          <>
            <p className="locator-results-status" aria-live="polite">
              {results.length} {results.length === 1 ? "location" : "locations"}{origin && hasCoordinateDealers ? ` within ${radiusMiles} miles` : ` for “${activeQuery}”`}
            </p>
            <ResultsList dealers={results} selectedDealerId={selectedDealer?.id} query={activeQuery} postalQuery={queryLooksPostal(activeQuery)} showAll={showAll} onSelectDealer={selectDealer} />
          </>
        ) : (
          <div className="locator-awaiting-results" role="status">
            <span aria-hidden="true">◎</span>
            <div>
              <strong>Your nearest dealer is a search away.</strong>
              <p>Enter a ZIP code or city and state to see matching locations.</p>
            </div>
          </div>
        )}
        {hasSearchContext && results.length > 12 && (
          <button className="locator-show-all" type="button" onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Show fewer locations" : `Show all ${results.length} locations`}
          </button>
        )}
      </div>}
      <MapPanel
        config={mapConfig}
        dealers={results}
        selectedDealer={selectedDealer}
        origin={origin}
        originIsUserLocation={Boolean(userLocation)}
        useUnitedStatesOverview={!hasSearchContext}
        awaitingSearch={!hasSearchContext}
        searchValue={query}
        selectedState={stateQuery}
        availableStates={availableStates}
        locationLoading={locationStatus === "loading"}
        locationStatus={locationStatus}
        locationMessage={locationMessage}
        onSearchValueChange={setQuery}
        onSelectedStateChange={setStateQuery}
        onSubmitInitialSearch={(value, stateOnly) => void runSearch(value, !stateOnly)}
        onUseMyLocation={requestLocation}
        onSelectDealer={selectDealer}
      />
    </section>
  );
}
