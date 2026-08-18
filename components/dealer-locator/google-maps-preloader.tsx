"use client";

import { useEffect } from "react";
import { preconnect, prefetchDNS } from "react-dom";
import { loadGoogleMaps } from "@/lib/maps/google-loader";
import type { GoogleMapConfiguration } from "@/lib/maps/provider";

export function GoogleMapsPreloader({ config }: { config: GoogleMapConfiguration }) {
  preconnect("https://maps.googleapis.com");
  preconnect("https://maps.gstatic.com", { crossOrigin: "anonymous" });
  prefetchDNS("https://maps.googleapis.com");
  prefetchDNS("https://maps.gstatic.com");

  useEffect(() => {
    void loadGoogleMaps(config).catch(() => {
      // The visible map owns the user-facing fallback if Google is unavailable.
    });
  }, [config]);

  return null;
}
