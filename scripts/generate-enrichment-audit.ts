import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { dealerEnrichmentProposals } from "../lib/dealers/enrichment-proposals";
import { validateEnrichmentProposals } from "../lib/dealers/enrichment";
import { normalizeDealerRows } from "../lib/dealers/normalize";
import { rawDealerRows } from "../lib/dealers/source";

const { dealers, issues: normalizationIssues } = normalizeDealerRows(rawDealerRows);
const validationIssues = validateEnrichmentProposals(dealers, dealerEnrichmentProposals);

if (validationIssues.length) {
  throw new Error(`Enrichment validation failed:\n${validationIssues.join("\n")}`);
}

const byDealer = new Map(dealerEnrichmentProposals.map((proposal) => [proposal.dealerId, proposal]));
const counts = { verified: 0, "needs-review": 0, unverified: 0, rejected: 0 };
const coverage = new Map<string, { total: number; sourced: number; verified: number; coordinates: number }>();
let coordinateCount = 0;

const cell = (value: unknown) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
const address = (proposal: (typeof dealerEnrichmentProposals)[number] | undefined) => {
  const value = proposal?.proposed;
  if (!value) return "—";
  return [value.addressLine1, value.addressLine2, value.city, value.stateProvince, value.country]
    .filter(Boolean).join(", ") || "—";
};

const sections = dealers.map((dealer) => {
  const proposal = byDealer.get(dealer.id);
  const status = proposal?.verificationStatus ?? "unverified";
  counts[status] += 1;
  const retailer = dealer.source.sheet;
  const retailerCoverage = coverage.get(retailer) ?? { total: 0, sourced: 0, verified: 0, coordinates: 0 };
  retailerCoverage.total += 1;
  if (proposal?.sources.length) retailerCoverage.sourced += 1;
  if (status === "verified") retailerCoverage.verified += 1;
  if (proposal?.proposed.latitude !== undefined && proposal.proposed.longitude !== undefined) {
    coordinateCount += 1;
    retailerCoverage.coordinates += 1;
  }
  coverage.set(retailer, retailerCoverage);
  const source = proposal?.sources.length
    ? proposal.sources.map((item) => `[${item.label}](${item.url}) — retrieved ${item.retrievedAt}; fields: ${item.fields.join(", ") || "none"}`).join("<br>")
    : "No enrichment source recorded.";
  const discrepancies = proposal?.discrepancies.length
    ? proposal.discrepancies.map((item) => `- ${item}`).join("\n")
    : "- None recorded."

  return `## ${dealer.name} — ${dealer.city}${dealer.stateProvince ? `, ${dealer.stateProvince}` : `, ${dealer.country}`}

| Field | Value |
| --- | --- |
| Source dealer ID | \`${dealer.id}\` |
| Retailer | ${cell(dealer.name)} |
| Original city / state / country | ${cell(`${dealer.source.rawCity}${dealer.source.rawRegion ? ` / ${dealer.source.rawRegion}` : ""} / ${dealer.country}`)} |
| Original workbook provenance | ${cell(`${dealer.source.workbook}; ${dealer.source.sheet}; row ${dealer.source.row}`)} |
| Proposed canonical name | ${cell(proposal?.proposed.canonicalLocationName)} |
| Proposed address | ${cell(address(proposal))} |
| Postal code | ${cell(proposal?.proposed.postalCode)} |
| Phone | ${cell(proposal?.proposed.phone)} |
| Website | ${proposal?.proposed.website ? `[${cell(proposal.proposed.website)}](${proposal.proposed.website})` : "—"} |
| Latitude / longitude | ${proposal?.proposed.latitude !== undefined ? `${proposal.proposed.latitude}, ${proposal.proposed.longitude}` : "—"} |
| Verification status | **${status}** |
| Confidence | **${proposal?.confidence ?? "not assessed"}** |
| Source/reference | ${source} |

Discrepancies:

${discrepancies}
`;
});

const coverageRows = [...coverage.entries()].map(([retailer, value]) =>
  `| ${retailer} | ${value.total} | ${value.sourced} | ${value.verified} | ${value.coordinates} |`,
).join("\n");

const report = `# Dealer Enrichment Audit

Generated: ${new Date().toISOString()}

This report preserves all ${dealers.length} normalized records from \`MASTER RETAIL LOCATION LIST.xlsx\`. A proposal is merged into the application only when its status is \`verified\`. \`needs-review\`, \`unverified\`, and \`rejected\` records are never selected automatically.

## Summary

| Status | Records |
| --- | ---: |
| Verified | ${counts.verified} |
| Needs review | ${counts["needs-review"]} |
| Unverified | ${counts.unverified} |
| Rejected | ${counts.rejected} |
| Total | ${dealers.length} |
| Verified coordinates | ${coordinateCount} |

## Source coverage by retailer

| Retailer sheet | Source records | Authoritatively sourced | Verified | Verified coordinates |
| --- | ---: | ---: | ---: | ---: |
${coverageRows}

## Review findings

- **Preston, WA:** no matching PGA TOUR Superstore appears in the official directory. The record remains \`needs-review\`; no candidate data was selected.
- **Woodlands / Shenandoah, TX:** resolved to the official PGA TOUR Superstore named Woodlands at a Shenandoah postal address. The store-name/municipality difference is retained below.
- **Greenwood Village, CO:** the workbook spelling \`Greenwodd Village\` is retained in provenance; the official spelling is proposed in the overlay.
- **International regions:** NSW, QLD, VIC, Ontario, and Hampshire were added only where the retailer's country-specific official page supplied them.
- **Basingstoke, UK:** official pages conflict on postcode/spelling; the dedicated location page and contact address support \`RG24 9NP\` and \`Priestley Road\`. The conflict remains visible below.
- **Austin, TX:** the official Club Champion page contains one inconsistent \`Agoura Hills\` heading while its title, address, and location content identify Austin. The discrepancy remains visible below.
- No authoritative source reviewed in this pass identified a matched record as permanently closed, relocated, or duplicated. Virginia Beach displayed a one-day closure notice, not a permanent closure.

Normalization warnings retained from Phase 1: ${normalizationIssues.length}.

${sections.join("\n")}`;

const output = resolve(process.cwd(), "reports/dealer-enrichment-audit.md");
writeFileSync(output, report);
console.log(`Wrote ${output}`);
console.log(JSON.stringify(counts));
