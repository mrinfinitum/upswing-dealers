import type { Dealer } from "@/types/dealer";
import type { RawDealerRow } from "./source";

export type NormalizationIssue = {
  severity: "warning" | "error";
  sourceSheet: string;
  sourceRow: number;
  message: string;
};

export type DealerImportResult = {
  dealers: Dealer[];
  issues: NormalizationIssue[];
};

const dealerNames: Record<RawDealerRow["sourceSheet"], string> = {
  PGATSS: "PGA TOUR Superstore",
  SCHEELS: "SCHEELS",
  "CLUB CHAMPION": "Club Champion",
};

const internationalCodes = {
  AUS: "Australia",
  CAN: "Canada",
  UK: "United Kingdom",
} as const;

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function normalizeDealerRows(rows: RawDealerRow[]): DealerImportResult {
  const issues: NormalizationIssue[] = [];
  const dealers = rows.map((row) => {
    const rawCity = row.city;
    const rawRegion = row.region?.trim();
    let city = rawCity.trim();
    let country = "United States";
    let stateProvince = rawRegion;
    let notes: string | undefined;

    const countryMatch = city.match(/\s(AUS|CAN|UK)$/);
    if (countryMatch) {
      const countryCode = countryMatch[1] as keyof typeof internationalCodes;
      country = internationalCodes[countryCode];
      city = city.replace(/\s(AUS|CAN|UK)$/, "");
      stateProvince = undefined;
      issues.push({
        severity: "warning",
        sourceSheet: row.sourceSheet,
        sourceRow: row.sourceRow,
        message: `${city}, ${country} has no state/province in the source workbook.`,
      });
    }

    if (city === "Greenwodd Village") {
      city = "Greenwood Village";
      notes = 'Source city normalized from "Greenwodd Village".';
      issues.push({
        severity: "warning",
        sourceSheet: row.sourceSheet,
        sourceRow: row.sourceRow,
        message: 'Corrected likely typo "Greenwodd Village" to "Greenwood Village".',
      });
    }

    const name = dealerNames[row.sourceSheet];
    const idParts = [name, city, stateProvince, country].filter(Boolean).join("-");
    return {
      id: slugify(idParts),
      name,
      city,
      ...(stateProvince ? { stateProvince } : {}),
      country,
      ...(notes ? { notes } : {}),
      source: {
        workbook: "MASTER RETAIL LOCATION LIST.xlsx",
        sheet: row.sourceSheet,
        row: row.sourceRow,
        rawCity,
        ...(row.region ? { rawRegion: row.region } : {}),
      },
    } satisfies Dealer;
  });
  return { dealers, issues };
}
