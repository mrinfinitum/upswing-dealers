"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireDealerPortal } from "@/lib/portal/auth";
import { getDealerPortalLocations } from "@/lib/portal/data";
import { createClient } from "@/lib/supabase/server";
import type { PortalFormState } from "@/lib/portal/form-state";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function dealerLoginAction(_: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const email = text(formData, "email");
  const password = text(formData, "password");
  if (!email || !password) return { message: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { message: "The email or password was not accepted." };

  const { data: claimsData } = await supabase.auth.getClaims();
  if (claimsData?.claims?.app_metadata?.role !== "dealer") {
    await supabase.auth.signOut();
    return { message: "This account does not have dealer portal access." };
  }

  const { data: profile } = await supabase
    .from("dealer_portal_users")
    .select("active")
    .eq("user_id", claimsData.claims.sub)
    .eq("active", true)
    .maybeSingle();
  const { count } = await supabase
    .from("dealer_memberships")
    .select("organization_id", { count: "exact", head: true })
    .eq("user_id", claimsData.claims.sub)
    .eq("active", true);

  if (!profile || !count) {
    await supabase.auth.signOut();
    return { message: "Your dealer access is inactive or has not been assigned." };
  }

  redirect("/partner");
}

export async function dealerLogoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/partner/login");
}

export async function submitLocationChangeRequestAction(dealerId: string, formData: FormData) {
  const identity = await requireDealerPortal("locations");
  const locations = await getDealerPortalLocations();
  const location = locations.find((candidate) => candidate.dealerId === dealerId);
  if (!location) redirect("/partner/locations?error=not-assigned");

  const allowedFields = [
    "locationName", "addressLine1", "addressLine2", "city", "stateProvince",
    "postalCode", "country", "phone", "website", "email",
  ] as const;
  const proposedChanges: Record<string, string | null> = {};
  for (const key of allowedFields) {
    const value = text(formData, key);
    const current = location[key] ?? "";
    if (value !== current) proposedChanges[key] = value || null;
  }

  if (!Object.keys(proposedChanges).length) redirect(`/partner/locations/${encodeURIComponent(dealerId)}?unchanged=1`);
  const website = proposedChanges.website;
  if (website) {
    try {
      const parsed = new URL(website);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      redirect(`/partner/locations/${encodeURIComponent(dealerId)}?error=website`);
    }
  }
  const email = proposedChanges.email;
  if (email && !/^\S+@\S+\.\S+$/.test(email)) redirect(`/partner/locations/${encodeURIComponent(dealerId)}?error=email`);

  const supabase = await createClient();
  const { error } = await supabase.from("dealer_location_change_requests").insert({
    dealer_id: dealerId,
    organization_id: location.organizationId,
    requested_by: identity.id,
    proposed_changes: proposedChanges,
  });
  if (error) redirect(`/partner/locations/${encodeURIComponent(dealerId)}?error=save`);
  revalidatePath(`/partner/locations/${dealerId}`);
  redirect(`/partner/locations/${encodeURIComponent(dealerId)}?submitted=1`);
}
