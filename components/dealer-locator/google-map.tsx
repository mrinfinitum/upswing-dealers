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
  selectedDealerId?: string;
  origin?: DealerCoordinates;
  originLabel: string;
  onSelectDealer: (dealerId: string) => void;
  onFailure: () => void;
};

export function GoogleMap({ config, dealers, selectedDealerId, origin, originLabel, onSelectDealer, onFailure }: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | undefined>(undefined);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<MarkerClusterer | undefined>(undefined);
  const previousSelectedDealerId = useRef<string | undefined>(undefined);
  const [libraries, setLibraries] = useState<[google.maps.MapsLibrary, google.maps.MarkerLibrary]>();

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
          center: { lat: 39.5, lng: -98.35 },
          zoom: 4,
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
    const [, markerLibrary] = libraries;
    clustererRef.current?.clearMarkers();
    markersRef.current.forEach((marker) => { marker.map = null; });
    const dealerMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
    const auxiliaryMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
    const bounds = new google.maps.LatLngBounds();

    for (const dealer of getMappableDealers(dealers)) {
      const coordinates = dealer.coordinates!;
      const selected = dealer.id === selectedDealerId;
      const pin = new markerLibrary.PinElement({
        background: selected ? "#2878d1" : "#111111",
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        scale: selected ? 1.2 : 1,
      });
      const position = { lat: coordinates.latitude, lng: coordinates.longitude };
      const marker = new markerLibrary.AdvancedMarkerElement({ map, position, title: `${dealer.name}, ${dealer.city}`, content: pin });
      marker.addEventListener("gmp-click", () => onSelectDealer(dealer.id));
      dealerMarkers.push(marker);
      bounds.extend(position);
    }

    if (origin) {
      const position = { lat: origin.latitude, lng: origin.longitude };
      const pin = new markerLibrary.PinElement({ background: "#ffffff", borderColor: "#2878d1", glyphColor: "#2878d1", glyphText: "◎" });
      auxiliaryMarkers.push(new markerLibrary.AdvancedMarkerElement({ map, position, title: originLabel, content: pin }));
      bounds.extend(position);
    }

    const markers = [...dealerMarkers, ...auxiliaryMarkers];
    markersRef.current = markers;
    clustererRef.current = new MarkerClusterer({ map, markers: dealerMarkers });
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 54);
      if (getMappableDealers(dealers).length === 1 && !origin) {
        google.maps.event.addListenerOnce(map, "idle", () => { if ((map.getZoom() ?? 0) > 13) map.setZoom(13); });
      }
    }
    if (previousSelectedDealerId.current && previousSelectedDealerId.current !== selectedDealerId) {
      const selected = dealers.find((dealer) => dealer.id === selectedDealerId)?.coordinates;
      if (selected) map.panTo({ lat: selected.latitude, lng: selected.longitude });
    }
    previousSelectedDealerId.current = selectedDealerId;
    return () => {
      clustererRef.current?.clearMarkers();
      markers.forEach((marker) => { marker.map = null; });
    };
  }, [dealers, libraries, onSelectDealer, origin, originLabel, selectedDealerId]);

  return (
    <div
      ref={containerRef}
      className="map-panel__google-map"
      aria-label="Map showing the visible dealer results"
      data-dealer-marker-count={getMappableDealers(dealers).length}
      data-selected-dealer-id={selectedDealerId}
    />
  );
}
