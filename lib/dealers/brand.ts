export type DealerBrandAsset = {
  src: string;
  inverted?: boolean;
};

const dealerBrandAssets: Record<string, DealerBrandAsset> = {
  "Club Champion": {
    src: "https://clubchampion.com/images/2022_mindk/cc-logo-header.svg",
    inverted: true,
  },
  "PGA TOUR Superstore": {
    src: "https://www.pgatoursuperstore.com/on/demandware.static/Sites-pgatss-sfra-Site/-/default/dwb27c47bd/images/logo.svg",
  },
  SCHEELS: {
    src: "/brand/scheels-logo.svg",
  },
  GOLFTEC: {
    src: "/brand/golftec-logo.svg",
  },
};

export function getDealerBrandAsset(dealerName: string) {
  return dealerBrandAssets[dealerName];
}
