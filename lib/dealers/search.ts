import type { Dealer } from "@/types/dealer";

const stateNames: Record<string, string> = {
  CA: "california", CO: "colorado", FL: "florida", GA: "georgia", IA: "iowa",
  ID: "idaho", IL: "illinois", IN: "indiana", KS: "kansas", MA: "massachusetts",
  MI: "michigan", MN: "minnesota", MO: "missouri", NC: "north carolina",
  NJ: "new jersey", NV: "nevada", NY: "new york", OK: "oklahoma", OR: "oregon",
  PA: "pennsylvania", SC: "south carolina", SD: "south dakota", TN: "tennessee",
  TX: "texas", UT: "utah", VA: "virginia", WA: "washington", WI: "wisconsin",
};

const countryAliases: Record<string, string> = {
  "United States": "us usa",
  "United Kingdom": "uk gb great britain",
  Australia: "aus",
  Canada: "can",
};

const clean = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
const dealerCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

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
