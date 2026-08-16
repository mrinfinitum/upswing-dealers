import { applyVerifiedEnrichments } from "../lib/dealers/enrichment";
import { dealerEnrichmentProposals } from "../lib/dealers/enrichment-proposals";
import { normalizeDealerRows } from "../lib/dealers/normalize";
import { rawDealerRows } from "../lib/dealers/source";

const { dealers } = normalizeDealerRows(rawDealerRows);
const enriched = applyVerifiedEnrichments(dealers, dealerEnrichmentProposals).dealers;

const pending = enriched
  .filter((dealer) => dealer.verificationStatus === "verified" && !dealer.coordinates)
  .map((dealer) => ({
    dealerId: dealer.id,
    address: [
      dealer.addressLine1,
      dealer.addressLine2,
      dealer.city,
      dealer.stateProvince,
      dealer.postalCode,
      dealer.country,
    ].filter(Boolean).join(", "),
  }));

if (pending.length !== 67) {
  throw new Error(`Expected 67 verified dealers pending coordinates; found ${pending.length}.`);
}

process.stdout.write(JSON.stringify(pending));
