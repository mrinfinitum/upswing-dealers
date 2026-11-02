import "server-only";

import { APPLICATION_SOURCE_WORKBOOK } from "@/lib/dealers/application";
import { DealerAdminDataError } from "@/lib/admin/dealers";
import { createClient } from "@/lib/supabase/server";
import type { DealerVerificationStatus } from "@/types/dealer";

export type DealerApplicationRow = {
  id: string;
  name: string;
  city: string;
  state_province: string | null;
  country: string;
  active: boolean;
  verification_status: DealerVerificationStatus;
  notes: string | null;
  created_at: string;
};

export async function listDealerApplications() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dealers")
    .select("id, name, city, state_province, country, active, verification_status, notes, created_at")
    .eq("source_workbook", APPLICATION_SOURCE_WORKBOOK)
    .order("created_at", { ascending: false });
  if (error) throw new DealerAdminDataError("Applications could not be loaded");
  return data as DealerApplicationRow[];
}

export async function countPendingDealerApplications() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("dealers")
    .select("id", { count: "exact", head: true })
    .eq("source_workbook", APPLICATION_SOURCE_WORKBOOK)
    .eq("verification_status", "needs-review");
  return error ? 0 : count ?? 0;
}
