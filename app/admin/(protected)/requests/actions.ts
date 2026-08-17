"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function resolveDealerRequestAction(requestId: string, status: "approved" | "rejected", formData: FormData) {
  const admin = await requireAdmin();
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim();
  const supabase = await createClient();
  await supabase.from("dealer_location_change_requests").update({
    status,
    review_notes: reviewNotes || null,
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", requestId).eq("status", "pending");
  revalidatePath("/admin/requests");
}
