import type { Dealer } from "@/types/dealer";
import { normalizeDealerRows } from "./normalize";
import { rawDealerRows } from "./source";
import { applyVerifiedEnrichments } from "./enrichment";
import { dealerEnrichmentProposals } from "./enrichment-proposals";
import { applyVerifiedGoogleCoordinates } from "./coordinates";
import { googleBrowserGeocodeBatch } from "./google-geocodes";
import { createClient } from "@supabase/supabase-js";
import { hasSupabasePublicConfig, getSupabasePublicConfig } from "@/lib/supabase/config";
import { publicDealerRowToDealer, type PublicDealerRow } from "./supabase-mapper";

export interface DealerRepository {
  getAll(): Promise<Dealer[]>;
}

export class WorkbookDealerRepository implements DealerRepository {
  async getAll() {
    const { dealers } = normalizeDealerRows(rawDealerRows);
    const enriched = applyVerifiedEnrichments(dealers, dealerEnrichmentProposals).dealers;
    return applyVerifiedGoogleCoordinates(enriched, googleBrowserGeocodeBatch)
      .filter((dealer) => dealer.active !== false && dealer.verificationStatus === "verified");
  }
}

export class SupabaseDealerRepository implements DealerRepository {
  async getAll() {
    const { url, publishableKey } = getSupabasePublicConfig();
    const supabase = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("dealers")
      .select("id,name,location_name,address_line_1,address_line_2,city,state_province,postal_code,country,latitude,longitude,phone,website,email,dealer_type,active,verification_status")
      .eq("active", true)
      .eq("verification_status", "verified")
      .order("name")
      .order("city");

    if (error) throw new Error(`Supabase dealer query failed (${error.code}).`);
    return (data as PublicDealerRow[]).map(publicDealerRowToDealer);
  }
}

class ResilientDealerRepository implements DealerRepository {
  private readonly workbook = new WorkbookDealerRepository();
  private readonly supabase = new SupabaseDealerRepository();

  async getAll() {
    if (!hasSupabasePublicConfig()) return this.workbook.getAll();
    try {
      return await this.supabase.getAll();
    } catch (error) {
      console.warn(error instanceof Error ? error.message : "Supabase dealer query failed.");
      return this.workbook.getAll();
    }
  }
}

export const dealerRepository: DealerRepository = new ResilientDealerRepository();
