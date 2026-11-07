import type { Dealer } from "@/types/dealer";
import { US_STATE_NAMES } from "@/lib/geo/us-states";

// Every US state and DC, so any state a dealer is in resolves to an exact-state filter. A missing state used to
// fall back to substring search, where "NE" matched "371 NE 70th St" and "Ballyneal".
const stateNames: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_NAMES).map(([code, name]) => [code, name.toLowerCase()]),
);

const countryAliases: Record<string, string> = {
  "United States": "us usa",
  "United Kingdom": "uk gb great britain",
  Australia: "aus",
  Canada: "can",
};

const clean = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
const dealerCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

export function getStateCodeForQuery(query: string): string | undefined {
  const normalizedQuery = clean(query);
  if (!normalizedQuery) return undefined;
  return Object.entries(stateNames).find(([code, name]) => clean(code) === normalizedQuery || name === normalizedQuery)?.[0];
}

export function sortDealersAlphabetically(dealers: Dealer[]): Dealer[] {
  return [...dealers].sort((left, right) => {
    for (const comparison of [
      dealerCollator.compare(left.name, right.name),
      dealerCollator.compare(left.city, right.city),
      dealerCollator.compare(left.stateProvince ?? "", right.stateProvince ?? ""),
      dealerCollator.compare(left.postalCode ?? "", right.postalCode ?? ""),
    ]) {
      if (comparison) return comparison;
    }
    return dealerCollator.compare(left.id, right.id);
  });
}

export function getInitialDealerResults(dealers: Dealer[]): Dealer[] {
  return sortDealersAlphabetically(dealers.filter((dealer) => clean(dealer.country) === "united states"));
}

export function searchDealers(dealers: Dealer[], query: string): Dealer[] {
  const normalizedQuery = clean(query);
  if (!normalizedQuery) return dealers;
  const terms = normalizedQuery.split(/\s+/);
  return dealers.filter((dealer) => {
    const regionName = dealer.stateProvince ? stateNames[dealer.stateProvince] : "";
    const haystack = clean([
      dealer.name, dealer.addressLine1, dealer.addressLine2, dealer.city,
      dealer.stateProvince, regionName, dealer.postalCode, dealer.country, countryAliases[dealer.country],
    ].filter(Boolean).join(" "));
    return terms.every((term) => haystack.includes(term));
  });
}

export function searchDealersByExactState(dealers: Dealer[], stateCode: string): Dealer[] {
  const normalizedState = clean(stateCode);
  return dealers.filter((dealer) => dealer.country === "United States" && clean(dealer.stateProvince ?? "") === normalizedState);
}

export function queryLooksPostal(query: string) {
  const value = query.trim();
  return /^\d{5}(?:-\d{4})?$/.test(value) || /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/i.test(value);
}

export function queryMatchesDealerName(dealers: Dealer[], query: string) {
  const normalizedQuery = clean(query);
  if (!normalizedQuery) return false;
  return dealers.some((dealer) => clean(dealer.name).includes(normalizedQuery));
}

export function queryMatchesCountry(dealers: Dealer[], query: string) {
  const normalizedQuery = clean(query);
  return Boolean(normalizedQuery) && dealers.some((dealer) => {
    const names = [dealer.country, ...(countryAliases[dealer.country]?.split(" ") ?? [])];
    return names.some((name) => clean(name) === normalizedQuery);
  });
}
