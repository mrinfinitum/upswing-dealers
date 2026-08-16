import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { GoogleMapConfiguration } from "./provider";

let configured = false;

function configure(config: GoogleMapConfiguration) {
  if (configured) return;
  setOptions({
    key: config.apiKey,
    v: "weekly",
    mapIds: [config.mapId],
    authReferrerPolicy: "origin",
  });
  configured = true;
}

export async function loadGoogleMaps(config: GoogleMapConfiguration) {
  configure(config);
  return Promise.all([
    importLibrary("maps") as Promise<google.maps.MapsLibrary>,
    importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
  ]);
}

export async function geocodeWithGoogle(query: string, config: GoogleMapConfiguration) {
  configure(config);
  const { Geocoder } = await importLibrary("geocoding") as google.maps.GeocodingLibrary;
  const response = await new Geocoder().geocode({ address: query });
  const result = response.results[0];
  if (!result) return undefined;
  return {
    coordinates: { latitude: result.geometry.location.lat(), longitude: result.geometry.location.lng() },
    formattedAddress: result.formatted_address,
    resultTypes: result.types,
    locationType: result.geometry.location_type,
    addressComponents: result.address_components.map((component) => ({
      longName: component.long_name,
      shortName: component.short_name,
      types: component.types,
    })),
  };
}
