"use client";

import { useId, useState, useTransition } from "react";
import { queryLooksPostal, searchDealers } from "@/lib/dealers/search";
import { sortDealersByDistance } from "@/lib/geo/distance";
import type { Dealer, DealerCoordinates } from "@/types/dealer";
import { MapPanel } from "./map-panel";
import { ResultsList } from "./results-list";

export function DealerLocator({ dealers }: { dealers: Dealer[] }) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedDealerId, setSelectedDealerId] = useState<string>();
  const [userLocation, setUserLocation] = useState<DealerCoordinates>();
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredDealers = searchDealers(dealers, activeQuery);
  const results = sortDealersByDistance(filteredDealers, userLocation);
  const selectedDealer = results.find((dealer) => dealer.id === selectedDealerId) ?? results[0];

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      setActiveQuery(query.trim());
      setSelectedDealerId(undefined);
      setShowAll(false);
    });
  }

  function resetSearch() {
    setQuery("");
    setActiveQuery("");
    setSelectedDealerId(undefined);
    setLocationStatus("idle");
    setLocationMessage("");
    setUserLocation(undefined);
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
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationStatus("success");
        setLocationMessage(dealers.some((dealer) => dealer.coordinates)
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

  return (
    <section id="locator" className="locator-shell" aria-labelledby="locator-heading">
      <div className="locator-panel">
        <div className="locator-panel__intro">
          <p className="eyebrow">Find your fit. Find your dealer.</p>
          <h2 id="locator-heading">Find an UpSwing Dealer</h2>
          <p>Search current retail partners by city, state, province, or dealer name.</p>
        </div>
        <form className="locator-search" role="search" onSubmit={submitSearch}>
          <label htmlFor={searchId}>Search by location</label>
          <div className="locator-search__row">
            <input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="City, state, or postal code" autoComplete="postal-code" />
            <button type="submit" disabled={isPending}>{isPending ? "Searching" : "Search"}</button>
          </div>
          <div className="locator-search__utilities">
            <button type="button" onClick={requestLocation} disabled={locationStatus === "loading"}>
              <span aria-hidden="true">◎</span>{locationStatus === "loading" ? "Locating…" : "Use my location"}
            </button>
            {(activeQuery || userLocation) && <button type="button" onClick={resetSearch}>Clear search</button>}
          </div>
          {locationMessage && <p className={`locator-search__status is-${locationStatus}`} role="status">{locationMessage}</p>}
        </form>
        <div className="locator-results-heading" aria-live="polite">
          <p>{results.length} {results.length === 1 ? "location" : "locations"}{activeQuery ? ` for “${activeQuery}”` : ""}</p>
          <span>{userLocation && results.some((dealer) => dealer.distanceMiles !== undefined) ? "Nearest first" : "Current partners"}</span>
        </div>
        <ResultsList dealers={results} selectedDealerId={selectedDealer?.id} query={activeQuery} postalQuery={queryLooksPostal(activeQuery)} showAll={showAll} onSelectDealer={setSelectedDealerId} />
        {results.length > 12 && (
          <button className="locator-show-all" type="button" onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Show fewer locations" : `Show all ${results.length} locations`}
          </button>
        )}
      </div>
      <MapPanel dealerCount={results.length} selectedDealer={selectedDealer} userLocation={userLocation} />
    </section>
  );
}
