import type { Dealer } from "@/types/dealer";

export function getMappableDealers(dealers: Dealer[]) {
  return dealers.filter((dealer) => dealer.coordinates !== undefined);
}
