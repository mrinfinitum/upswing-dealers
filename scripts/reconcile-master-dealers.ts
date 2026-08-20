import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import readXlsxFile from "read-excel-file/node";

const TEMPLATE_HEADERS = [
  "dealer_name",
  "location_name",
  "address_line_1",
  "address_line_2",
  "city",
  "state_province",
  "postal_code",
  "country",
  "phone",
  "website",
  "email",
  "dealer_type",
  "active",
  "notes",
] as const;

type DatabaseDealer = {
  id: string;
  name: string;
  location_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  dealer_type: string | null;
  active: boolean;
  notes: string | null;
};

type GolftecRow = {
  center: string;
  manager: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  accountNumber: string;
  sourceRow: number;
};

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function slug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fingerprint(...values: Array<string | null | undefined>) {
  return values
    .map((value) => (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""))
    .join("|");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function databaseDealerToCsvRow(dealer: DatabaseDealer) {
  return [
    dealer.name,
    dealer.location_name,
    dealer.address_line_1,
    dealer.address_line_2,
    dealer.city,
    dealer.state_province,
    dealer.postal_code,
    dealer.country,
    dealer.phone,
    dealer.website,
    dealer.email,
    dealer.dealer_type,
    dealer.active ? "true" : "false",
    dealer.notes,
  ];
}

function parseCsvHeader(source: string) {
  const firstLine = source.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  return firstLine.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

async function loadGolftecRows(workbookPath: string): Promise<GolftecRow[]> {
  const sheets = await readXlsxFile(workbookPath);
  const sheet = sheets.find((candidate) => candidate.sheet === "GOLFTEC");
  if (!sheet) throw new Error("The workbook does not contain a GOLFTEC sheet.");

  return sheet.data.slice(2).flatMap((row, offset) => {
    const [center, manager, address, city, state, postalCode, accountNumber] = row;
    if (!center || !address || !city || !state || !postalCode) return [];
    const normalizedPostalCode = String(postalCode).padStart(5, "0");
    return [{
      center: String(center).trim(),
      manager: String(manager ?? "").trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      postalCode: normalizedPostalCode,
      accountNumber: String(accountNumber ?? "").trim(),
      sourceRow: offset + 3,
    }];
  });
}

async function main() {
  const [workbookArg, templateArg, outputArg, applyArg] = process.argv.slice(2);
  if (!workbookArg || !templateArg || !outputArg) {
    throw new Error("Usage: reconcile-master-dealers.ts <master.xlsx> <template.csv> <output.csv> [--apply]");
  }

  const workbookPath = resolve(workbookArg);
  const templatePath = resolve(templateArg);
  const outputPath = resolve(outputArg);
  const templateHeaders = parseCsvHeader(await readFile(templatePath, "utf8"));
  if (JSON.stringify(templateHeaders) !== JSON.stringify(TEMPLATE_HEADERS)) {
    throw new Error("The supplied CSV template headers do not match the approved import format.");
  }

  const supabase = createClient(
    requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const selectColumns = "id,name,location_name,address_line_1,address_line_2,city,state_province,postal_code,country,phone,website,email,dealer_type,active,notes";
  const { data: existingData, error: existingError } = await supabase
    .from("dealers")
    .select(selectColumns)
    .order("name")
    .order("location_name")
    .order("city");
  if (existingError) throw new Error(`Could not load current dealers: ${existingError.message}`);
  const existing = existingData as DatabaseDealer[];
  const existingFingerprints = new Set(existing.map((dealer) => fingerprint(
    dealer.name,
    dealer.address_line_1,
    dealer.city,
    dealer.state_province,
    dealer.postal_code,
    dealer.country,
  )));

  const golftecRows = await loadGolftecRows(workbookPath);
  const proposed = golftecRows.filter((row) => !existingFingerprints.has(fingerprint(
    "GOLFTEC",
    row.address,
    row.city,
    row.state,
    row.postalCode,
    "United States",
  )));

  if (applyArg === "--apply" && proposed.length) {
    const importedAt = new Date().toISOString();
    const mutations = proposed.map((row) => ({
      id: `golftec-${slug(row.center)}-${row.state.toLowerCase()}-united-states`,
      name: "GOLFTEC",
      location_name: `GOLFTEC ${row.center}`,
      address_line_1: row.address,
      address_line_2: null,
      city: row.city,
      state_province: row.state,
      postal_code: row.postalCode,
      country: "United States",
      latitude: null,
      longitude: null,
      phone: null,
      website: null,
      email: null,
      dealer_type: null,
      active: true,
      notes: [
        row.manager ? `Center manager: ${row.manager}.` : "",
        row.accountNumber ? `Source account number: ${row.accountNumber}.` : "",
        "Imported from the supplied master retail location list; contact details and coordinates require verification.",
      ].filter(Boolean).join(" "),
      verification_status: "unverified",
      source_workbook: basename(workbookPath),
      source_sheet: "GOLFTEC",
      source_row: row.sourceRow,
      source_raw_city: row.city,
      source_raw_region: row.state,
      enrichment_sources: [],
      coordinate_evidence: null,
      updated_at: importedAt,
    }));
    const { error: insertError } = await supabase.from("dealers").insert(mutations);
    if (insertError) throw new Error(`Could not import GOLFTEC locations: ${insertError.message}`);
  }

  const { data: finalData, error: finalError } = await supabase
    .from("dealers")
    .select(selectColumns)
    .order("name")
    .order("location_name")
    .order("city");
  if (finalError) throw new Error(`Could not load the final dealer export: ${finalError.message}`);
  const finalDealers = finalData as DatabaseDealer[];

  const csv = [
    TEMPLATE_HEADERS.map(csvCell).join(","),
    ...finalDealers.map((dealer) => databaseDealerToCsvRow(dealer).map(csvCell).join(",")),
  ].join("\n") + "\n";
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, csv, "utf8");

  const counts = finalDealers.reduce<Record<string, number>>((result, dealer) => {
    result[dealer.name] = (result[dealer.name] ?? 0) + 1;
    return result;
  }, {});
  console.log(JSON.stringify({
    currentBefore: existing.length,
    golftecWorkbookRows: golftecRows.length,
    newGolftecRows: proposed.length,
    applied: applyArg === "--apply",
    finalCount: finalDealers.length,
    counts,
    outputPath,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Dealer reconciliation failed.");
  process.exitCode = 1;
});
