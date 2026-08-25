import { createClient } from "@supabase/supabase-js";

type WebsiteEnrichment = {
  id: string;
  website: string;
  source: string;
};

const reviewedGolftecIds = [
  "golftec-ballantyne-nc-united-states",
  "golftec-baybrook-tx-united-states",
  "golftec-beaverton-or-united-states",
  "golftec-bellevue-wa-united-states",
  "golftec-cary-nc-united-states",
  "golftec-chandler-az-united-states",
  "golftec-clearwater-fl-united-states",
  "golftec-deerfield-il-united-states",
  "golftec-des-plaines-il-united-states",
  "golftec-eagan-mn-united-states",
  "golftec-eden-prairie-mn-united-states",
  "golftec-ellicott-city-md-united-states",
  "golftec-fairfax-va-united-states",
  "golftec-fort-collins-south-co-united-states",
  "golftec-frisco-tx-united-states",
  "golftec-halsted-row-il-united-states",
  "golftec-highlands-ranch-co-united-states",
  "golftec-katy-tx-united-states",
  "golftec-kck-ks-united-states",
  "golftec-lee-s-summit-mo-united-states",
  "golftec-lehigh-valley-pa-united-states",
  "golftec-memorial-city-tx-united-states",
  "golftec-minnetonka-mn-united-states",
  "golftec-mission-valley-ca-united-states",
  "golftec-naperville-il-united-states",
  "golftec-needham-ma-united-states",
  "golftec-north-bethesda-md-united-states",
  "golftec-north-raleigh-nc-united-states",
  "golftec-north-scottsdale-az-united-states",
  "golftec-oak-brook-il-united-states",
  "golftec-orland-park-il-united-states",
  "golftec-overland-park-ks-united-states",
  "golftec-plano-tx-united-states",
  "golftec-pleasanton-ca-united-states",
  "golftec-roseville-mn-united-states",
  "golftec-schaumburg-il-united-states",
  "golftec-southlake-tx-united-states",
  "golftec-sugar-land-tx-united-states",
  "golftec-tualatin-or-united-states",
  "golftec-tyvola-nc-united-states",
  "golftec-westshore-fl-united-states",
  "golftec-woodbridge-nj-united-states",
] as const;

const independentEnrichments: WebsiteEnrichment[] = [
  ["master-all-kids-golf-torrington-f99c0dfa4f", "https://allkidsgolfclubs.com/"],
  ["master-athens-golf-center-lexington-062b44f5da", "https://athensgolfcenter.com/"],
  ["master-ballyneal-golf-ltd-holyoke-4d8abdbbbc", "https://www.ballyneal.com/"],
  ["master-bubba-golf-statesboro-1b16f73fae", "https://bubbagolf.com/"],
  ["master-burnaby-golf-academy-burnaby-d35bb7c99e", "https://www.golfburnaby.ca/golf/burnaby-golf-academy"],
  ["master-canadian-junior-golf-association-cjga-richmond-hill-9e3cc715ed", "https://cjga.com/"],
  ["master-canmore-golf-curling-club-canmore-6f4bc36ab0", "https://canmoregolf.net/"],
  ["master-cataraqui-golf-and-country-club-kingston-06b9ced81c", "https://cataraqui.com/"],
  ["master-crowsnest-pass-golf-club-blairmore-c5497420d6", "https://crowsnestpassgolf.com/"],
  ["master-dothan-country-club-dothan-f7f7142fcd", "https://www.dothancountryclub.com/"],
  ["master-el-cuarto-verde-dba-the-green-room-argyle-72acec2f4a", "https://greenroomargyle.com/"],
  ["master-girloy-golf-course-gilroy-792253eb0b", "https://www.gilroygc.com/"],
  ["master-glencoe-golf-and-country-club-calgary-fe30c0e8f7", "https://glencoe.org/web/the-glencoe-golf-country-club"],
  ["master-glendale-golf-country-club-winnipeg-98173e2ac6", "https://www.glendalegolf.ca/"],
  ["master-golf-envy-frisco-frisco-1cbcdefb1f", "https://golfenvy.com/location/frisco/"],
  ["master-golf-franklin-bridge-franklin-722f3790ce", "https://franklinbridgegolf.com/"],
  ["master-green-island-cc-columbus-66f5d71b7c", "https://www.greenislandcc.org/"],
  ["master-land-o-lakes-golf-course-coaldale-5867626c33", "https://landolakesgolf.com/"],
  ["master-lantana-golf-club-lantana-7ab4a256ad", "https://www.lantanagolf.com/"],
  ["master-lindsay-golf-country-club-lindsay-1c4d7ccf5b", "https://lindsaygolf.ca/"],
  ["master-magna-golf-club-aurora-3d10abaeda", "https://www.magnagolf.com/"],
  ["master-mount-bruno-cc-roxton-pond-13dafcf1a2", "https://www.golfmbcc.com/"],
  ["master-ncr-country-club-kettering-104ae8205d", "https://www.ncrcountryclub.com/"],
  ["master-oak-tree-country-club-edmond-2f164214cf", "https://www.oaktreecountryclub.com/"],
  ["master-oaks-country-club-tulsa-e02102dc57", "https://www.oakscountryclub.com/"],
  ["master-one-degree-clermont-3f38bd410c", "https://onedegree.golf/"],
  ["master-paradise-canyon-golf-resort-lethbridge-14f4545f58", "https://playinparadise.com/"],
  ["master-pebblehurst-golf-putter-lab-homewood-74b5f1c060", "https://pebblehurst.com/"],
  ["master-reynolds-lake-oconee-the-landings-course-greensboro-f718d08ad6", "https://www.reynoldslakeoconee.com/life/golf/the-landing"],
  ["master-ridgeview-country-club-duluth-2d31cd2209", "https://www.ridgeviewcountryclub.com/"],
  ["master-sai-golf-academy-suwanee-9c40b49bb7", "https://www.saigolfacademy.com/"],
  ["master-spring-lakes-golf-club-whitchurch-stouffville-a0288572d3", "https://springlakesgolf.com/"],
  ["master-sticks-96-golf-wichita-d7520cdc3c", "https://sticks96golf.com/"],
  ["master-tee-time-tulsa-tulsa-58f8867fec", "https://www.teetimegolftulsa.com/"],
  ["master-the-landings-golf-athletic-club-savannah-9b354155ca", "https://thelandings.com/golf-and-athletic-club"],
  ["master-the-ridge-golf-club-sioux-center-9f711ee4d2", "https://www.siouxcenterridge.com/"],
  ["master-virtual-golf-club-burlington-a38fd4c325", "https://virtualgc.ca/"],
].map(([id, website]) => ({ id, website, source: website }));

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function golftecSlug(locationName: string) {
  return locationName
    .replace(/^GOLFTEC\s+/i, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const supabase = createClient(requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"), requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const ids = [...reviewedGolftecIds, ...independentEnrichments.map(({ id }) => id), "master-golftec-englewood-ef43139d82"];
  const { data, error } = await supabase
    .from("dealers")
    .select("id,name,location_name,active,verification_status,website")
    .in("id", ids);
  if (error) throw new Error(`Could not load dealers: ${error.message}`);

  const dealers = new Map((data ?? []).map((dealer) => [dealer.id, dealer]));
  const golftecEnrichments = reviewedGolftecIds.map((id): WebsiteEnrichment => {
    const dealer = dealers.get(id);
    if (!dealer) throw new Error(`Reviewed dealer is missing: ${id}`);
    const path = id === "golftec-kck-ks-united-states" ? "kansas-city" : golftecSlug(dealer.location_name);
    const website = `https://www.golftec.com/golf-lessons/${path}`;
    return { id, website, source: website };
  });
  const enrichments: WebsiteEnrichment[] = [
    ...golftecEnrichments,
    {
      id: "master-golftec-englewood-ef43139d82",
      website: "https://www.golftec.com/golf-lesson/promo/headquarters",
      source: "https://www.golftec.com/golf-lesson/promo/headquarters",
    },
    ...independentEnrichments,
  ];

  const conflicts: string[] = [];
  const pending = enrichments.filter(({ id, website }) => {
    const dealer = dealers.get(id);
    if (!dealer) {
      conflicts.push(`${id}: record is missing`);
      return false;
    }
    if (!dealer.active || dealer.verification_status !== "verified") {
      conflicts.push(`${id}: record is not active and verified`);
      return false;
    }
    if (dealer.website && dealer.website !== website) {
      conflicts.push(`${id}: existing website would be overwritten`);
      return false;
    }
    return !dealer.website;
  });
  if (conflicts.length) throw new Error(`Website enrichment stopped before writing:\n${conflicts.join("\n")}`);

  if (apply) {
    for (const enrichment of pending) {
      const { data: updated, error: updateError } = await supabase
        .from("dealers")
        .update({ website: enrichment.website })
        .eq("id", enrichment.id)
        .is("website", null)
        .select("id");
      if (updateError || updated?.length !== 1) {
        throw new Error(`${enrichment.id}: website update failed${updateError ? ` (${updateError.message})` : ""}`);
      }
    }
  }

  console.log(JSON.stringify({
    mode: apply ? "applied" : "dry-run",
    reviewed: enrichments.length,
    pending: pending.length,
    unchanged: enrichments.length - pending.length,
    sources: { golftec: golftecEnrichments.length + 1, independent: independentEnrichments.length },
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Dealer website enrichment failed.");
  process.exitCode = 1;
});
