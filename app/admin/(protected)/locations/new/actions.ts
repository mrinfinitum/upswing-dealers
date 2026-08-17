"use server";

import { revalidatePath } from "next/cache";
import { readSheet } from "read-excel-file/node";
import { requireAdmin } from "@/lib/admin/auth";
import type { BatchImportState } from "@/lib/admin/batch-import-state";
import { dealerToMutation } from "@/lib/dealers/supabase-mapper";
import { createClient } from "@/lib/supabase/server";
import type { Dealer } from "@/types/dealer";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 500;
const requiredColumns = ["dealer_name", "address_line_1", "city", "country"] as const;

type Cell = string | number | boolean | Date | null;
type Row = Cell[];

function parseCsv(source: string): Row[] {
  const rows: Row[] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted && character === '"' && source[index + 1] === '"') { value += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (!quoted && character === ",") { row.push(value); value = ""; continue; }
    if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(value); rows.push(row); row = []; value = ""; continue;
    }
    value += character;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows.filter((candidate) => candidate.some((cell) => String(cell).trim()));
}

function normalizedHeader(value: Cell) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function cellText(row: Row, headers: Map<string, number>, name: string) {
  const index = headers.get(name);
  if (index === undefined) return "";
  const value = row[index];
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "").trim();
}

function parseActive(value: string) {
  if (!value) return true;
  return !["false", "no", "0", "inactive"].includes(value.toLowerCase());
}

function fingerprint(parts: Array<string | undefined>) {
  return parts.map((part) => (part || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")).join("|");
}

export async function importDealerBatchAction(_: BatchImportState, formData: FormData): Promise<BatchImportState> {
  await requireAdmin();
  const upload = formData.get("dealerFile");
  if (!(upload instanceof File) || upload.size === 0) return { message: "Choose a CSV or XLSX file." };
  if (upload.size > MAX_FILE_BYTES) return { message: "The upload exceeds the 4 MB limit." };

  const extension = upload.name.toLowerCase().split(".").pop();
  if (extension === "xls") return { message: "Legacy .xls files are not accepted securely. Save the workbook as .xlsx or CSV and upload it again." };
  if (extension !== "csv" && extension !== "xlsx") return { message: "Use a .csv or .xlsx file." };

  let rows: Row[];
  try {
    const bytes = Buffer.from(await upload.arrayBuffer());
    rows = extension === "csv" ? parseCsv(bytes.toString("utf8").replace(/^\uFEFF/, "")) : await readSheet(bytes) as Row[];
  } catch {
    return { message: "The file could not be read. Confirm that it is a valid CSV or XLSX workbook." };
  }

  if (rows.length < 2) return { message: "The file must contain a header row and at least one dealer location." };
  if (rows.length - 1 > MAX_ROWS) return { message: `A batch can contain at most ${MAX_ROWS} locations.` };

  const headers = new Map(rows[0].map((header, index) => [normalizedHeader(header), index]));
  const missing = requiredColumns.filter((column) => !headers.has(column));
  if (missing.length) return { message: `Missing required columns: ${missing.join(", ")}. Download the template and keep its header names.` };

  const errors: string[] = [];
  const dealers: Dealer[] = [];
  const fileFingerprints = new Set<string>();
  for (const [offset, row] of rows.slice(1).entries()) {
    const rowNumber = offset + 2;
    const name = cellText(row, headers, "dealer_name");
    const addressLine1 = cellText(row, headers, "address_line_1");
    const city = cellText(row, headers, "city");
    const country = cellText(row, headers, "country");
    const stateProvince = cellText(row, headers, "state_province") || undefined;
    const postalCode = cellText(row, headers, "postal_code") || undefined;
    const website = cellText(row, headers, "website") || undefined;
    const email = cellText(row, headers, "email") || undefined;
    const rowErrors: string[] = [];
    if (!name) rowErrors.push("dealer_name is required");
    if (!addressLine1) rowErrors.push("address_line_1 is required");
    if (!city) rowErrors.push("city is required");
    if (!country) rowErrors.push("country is required");
    if (email && !/^\S+@\S+\.\S+$/.test(email)) rowErrors.push("email is invalid");
    if (website) {
      try { const url = new URL(website); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { rowErrors.push("website must be a complete http or https URL"); }
    }
    const rowFingerprint = fingerprint([name, addressLine1, city, stateProvince, postalCode, country]);
    if (fileFingerprints.has(rowFingerprint)) rowErrors.push("duplicates another row in this file");
    fileFingerprints.add(rowFingerprint);
    if (rowErrors.length) { errors.push(`Row ${rowNumber}: ${rowErrors.join("; ")}.`); continue; }

    dealers.push({
      id: crypto.randomUUID(),
      name,
      locationName: cellText(row, headers, "location_name") || undefined,
      addressLine1,
      addressLine2: cellText(row, headers, "address_line_2") || undefined,
      city,
      stateProvince,
      postalCode,
      country,
      phone: cellText(row, headers, "phone") || undefined,
      website,
      email,
      dealerType: cellText(row, headers, "dealer_type") || undefined,
      active: parseActive(cellText(row, headers, "active")),
      notes: cellText(row, headers, "notes") || undefined,
      verificationStatus: "unverified",
      source: { workbook: upload.name, sheet: extension === "csv" ? "CSV upload" : "XLSX upload", row: rowNumber, rawCity: city, rawRegion: stateProvince },
    });
  }
  if (errors.length) return { message: `Nothing was imported. Fix ${errors.length} invalid ${errors.length === 1 ? "row" : "rows"} and upload the complete file again.`, errors: errors.slice(0, 25) };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase.from("dealers").select("name, address_line_1, city, state_province, postal_code, country");
  if (existingError) return { message: "Existing dealer locations could not be checked for duplicates." };
  const existingFingerprints = new Set((existing || []).map((row) => fingerprint([row.name, row.address_line_1, row.city, row.state_province, row.postal_code, row.country])));
  const duplicates = dealers.map((dealer, index) => existingFingerprints.has(fingerprint([dealer.name, dealer.addressLine1, dealer.city, dealer.stateProvince, dealer.postalCode, dealer.country])) ? `Row ${index + 2}: this dealer address already exists.` : "").filter(Boolean);
  if (duplicates.length) return { message: "Nothing was imported because existing dealer locations were detected.", errors: duplicates.slice(0, 25) };

  const { error } = await supabase.from("dealers").insert(dealers.map(dealerToMutation));
  if (error) return { message: "The batch could not be imported. No locations were added." };
  revalidatePath("/");
  revalidatePath("/admin/dealers");
  revalidatePath("/admin/locations");
  return { success: true, imported: dealers.length, message: `${dealers.length} ${dealers.length === 1 ? "location was" : "locations were"} imported as unverified records.` };
}
