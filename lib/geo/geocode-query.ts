import type { Dealer } from "@/types/dealer";

export function buildDealerGeocodeQuery(dealer: Dealer) {
  return [
    dealer.addressLine1,
    dealer.addressLine2,
    dealer.city,
    dealer.stateProvince,
    dealer.postalCode,
    dealer.country,
  ].filter(Boolean).join(", ");
}
