import { createClient } from "@supabase/supabase-js";
import { applyVerifiedGoogleCoordinates } from "../lib/dealers/coordinates";
import { dealerEnrichmentProposals } from "../lib/dealers/enrichment-proposals";
import { applyVerifiedEnrichments } from "../lib/dealers/enrichment";
import { googleBrowserGeocodeBatch } from "../lib/dealers/google-geocodes";
import { normalizeDealerRows } from "../lib/dealers/normalize";
import { rawDealerRows } from "../lib/dealers/source";
import { dealerToMutation } from "../lib/dealers/supabase-mapper";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase URL and service-role key are required.");

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { dealers: normalized } = normalizeDealerRows(rawDealerRows);
  const enriched = applyVerifiedEnrichments(normalized, dealerEnrichmentProposals).dealers;
  const dealers = applyVerifiedGoogleCoordinates(enriched, googleBrowserGeocodeBatch);

  if (dealers.length !== 71) throw new Error(`Import aborted: expected 71 source records, received ${dealers.length}.`);
  const preston = dealers.find((dealer) => dealer.city === "Preston" && dealer.stateProvince === "WA");
  if (!preston || preston.verificationStatus === "verified") {
    throw new Error("Import aborted: Preston, WA must remain excluded from verified public behavior.");
  }

  const rows = dealers.map(dealerToMutation);
  for (let index = 0; index < rows.length; index += 25) {
    const { error } = await supabase.from("dealers").upsert(rows.slice(index, index + 25), { onConflict: "id" });
    if (error) throw new Error(`Dealer import failed (${error.code}).`);
  }

  const verified = dealers.filter((dealer) => dealer.active !== false && dealer.verificationStatus === "verified").length;
  console.log(`Imported ${dealers.length} source records (${verified} verified/public; Preston excluded).`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Dealer import failed.");
  process.exitCode = 1;
});
