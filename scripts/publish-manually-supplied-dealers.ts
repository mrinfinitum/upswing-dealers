import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type ManualDealer = {
  sourceRow: number;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  sourceRawCity: string;
  sourceRawRegion: string;
  discrepancyNote: string;
};

const reviewedAt = "2026-08-25";
const workbook = "MASTER RETAIL LOCATION LIST _1_.xlsx";

const manualDealers: ManualDealer[] = [
  {
    sourceRow: 2,
    name: "13 Golf LLC",
    addressLine1: "17751 Boca Club Blvd",
    city: "Boca Raton",
    stateProvince: "FL",
    postalCode: "33432",
    country: "United States",
    sourceRawCity: "Raton",
    sourceRawRegion: "FL",
    discrepancyNote:
      "The source workbook split Boca Raton between address line 1 and the city column. The complete normalized address was supplied by an UpSwing administrator.",
  },
  {
    sourceRow: 20,
    name: "Debbie Llamas",
    addressLine1: "Valle de Sílice 1",
    addressLine2: "Acantha, Zibatá",
    city: "El Marqués",
    stateProvince: "Querétaro",
    postalCode: "76269",
    country: "Mexico",
    sourceRawCity: "",
    sourceRawRegion: "",
    discrepancyNote:
      "The source workbook did not contain location fields. The complete address was supplied by an UpSwing administrator.",
  },
];

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function normalized(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function fingerprint(...values: Array<string | null | undefined>) {
  return values.map(normalized).join("|");
}

function slug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stableId(dealer: ManualDealer) {
  const key = fingerprint(
    dealer.addressLine1,
    dealer.city,
    dealer.stateProvince,
    dealer.postalCode,
    dealer.country,
  );
  const digest = createHash("sha256").update(key).digest("hex").slice(0, 10);
  return `master-${slug(dealer.name)}-${slug(dealer.city)}-${digest}`;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const supabase = createClient(
    requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: existing, error } = await supabase
    .from("dealers")
    .select("id,name,address_line_1,city,state_province,postal_code,country");
  if (error) throw new Error(`Could not load existing dealers: ${error.message}`);

  const existingAddresses = new Map(
    (existing ?? []).map((dealer) => [
      fingerprint(
        dealer.address_line_1,
        dealer.city,
        dealer.state_province,
        dealer.postal_code,
        dealer.country,
      ),
      dealer,
    ]),
  );
  const existingNameCities = new Map(
    (existing ?? []).map((dealer) => [
      fingerprint(dealer.name, dealer.city, dealer.state_province, dealer.country),
      dealer,
    ]),
  );
  const conflicts = manualDealers.flatMap((dealer) => {
    const addressMatch = existingAddresses.get(
      fingerprint(
        dealer.addressLine1,
        dealer.city,
        dealer.stateProvince,
        dealer.postalCode,
        dealer.country,
      ),
    );
    const nameCityMatch = existingNameCities.get(
      fingerprint(dealer.name, dealer.city, dealer.stateProvince, dealer.country),
    );
    if (addressMatch) {
      return [
        `${dealer.name}: address already belongs to ${addressMatch.name} (${addressMatch.id})`,
      ];
    }
    if (nameCityMatch) {
      return [
        `${dealer.name}: name/city already exists with different address data (${nameCityMatch.id})`,
      ];
    }
    return [];
  });
  if (conflicts.length) {
    throw new Error(
      `Import stopped before writing because conflicts were found:\n${conflicts.join("\n")}`,
    );
  }

  const mutations = manualDealers.map((dealer) => ({
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
    phone: null,
    website: null,
    email: null,
    active: true,
    notes: `${dealer.discrepancyNote} Address and dealer identity were manually reviewed on ${reviewedAt}. Coordinates remain pending the approved Google Maps JavaScript geocoding workflow.`,
    verification_status: "verified",
    source_workbook: workbook,
    source_sheet: "DEALER",
    source_row: dealer.sourceRow,
    source_raw_city: dealer.sourceRawCity,
    source_raw_region: dealer.sourceRawRegion,
    enrichment_sources: [
      {
        type: "manual",
        label: "Address supplied by UpSwing administrator",
        url: "manual://upswing-administrator",
        retrievedAt: reviewedAt,
        fields: [
          "canonicalLocationName",
          "addressLine1",
          "addressLine2",
          "city",
          "stateProvince",
          "postalCode",
          "country",
        ],
      },
    ],
    coordinate_evidence: null,
  }));

  if (apply) {
    const { error: insertError } = await supabase.from("dealers").insert(mutations);
    if (insertError) throw new Error(`No records were added: ${insertError.message}`);
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "applied" : "dry-run",
        reviewed: manualDealers.length,
        published: apply ? mutations.length : 0,
        mapped: 0,
        unresolvedExcluded: ["Baku S.A."],
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Manual dealer publication failed.",
  );
  process.exitCode = 1;
});
