import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type ReviewedDealer = {
  sourceRow: number;
  originalName: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phone?: string;
  website?: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceType?: "official-retailer" | "manual";
  discrepancyNote: string;
};

const reviewedAt = "2026-08-25";
const workbook = "MASTER RETAIL LOCATION LIST _1_.xlsx";

const reviewedDealers: ReviewedDealer[] = [
  { sourceRow: 3, originalName: "3Bird Golf", name: "3Bird Golf", addressLine1: "371 NE 70th St", city: "Oklahoma City", stateProvince: "OK", postalCode: "73105", country: "United States", website: "https://www.3bird.golf/", sourceLabel: "3Bird Golf official website", sourceUrl: "https://www.3bird.golf/", discrepancyNote: "The workbook stored the complete address in address line 1; the official website confirms its normalized components." },
  { sourceRow: 13, originalName: "Carnmoney Golf Club", name: "Carnmoney Golf Club", addressLine1: "44001 Dunbow Rd", city: "Foothills", stateProvince: "AB", postalCode: "T1S 4X7", country: "Canada", phone: "403-256-6161", website: "https://www.carnmoney.com/new-index", sourceLabel: "Carnmoney Golf Club official website", sourceUrl: "https://www.carnmoney.com/new-index", discrepancyNote: "The workbook incorrectly identified the country as United States; the authoritative address is in Alberta, Canada." },
  { sourceRow: 15, originalName: "Champions Choice", name: "Champions Choice", addressLine1: "701 W 36th Ave", addressLine2: "Suite 1A", city: "Anchorage", stateProvince: "AK", postalCode: "99503", country: "United States", sourceLabel: "Alaska business registry record mirror", sourceUrl: "https://www.alaskacompanydir.com/companies/champions-choice-llc/", sourceType: "manual", discrepancyNote: "The workbook split the suite and municipality across columns; the registered business address confirms the normalized location." },
  { sourceRow: 16, originalName: "Club Campestre - Monterrey", name: "Club Campestre - Monterrey", addressLine1: "Av. Alfonso Reyes 107", addressLine2: "Col. Santa Engracia", city: "San Pedro Garza García", stateProvince: "Nuevo León", postalCode: "66267", country: "Mexico", phone: "+52 81 8040 1111", website: "https://www.campestremty.com/contact", sourceLabel: "Club Campestre Monterrey official contact page", sourceUrl: "https://www.campestremty.com/contact", discrepancyNote: "The workbook did not supply an address; the official club contact page supplies the complete current address." },
  { sourceRow: 18, originalName: "CommonGround", name: "CommonGround", addressLine1: "10300 E Golfers Way", city: "Aurora", stateProvince: "CO", postalCode: "80010", country: "United States", phone: "303-340-1520", website: "https://www.commongroundgc.com/component/content/article?id=2", sourceLabel: "CommonGround Golf Course official contact page", sourceUrl: "https://www.commongroundgc.com/component/content/article?id=2", discrepancyNote: "The workbook split Golfers Way and Aurora across columns; the official club page confirms the normalized address." },
  { sourceRow: 23, originalName: "Evergreen Golf Course", name: "Evergreen Golf Course", addressLine1: "300 Evergreen Dr", city: "Nipawin", stateProvince: "SK", postalCode: "S0E 1E0", country: "Canada", phone: "306-862-4811", website: "https://evergreengolfcourse.ca/contact/", sourceLabel: "Evergreen Golf Course official contact page", sourceUrl: "https://evergreengolfcourse.ca/contact/", discrepancyNote: "The workbook placed Saskatchewan in the country field; the official page confirms Saskatchewan, Canada." },
  { sourceRow: 24, originalName: "Florida Junior Golf", name: "Florida Junior Golf", addressLine1: "5310 Michigan Ave", addressLine2: "Royal St. Cloud Golf Links", city: "St. Cloud", stateProvince: "FL", postalCode: "34772", country: "United States", phone: "407-279-1296", website: "https://www.fljrgolf.com/", sourceLabel: "Florida Junior Golf official website", sourceUrl: "https://www.fljrgolf.com/", discrepancyNote: "The workbook did not supply an address; the official program site identifies its current Royal St. Cloud Golf Links facility." },
  { sourceRow: 26, originalName: "Gaillardia Country Club", name: "Gaillardia Country Club", addressLine1: "5300 Gaillardia Blvd", city: "Oklahoma City", stateProvince: "OK", postalCode: "73142", country: "United States", phone: "405-302-2810", website: "https://www.gaillardia.com/contact-us", sourceLabel: "Gaillardia Country Club official contact page", sourceUrl: "https://www.gaillardia.com/contact-us", discrepancyNote: "The workbook stored the municipality and postal code in address line 1; the official contact page confirms the normalized address." },
  { sourceRow: 32, originalName: "Golf Tee Performance", name: "Golf Tee Performance", addressLine1: "1607 Hart St", addressLine2: "Suite 100", city: "Southlake", stateProvince: "TX", postalCode: "76092", country: "United States", phone: "972-445-7808", website: "https://golfteeperformance.com/", sourceLabel: "PGA of America facility directory", sourceUrl: "https://www.pga.com/play/tx/southlake/golftee-performance/27827945", sourceType: "manual", discrepancyNote: "The workbook's Flower Mound address is stale; the PGA facility directory and current business website identify the Southlake location." },
  { sourceRow: 34, originalName: "Grasslands Club", name: "Grasslands Club", addressLine1: "1445 Foxland Blvd", city: "Gallatin", stateProvince: "TN", postalCode: "37066", country: "United States", website: "https://www.tngrasslands.com/?p=home", sourceLabel: "Grasslands Club official website", sourceUrl: "https://www.tngrasslands.com/?p=home", discrepancyNote: "The workbook placed the Foxland street address in the city column; the official site confirms this Grasslands facility." },
  { sourceRow: 36, originalName: "Griffin Golf", name: "Griffin Golf", addressLine1: "13701 24th St E", addressLine2: "Suite F-6", city: "Sumner", stateProvince: "WA", postalCode: "98390", country: "United States", phone: "253-750-0649", website: "https://www.teamgriffingolf.com/", sourceLabel: "Griffin Golf official website", sourceUrl: "https://www.teamgriffingolf.com/", discrepancyNote: "The workbook did not supply an address; the official website confirms the Griffin Golf Studio location." },
  { sourceRow: 37, originalName: "Hamptons Golf Club", name: "Hamptons Golf Club", addressLine1: "69 Hamptons Dr NW", city: "Calgary", stateProvince: "AB", postalCode: "T3A 5H7", country: "Canada", website: "https://www.hamptonsgolfclub.com/members-home/", sourceLabel: "Hamptons Golf Club official website", sourceUrl: "https://www.hamptonsgolfclub.com/members-home/", discrepancyNote: "The workbook omitted the postal code; the official club page confirms the complete Calgary address." },
  { sourceRow: 38, originalName: "Henderson Lake GC", name: "Henderson Lake Golf Club", addressLine1: "2727 South Parkside Dr", city: "Lethbridge", stateProvince: "AB", postalCode: "T1K 0C6", country: "Canada", phone: "403-329-6767", website: "https://hendersonlakegolf.com/contact-us/", sourceLabel: "Henderson Lake Golf Club official contact page", sourceUrl: "https://hendersonlakegolf.com/contact-us/", discrepancyNote: "The workbook placed province and postal data in the country field; the official page confirms Alberta, Canada." },
  { sourceRow: 39, originalName: "Jackson Golf", name: "Jackson Golf", addressLine1: "1900 Empire Blvd", addressLine2: "Suite 170", city: "Webster", stateProvince: "NY", postalCode: "14580", country: "United States", phone: "585-613-8491", website: "https://jacksonsgolf.com/contact/", sourceLabel: "Jackson's Golf official contact page", sourceUrl: "https://jacksonsgolf.com/contact/", discrepancyNote: "The workbook split the suite and municipality across columns; the official page confirms the normalized address." },
  { sourceRow: 42, originalName: "Kawartha Golf Club", name: "Kawartha Golf Club", addressLine1: "777 Clonsilla Ave", city: "Peterborough", stateProvince: "ON", postalCode: "K9J 5Y2", country: "Canada", website: "https://www.kawarthagolf.ca/The_Course/Club_Contact/Directions_%281%29.aspx", sourceLabel: "Kawartha Golf Club official directions page", sourceUrl: "https://www.kawarthagolf.ca/The_Course/Club_Contact/Directions_%281%29.aspx", discrepancyNote: "The workbook placed the mailing postal code in the country field; the official page distinguishes the K9J 5Y2 physical address from its PO box." },
  { sourceRow: 55, originalName: "R&R Golf", name: "R&R Golf", addressLine1: "1424 N 24th St", city: "Quincy", stateProvince: "IL", postalCode: "62301", country: "United States", phone: "217-228-1174", website: "https://rrgolfquincy.com/", sourceLabel: "R&R Golf official website", sourceUrl: "https://rrgolfquincy.com/", discrepancyNote: "The workbook stored the complete address in address line 1; the official website confirms its normalized components." },
  { sourceRow: 59, originalName: "Smash Swing Golf", name: "Smash Swing Golf", addressLine1: "550 W Round Grove Rd", addressLine2: "Suite 500", city: "Lewisville", stateProvince: "TX", postalCode: "75067", country: "United States", website: "https://smashswingimmersive.com/", sourceLabel: "SmashSwing Immersive company profile", sourceUrl: "https://www.linkedin.com/company/smashswing-immersive", sourceType: "manual", discrepancyNote: "The workbook split the suite and municipality across columns; the company profile confirms the normalized address." },
  { sourceRow: 63, originalName: "The Greens Country CLub", name: "The Greens Country Club", addressLine1: "13100 Green Valley Dr", city: "Oklahoma City", stateProvince: "OK", postalCode: "73120", country: "United States", phone: "405-751-7095", website: "https://www.thegreenscc.com/default.aspx?p=DynamicModule&pageid=19&ssid=100037&vnf=1", sourceLabel: "The Greens Country Club official contact page", sourceUrl: "https://www.thegreenscc.com/default.aspx?p=DynamicModule&pageid=19&ssid=100037&vnf=1", discrepancyNote: "The workbook placed Oklahoma City in address line 2 and contained a capitalization typo; the official page confirms the canonical name and address." },
  { sourceRow: 68, originalName: "Woodside Golf Course", name: "Woodside Golf Course", addressLine1: "525 Woodside Dr NW", city: "Airdrie", stateProvince: "AB", postalCode: "T4B 2C6", country: "Canada", phone: "403-948-6717", website: "https://www.woodsidegc.com/", sourceLabel: "Woodside Golf Course official website", sourceUrl: "https://www.woodsidegc.com/", discrepancyNote: "The workbook split NW and Airdrie across columns and supplied a stale postal code; the official site confirms T4B 2C6." },
];

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function normalized(value: string | null | undefined) {
  return (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fingerprint(...values: Array<string | null | undefined>) {
  return values.map(normalized).join("|");
}

function slug(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stableId(dealer: ReviewedDealer) {
  const key = fingerprint(dealer.addressLine1, dealer.city, dealer.stateProvince, dealer.postalCode, dealer.country);
  const digest = createHash("sha256").update(key).digest("hex").slice(0, 10);
  return `master-${slug(dealer.name)}-${slug(dealer.city)}-${digest}`;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const supabase = createClient(requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"), requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: existing, error } = await supabase.from("dealers").select("id,name,address_line_1,city,state_province,postal_code,country");
  if (error) throw new Error(`Could not load existing dealers: ${error.message}`);

  const existingAddresses = new Map((existing ?? []).map((dealer) => [
    fingerprint(dealer.address_line_1, dealer.city, dealer.state_province, dealer.postal_code, dealer.country),
    dealer,
  ]));
  const existingNameCities = new Map((existing ?? []).map((dealer) => [
    fingerprint(dealer.name, dealer.city, dealer.state_province, dealer.country),
    dealer,
  ]));
  const conflicts = reviewedDealers.flatMap((dealer) => {
    const addressMatch = existingAddresses.get(fingerprint(dealer.addressLine1, dealer.city, dealer.stateProvince, dealer.postalCode, dealer.country));
    const nameCityMatch = existingNameCities.get(fingerprint(dealer.name, dealer.city, dealer.stateProvince, dealer.country));
    if (addressMatch) return [`${dealer.name}: address already belongs to ${addressMatch.name} (${addressMatch.id})`];
    if (nameCityMatch) return [`${dealer.name}: name/city already exists with different address data (${nameCityMatch.id})`];
    return [];
  });
  if (conflicts.length) throw new Error(`Import stopped before writing because conflicts were found:\n${conflicts.join("\n")}`);

  const mutations = reviewedDealers.map((dealer) => ({
    id: stableId(dealer),
    name: dealer.name,
    location_name: dealer.name,
    address_line_1: dealer.addressLine1,
    address_line_2: dealer.addressLine2 ?? null,
    city: dealer.city,
    state_province: dealer.stateProvince,
    postal_code: dealer.postalCode,
    country: dealer.country,
    latitude: null,
    longitude: null,
    phone: dealer.phone ?? null,
    website: dealer.website ?? null,
    email: null,
    dealer_type: "Independent retailer",
    active: true,
    notes: `${dealer.discrepancyNote} Address and dealer identity were manually reviewed on ${reviewedAt}. Coordinates remain pending the approved Google Maps JavaScript geocoding workflow.`,
    verification_status: "verified",
    source_workbook: workbook,
    source_sheet: "DEALER",
    source_row: dealer.sourceRow,
    source_raw_city: dealer.city,
    source_raw_region: dealer.stateProvince,
    enrichment_sources: [{
      type: dealer.sourceType ?? "official-retailer",
      label: dealer.sourceLabel,
      url: dealer.sourceUrl,
      retrievedAt: reviewedAt,
      fields: ["canonicalLocationName", "addressLine1", "addressLine2", "city", "stateProvince", "postalCode", "country", "phone", "website"],
    }],
    coordinate_evidence: null,
  }));

  if (apply) {
    const { error: insertError } = await supabase.from("dealers").insert(mutations);
    if (insertError) throw new Error(`No records were added: ${insertError.message}`);
  }
  console.log(JSON.stringify({ mode: apply ? "applied" : "dry-run", reviewed: reviewedDealers.length, published: apply ? mutations.length : 0, mapped: 0, unresolvedExcluded: ["13 Golf LLC", "Baku S.A.", "Debbie Llamas"], staleExcluded: ["Club Champion Willowbrook workbook row"] }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Reviewed dealer publication failed.");
  process.exitCode = 1;
});
