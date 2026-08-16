import "server-only";

import { createClient } from "@/lib/supabase/server";
import { dealerRowToDealer, type DealerRow } from "@/lib/dealers/supabase-mapper";

export class DealerAdminDataError extends Error {}

export async function listManagedDealers(query = "") {
  const supabase = await createClient();
  let request = supabase.from("dealers").select("*").order("name").order("city");
  const safeQuery = query.trim().replaceAll(/[,%()]/g, " ");

  if (safeQuery) {
    request = request.or(
      `name.ilike.%${safeQuery}%,location_name.ilike.%${safeQuery}%,city.ilike.%${safeQuery}%,state_province.ilike.%${safeQuery}%,country.ilike.%${safeQuery}%`,
    );
  }

  const { data, error } = await request;
  if (error) throw new DealerAdminDataError(error.code === "PGRST205" ? "Database setup required" : "Locations could not be loaded");
  return (data as DealerRow[]).map(dealerRowToDealer);
}

export async function getManagedDealer(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("dealers").select("*").eq("id", id).maybeSingle();
  if (error) throw new DealerAdminDataError(error.code === "PGRST205" ? "Database setup required" : "Location could not be loaded");
  return data ? dealerRowToDealer(data as DealerRow) : null;
}
