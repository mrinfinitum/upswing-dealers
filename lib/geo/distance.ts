import type { Dealer, DealerCoordinates, DealerWithDistance } from "@/types/dealer";

const EARTH_RADIUS_MILES = 3958.8;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function distanceMiles(a: DealerCoordinates, b: DealerCoordinates) {
  const latDelta = radians(b.latitude - a.latitude);
  const lngDelta = radians(b.longitude - a.longitude);
  const latA = radians(a.latitude);
  const latB = radians(b.latitude);
  const h = Math.sin(latDelta / 2) ** 2 + Math.cos(latA) * Math.cos(latB) * Math.sin(lngDelta / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function sortDealersByDistance(dealers: Dealer[], origin?: DealerCoordinates): DealerWithDistance[] {
  if (!origin) return dealers;
  return dealers.map((dealer) => ({
    ...dealer,
    ...(dealer.coordinates ? { distanceMiles: distanceMiles(origin, dealer.coordinates) } : {}),
  })).sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
}
