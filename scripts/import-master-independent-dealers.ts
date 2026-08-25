import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import readXlsxFile from "read-excel-file/node";

type Cell = string | number | boolean | Date | null;
type WorkbookRow = Cell[];

type ExistingDealer = {
  id: string;
  name: string;
  address_line_1: string | null;
  city: string;
  state_province: string | null;
  postal_code: string | null;
  country: string;
  source_sheet: string | null;
  source_raw_city: string | null;
  source_raw_region: string | null;
};

type Candidate = {
  sourceSheet: string;
  sourceRow: number;
  original: Record<string, unknown>;
  mutation: Record<string, unknown>;
};

type SkippedRow = {
  sourceSheet: string;
  sourceRow: number;
  name: string;
  reason: string;
  original: Record<string, unknown>;
};

const retailerSheets: Record<string, string> = {
  PGATSS: "PGA TOUR Superstore",
  SCHEELS: "SCHEELS",
  "CLUB CHAMPION": "Club Champion",
};

const regionAliases: Record<string, string> = {
  Alberta: "AB",
  Georgia: "GA",
  Oklahoma: "OK",
  Ontario: "ON",
  Texas: "TX",
};

const canadianProvinceCodes = new Set(["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"]);

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function text(value: Cell | undefined) {
  return String(value ?? "").trim();
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

function stableId(name: string, city: string, locationFingerprint: string) {
  const digest = createHash("sha256").update(locationFingerprint).digest("hex").slice(0, 10);
  return `master-${slug(name)}-${slug(city)}-${digest}`;
}

function normalizeCountry(value: string) {
  const key = value.trim().toUpperCase();
  if (key === "US" || key === "USA" || key === "UNITED STATES") return "United States";
  if (key === "CA" || key === "CAN" || key === "CANADA") return "Canada";
  if (key === "GB" || key === "GBR" || key === "UK" || key === "UNITED KINGDOM") return "United Kingdom";
  return undefined;
}

function normalizePostal(value: Cell | undefined, country: string) {
  const raw = text(value).toUpperCase();
  if (!raw) return "";
  if (country === "United States" && /^\d{1,5}$/.test(raw)) return raw.padStart(5, "0");
  return raw;
}

function originalDealerRow(row: WorkbookRow) {
  return {
    name: row[0],
    people: row[1],
    address_1: row[2],
    address_2: row[3],
    city: row[4],
    state: row[5],
    postal_code: row[6],
    country: row[7],
    valueOfWonLeads: row[8],
  };
}

function parseIndependentRows(rows: WorkbookRow[], workbookName: string, existing: ExistingDealer[]) {
  const candidates: Candidate[] = [];
  const skipped: SkippedRow[] = [];
  const existingAddressKeys = new Map(existing.map((dealer) => [fingerprint(dealer.address_line_1, dealer.city, dealer.state_province, dealer.postal_code, dealer.country), dealer]));
  const existingNameCityKeys = new Map(existing.map((dealer) => [fingerprint(dealer.name, dealer.city, dealer.state_province, dealer.country), dealer]));
  const fileAddressKeys = new Set<string>();

  for (const [offset, row] of rows.slice(1).entries()) {
    const sourceRow = offset + 2;
    const original = originalDealerRow(row);
    const name = text(row[0]);
    const addressLine1 = text(row[2]);
    let addressLine2 = text(row[3]);
    const city = text(row[4]);
    const rawRegion = text(row[5]);
    const region = regionAliases[rawRegion] ?? rawRegion;
    const country = normalizeCountry(text(row[7]));
    const reasons: string[] = [];
    const criticalValues = [addressLine1, addressLine2, city, region, text(row[6]), text(row[7])];

    if (!name) reasons.push("dealer name is missing");
    if (criticalValues.some((value) => /[\r\n]/.test(value))) reasons.push("address columns contain shifted multiline data");
    if (!addressLine1) reasons.push("street address is missing");
    if (!city || city === ".") reasons.push("city is missing or invalid");
    if (!country) reasons.push("country is missing, contradictory, or unsupported");
    if (country && ["United States", "Canada"].includes(country) && !region) reasons.push("state or province is missing");
    if (country === "United States" && (canadianProvinceCodes.has(region) || /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(text(row[6])))) reasons.push("country conflicts with the Canadian province or postal code");
    if (name === "13 Golf LLC" && /\bBoca$/i.test(addressLine1) && /^Raton$/i.test(city)) reasons.push("Boca Raton is split between the street and city columns");

    if (country === "Canada" && !text(row[6]) && /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(addressLine2)) {
      addressLine2 = "";
    }
    const postalCode = normalizePostal(text(row[6]) || (country === "Canada" && /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(text(row[3])) ? row[3] : undefined), country ?? "");
    if (!postalCode) reasons.push("postal code is missing");

    if (reasons.length) {
      skipped.push({ sourceSheet: "DEALER", sourceRow, name: name || "Unnamed record", reason: reasons.join("; "), original });
      continue;
    }

    const addressKey = fingerprint(addressLine1, city, region, postalCode, country);
    const nameCityKey = fingerprint(name, city, region, country);
    const addressDuplicate = existingAddressKeys.get(addressKey);
    const nameCityDuplicate = existingNameCityKeys.get(nameCityKey);
    if (addressDuplicate) {
      skipped.push({ sourceSheet: "DEALER", sourceRow, name, reason: `already exists at this address as ${addressDuplicate.name} (${addressDuplicate.id})`, original });
      continue;
    }
    if (nameCityDuplicate) {
      skipped.push({ sourceSheet: "DEALER", sourceRow, name, reason: `an existing ${name} location in ${city} has different address data and requires review (${nameCityDuplicate.id})`, original });
      continue;
    }
    if (fileAddressKeys.has(addressKey)) {
      skipped.push({ sourceSheet: "DEALER", sourceRow, name, reason: "duplicates another address in the DEALER sheet", original });
      continue;
    }
    fileAddressKeys.add(addressKey);

    const normalizationNotes = [
      rawRegion !== region ? `Region normalized from ${rawRegion} to ${region}.` : "",
      !text(row[6]) && addressLine2 === "" ? "Postal code moved from address line 2 into the postal field." : "",
      "Imported from the supplied master retail location list as an unverified record; coordinates and public visibility require review.",
    ].filter(Boolean).join(" ");
    candidates.push({
      sourceSheet: "DEALER",
      sourceRow,
      original,
      mutation: {
        id: stableId(name, city, addressKey),
        name,
        location_name: name,
        address_line_1: addressLine1,
        address_line_2: addressLine2 || null,
        city,
        state_province: region || null,
        postal_code: postalCode,
        country,
        latitude: null,
        longitude: null,
        phone: null,
        website: null,
        email: null,
        dealer_type: null,
        active: true,
        notes: normalizationNotes,
        verification_status: "unverified",
        source_workbook: workbookName,
        source_sheet: "DEALER",
        source_row: sourceRow,
        source_raw_city: city,
        source_raw_region: rawRegion || null,
        enrichment_sources: [],
        coordinate_evidence: null,
        updated_at: new Date().toISOString(),
      },
    });
  }
  return { candidates, skipped };
}

function auditExistingSourceSheets(sheets: { sheet: string; data: WorkbookRow[] }[], existing: ExistingDealer[]) {
  const skipped: SkippedRow[] = [];
  for (const [sheetName, retailerName] of Object.entries(retailerSheets)) {
    const sheet = sheets.find((candidate) => candidate.sheet === sheetName);
    if (!sheet) continue;
    for (const [offset, row] of sheet.data.slice(1).entries()) {
      const city = text(row[0]);
      const region = text(row[1]);
      if (!city) continue;
      const match = existing.find((dealer) => dealer.source_sheet === sheetName && normalized(dealer.source_raw_city) === normalized(city));
      skipped.push({
        sourceSheet: sheetName,
        sourceRow: offset + 2,
        name: `${retailerName} ${city}`,
        reason: match ? `already exists (${match.id})` : "sheet lacks a street address and cannot be confidently added",
        original: { city, state: region },
      });
    }
  }
  return skipped;
}

function auditGolftec(sheet: { data: WorkbookRow[] } | undefined, existing: ExistingDealer[]) {
  if (!sheet) return [];
  return sheet.data.slice(2).flatMap((row, offset): SkippedRow[] => {
    const center = text(row[0]);
    if (!center) return [];
    const address = text(row[2]);
    const city = text(row[3]);
    const region = text(row[4]);
    const postalCode = normalizePostal(row[5], "United States");
    const match = existing.find((dealer) => fingerprint(dealer.address_line_1, dealer.city, dealer.state_province, dealer.postal_code, dealer.country) === fingerprint(address, city, region, postalCode, "United States"));
    return [{
      sourceSheet: "GOLFTEC",
      sourceRow: offset + 3,
      name: `GOLFTEC ${center}`,
      reason: match ? `already exists (${match.id})` : "not added by this independent-dealer import; requires separate GOLFTEC reconciliation",
      original: { center, address, city, state: region, postalCode },
    }];
  });
}

async function main() {
  const [workbookArg, reportArg, applyArg] = process.argv.slice(2);
  if (!workbookArg || !reportArg) throw new Error("Usage: import-master-independent-dealers.ts <master.xlsx> <report.json> [--apply]");
  const workbookPath = resolve(workbookArg);
  const reportPath = resolve(reportArg);
  const workbookName = basename(workbookPath);
  const sheets = await readXlsxFile(workbookPath) as { sheet: string; data: WorkbookRow[] }[];
  const dealerSheet = sheets.find((sheet) => sheet.sheet === "DEALER");
  if (!dealerSheet) throw new Error("The workbook does not contain a DEALER sheet.");

  const supabase = createClient(requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"), requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const columns = "id,name,address_line_1,city,state_province,postal_code,country,source_sheet,source_raw_city,source_raw_region";
  const { data, error } = await supabase.from("dealers").select(columns);
  if (error) throw new Error(`Could not load existing dealers: ${error.message}`);
  const existing = data as ExistingDealer[];

  const independent = parseIndependentRows(dealerSheet.data, workbookName, existing);
  const skipped = [
    ...auditExistingSourceSheets(sheets, existing),
    ...auditGolftec(sheets.find((sheet) => sheet.sheet === "GOLFTEC"), existing),
    ...independent.skipped,
  ];
  let added: Candidate[] = [];
  if (applyArg === "--apply" && independent.candidates.length) {
    const { error: insertError } = await supabase.from("dealers").insert(independent.candidates.map((candidate) => candidate.mutation));
    if (insertError) throw new Error(`Could not add new dealer locations: ${insertError.message}`);
    added = independent.candidates;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    workbook: workbookName,
    applied: applyArg === "--apply",
    currentDatabaseCount: existing.length,
    workbookCounts: Object.fromEntries(sheets.map((sheet) => [sheet.sheet, sheet.data.slice(sheet.sheet === "GOLFTEC" ? 2 : 1).filter((row) => row.some((cell) => text(cell))).length])),
    proposedNewCount: independent.candidates.length,
    addedCount: added.length,
    skippedCount: skipped.length,
    finalDatabaseCount: existing.length + added.length,
    added: added.map((candidate) => ({ sourceSheet: candidate.sourceSheet, sourceRow: candidate.sourceRow, proposed: candidate.mutation, original: candidate.original })),
    proposed: independent.candidates.map((candidate) => ({ sourceSheet: candidate.sourceSheet, sourceRow: candidate.sourceRow, proposed: candidate.mutation, original: candidate.original })),
    skipped,
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ applied: report.applied, currentDatabaseCount: report.currentDatabaseCount, proposedNewCount: report.proposedNewCount, addedCount: report.addedCount, skippedCount: report.skippedCount, finalDatabaseCount: report.finalDatabaseCount, reportPath }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Master dealer import failed.");
  process.exitCode = 1;
});
