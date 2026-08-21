"use client";

import { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { loadGoogleMaps } from "@/lib/maps/google-loader";
import { getMappableDealers } from "@/lib/maps/markers";
import type { GoogleMapConfiguration } from "@/lib/maps/provider";
import type { Dealer, DealerCoordinates } from "@/types/dealer";

type GoogleMapProps = {
  config: GoogleMapConfiguration;
  dealers: Dealer[];
  focusDealers: Dealer[];
  selectedDealerId?: string;
  origin?: DealerCoordinates;
  originLabel: string;
  useUnitedStatesOverview: boolean;
  onSelectDealer: (dealerId: string) => void;
  onFailure: () => void;
};

const UNITED_STATES_CENTER = { lat: 39.5, lng: -98.35 };
const UNITED_STATES_ZOOM = 4;
const DEALER_LOGOS: Record<string, { src: string; inverted?: boolean }> = {
  "Club Champion": { src: "https://clubchampion.com/images/2022_mindk/cc-logo-header.svg", inverted: true },
  "PGA TOUR Superstore": { src: "https://www.pgatoursuperstore.com/on/demandware.static/Sites-pgatss-sfra-Site/-/default/dwb27c47bd/images/logo.svg" },
};

function createDealerMarkerIcon(selected: boolean, isSearchResult: boolean) {
  const icon = document.createElement("div");
  icon.className = `map-dealer-marker${selected ? " is-selected" : ""}${isSearchResult ? "" : " is-outside-search"}`;

  const artwork = document.createElement("img");
  artwork.src = "/brand/dealer-map-marker.svg";
  artwork.alt = "";
  artwork.setAttribute("aria-hidden", "true");
  icon.append(artwork);

  return icon;
}

function getDirectionsUrl(dealer: Dealer) {
  const destination = [dealer.name, dealer.addressLine1, dealer.addressLine2, dealer.city, dealer.stateProvince, dealer.postalCode, dealer.country]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function createDealerInfoCard(dealer: Dealer) {
  const card = document.createElement("article");
  card.className = "map-dealer-card";

  const eyebrow = document.createElement("p");
  eyebrow.className = "map-dealer-card__eyebrow";
  eyebrow.textContent = "Authorized UpSwing dealer";
  card.append(eyebrow);

  const heading = document.createElement("h3");
  const dealerLogo = DEALER_LOGOS[dealer.name];
  if (dealerLogo) {
    heading.className = "has-logo";
    const logo = document.createElement("img");
    logo.className = `map-dealer-card__retailer-logo${dealerLogo.inverted ? " is-inverted" : ""}`;
    logo.src = dealerLogo.src;
    logo.alt = dealer.name;
    logo.referrerPolicy = "no-referrer";
    heading.append(logo);
  } else {
    heading.textContent = dealer.name;
  }
  card.append(heading);

  const municipality = [dealer.city, dealer.stateProvince].filter(Boolean).join(", ");
  const localityLine = [municipality, dealer.postalCode].filter(Boolean).join(" ");
  const addressParts = [
    dealer.addressLine1,
    dealer.addressLine2,
    localityLine,
    dealer.country !== "United States" ? dealer.country : undefined,
  ].filter((part): part is string => Boolean(part));
  if (addressParts.length > 0) {
    const address = document.createElement("address");
    for (const part of addressParts) {
      const line = document.createElement("span");
      line.textContent = part;
      address.append(line);
    }
    card.append(address);
  }

  if (dealer.phone) {
    const phone = document.createElement("a");
    phone.className = "map-dealer-card__phone";
    phone.href = `tel:${dealer.phone}`;
    phone.textContent = dealer.phone;
    card.append(phone);
  }

  const actions = document.createElement("div");
  actions.className = "map-dealer-card__actions";
  if (dealer.phone) {
    const call = document.createElement("a");
    call.href = `tel:${dealer.phone}`;
    call.textContent = "Call";
    actions.append(call);
  }
  if (dealer.website) {
    const website = document.createElement("a");
    website.href = dealer.website;
    website.target = "_blank";
    website.rel = "noreferrer";
    website.textContent = "Website";
    actions.append(website);
  }
  const directions = document.createElement("a");
  directions.href = getDirectionsUrl(dealer);
  directions.target = "_blank";
  directions.rel = "noreferrer";
  directions.textContent = "Directions ↗";
  actions.append(directions);
  card.append(actions);

  return card;
}

export function GoogleMap({ config, dealers, focusDealers, selectedDealerId, origin, originLabel, useUnitedStatesOverview, onSelectDealer, onFailure }: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | undefined>(undefined);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<MarkerClusterer | undefined>(undefined);
  const previousSelectedDealerId = useRef<string | undefined>(undefined);
  const cameraScopeRef = useRef("");
  const [libraries, setLibraries] = useState<[google.maps.MapsLibrary, google.maps.MarkerLibrary]>();
  const [openDealerId, setOpenDealerId] = useState<string>();

  useEffect(() => {
    let active = true;
    const mapWindow = window as Window & { gm_authFailure?: () => void };
    const previousAuthFailure = mapWindow.gm_authFailure;
    mapWindow.gm_authFailure = onFailure;
    loadGoogleMaps(config)
      .then(([maps, marker]) => {
        if (!active || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          mapId: config.mapId,
          center: UNITED_STATES_CENTER,
          zoom: UNITED_STATES_ZOOM,
          clickableIcons: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
        });
        setLibraries([maps, marker]);
      })
      .catch(onFailure);
    return () => {
      active = false;
      mapWindow.gm_authFailure = previousAuthFailure;
    };
  }, [config, onFailure]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !libraries) return;
    const [mapsLibrary, markerLibrary] = libraries;
    clustererRef.current?.clearMarkers();
    markersRef.current.forEach((marker) => { marker.map = null; });
    const dealerMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
    const dealerMarkersById = new Map<string, google.maps.marker.AdvancedMarkerElement>();
    const auxiliaryMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new mapsLibrary.InfoWindow();
    const mappableDealers = getMappableDealers(dealers);
    const focusedMappableDealers = getMappableDealers(focusDealers);
    const focusedDealerIds = new Set(focusedMappableDealers.map((dealer) => dealer.id));
    const cameraScope = JSON.stringify({
      dealerPoints: focusedMappableDealers.map((dealer) => [dealer.id, dealer.coordinates?.latitude, dealer.coordinates?.longitude]),
      origin,
      useUnitedStatesOverview,
    });
    const shouldFrameResults = cameraScopeRef.current !== cameraScope;
    cameraScopeRef.current = cameraScope;
    const updateMarkerScale = () => {
      containerRef.current?.classList.toggle("is-zoomed-out", (map.getZoom() ?? UNITED_STATES_ZOOM) <= 5);
    };
    const zoomListener = map.addListener("zoom_changed", updateMarkerScale);
    updateMarkerScale();

    for (const dealer of mappableDealers) {
      const coordinates = dealer.coordinates!;
      const selected = dealer.id === selectedDealerId;
      const position = { lat: coordinates.latitude, lng: coordinates.longitude };
      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position,
        title: `${dealer.name}, ${dealer.city}`,
        content: createDealerMarkerIcon(selected, focusedDealerIds.has(dealer.id)),
        gmpClickable: true,
      });
      marker.addEventListener("gmp-click", (event) => {
        event.stopPropagation();
        setOpenDealerId(dealer.id);
        onSelectDealer(dealer.id);
      });
      dealerMarkers.push(marker);
      dealerMarkersById.set(dealer.id, marker);
      if (focusedDealerIds.has(dealer.id)) bounds.extend(position);
    }

    const openDealer = dealers.find((dealer) => dealer.id === openDealerId);
    const openMarker = openDealerId ? dealerMarkersById.get(openDealerId) : undefined;
    if (openDealer && openMarker) {
      infoWindow.setContent(createDealerInfoCard(openDealer));
      infoWindow.open({ map, anchor: openMarker, shouldFocus: false });
    }
    const closeListener = infoWindow.addListener("closeclick", () => setOpenDealerId(undefined));

    if (origin) {
      const position = { lat: origin.latitude, lng: origin.longitude };
      const pin = new markerLibrary.PinElement({ background: "#ffffff", borderColor: "#2878d1", glyphColor: "#2878d1", glyphText: "◎" });
      auxiliaryMarkers.push(new markerLibrary.AdvancedMarkerElement({ map, position, title: originLabel, content: pin }));
      bounds.extend(position);
    }

    const markers = [...dealerMarkers, ...auxiliaryMarkers];
    markersRef.current = markers;
    clustererRef.current = new MarkerClusterer({ map, markers: dealerMarkers });
    const cameraFrame = requestAnimationFrame(() => {
      google.maps.event.trigger(map, "resize");
      if (!shouldFrameResults) return;
      if (useUnitedStatesOverview) {
        map.moveCamera({ center: UNITED_STATES_CENTER, zoom: UNITED_STATES_ZOOM });
      } else if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 54);
        if (focusedMappableDealers.length === 1 && !origin) {
          google.maps.event.addListenerOnce(map, "idle", () => { if ((map.getZoom() ?? 0) > 13) map.setZoom(13); });
        }
      }
    });
    if (previousSelectedDealerId.current && previousSelectedDealerId.current !== selectedDealerId) {
      const selected = dealers.find((dealer) => dealer.id === selectedDealerId)?.coordinates;
      if (selected) map.panTo({ lat: selected.latitude, lng: selected.longitude });
    }
    previousSelectedDealerId.current = selectedDealerId;
    return () => {
      zoomListener.remove();
      closeListener.remove();
      infoWindow.close();
      cancelAnimationFrame(cameraFrame);
      clustererRef.current?.clearMarkers();
      markers.forEach((marker) => { marker.map = null; });
    };
  }, [dealers, focusDealers, libraries, onSelectDealer, openDealerId, origin, originLabel, selectedDealerId, useUnitedStatesOverview]);

  return (
    <div
      ref={containerRef}
      className="map-panel__google-map"
      aria-label="Map showing the visible dealer results"
      data-dealer-marker-count={getMappableDealers(dealers).length}
      data-focused-dealer-marker-count={getMappableDealers(focusDealers).length}
      data-selected-dealer-id={selectedDealerId}
    />
  );
}
