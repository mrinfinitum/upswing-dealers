"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getManagedDealer } from "@/lib/admin/dealers";
import { dealerToMutation } from "@/lib/dealers/supabase-mapper";
import { createClient } from "@/lib/supabase/server";
import type { Dealer, DealerVerificationStatus } from "@/types/dealer";
import type { AdminFormState } from "@/lib/admin/form-state";
import { applyAutomaticCoordinates } from "@/lib/dealers/geocode-form";
import { safeAdminReturnPath } from "@/lib/admin/return-path";

const statuses: DealerVerificationStatus[] = ["unverified", "needs-review", "verified", "rejected"];
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const optionalText = (formData: FormData, key: string) => text(formData, key) || undefined;

function parseDealerForm(formData: FormData, existing?: Dealer) {
  const errors: Record<string, string> = {};
  const name = text(formData, "name");
  const city = text(formData, "city");
  const country = text(formData, "country");
  const verificationStatus = text(formData, "verificationStatus") as DealerVerificationStatus;
  const addressLine1 = text(formData, "addressLine1");
  const website = optionalText(formData, "website");
  const email = optionalText(formData, "email");

  if (!name) errors.name = "Dealer name is required.";
  if (!addressLine1) errors.addressLine1 = "Street address is required for automatic map placement.";
  if (!city) errors.city = "City is required.";
  if (!country) errors.country = "Country is required.";
  if (!statuses.includes(verificationStatus)) errors.verificationStatus = "Choose a valid status.";
  if (website) {
    try {
      const parsed = new URL(website);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      errors.website = "Enter a complete http or https URL.";
    }
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address.";

  const dealer: Dealer = {
    id: existing?.id ?? crypto.randomUUID(),
    name,
    locationName: optionalText(formData, "locationName"),
    addressLine1: addressLine1 || undefined,
    addressLine2: optionalText(formData, "addressLine2"),
    city,
    stateProvince: optionalText(formData, "stateProvince"),
    postalCode: optionalText(formData, "postalCode"),
    country,
    coordinates: existing?.coordinates,
    coordinateEvidence: existing?.coordinateEvidence,
    phone: optionalText(formData, "phone"),
    website,
    email,
    active: formData.get("active") === "on",
    notes: optionalText(formData, "notes"),
    verificationStatus,
    enrichmentSources: existing?.enrichmentSources,
    source: existing?.source ?? {
      workbook: "Admin",
      sheet: "Admin",
      row: 0,
      rawCity: city,
      rawRegion: optionalText(formData, "stateProvince"),
    },
  };

  return { dealer, errors };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createLocationAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const { dealer, errors } = parseDealerForm(formData);
  if (Object.keys(errors).length) return { message: "Review the highlighted fields.", fieldErrors: errors };
  const geocodeError = applyAutomaticCoordinates(dealer, formData);
  if (geocodeError) return geocodeError;

  const supabase = await createClient();
  const { error } = await supabase.from("dealers").insert(dealerToMutation(dealer));
  if (error) return { message: "The location could not be created. Check database setup and try again." };
  revalidatePath("/");
  revalidatePath("/admin/locations");
  redirect(`/admin/locations/${encodeURIComponent(dealer.id)}?saved=created`);
}

export async function updateLocationAction(id: string, _: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const existing = await getManagedDealer(id);
  if (!existing) return { message: "This location no longer exists." };
  const { dealer, errors } = parseDealerForm(formData, existing);
  if (Object.keys(errors).length) return { message: "Review the highlighted fields.", fieldErrors: errors };
  const geocodeError = applyAutomaticCoordinates(dealer, formData, existing);
  if (geocodeError) return geocodeError;

  const supabase = await createClient();
  const { error } = await supabase.from("dealers").update(dealerToMutation(dealer)).eq("id", id);
  if (error) return { message: "The location could not be saved. Try again." };
  revalidatePath("/");
  revalidatePath("/admin/locations");
  revalidatePath(`/admin/locations/${id}`);
  const returnTo = safeAdminReturnPath(text(formData, "returnTo"));
  const query = new URLSearchParams({ saved: "updated", returnTo });
  redirect(`/admin/locations/${encodeURIComponent(id)}?${query.toString()}`);
}

export async function deleteLocationAction(id: string, returnPath: string) {
  await requireAdmin();
  const returnTo = safeAdminReturnPath(returnPath);
  const supabase = await createClient();
  const { error } = await supabase.from("dealers").delete().eq("id", id);
  if (error) redirect(`/admin/locations/${encodeURIComponent(id)}?error=delete&returnTo=${encodeURIComponent(returnTo)}`);
  revalidatePath("/");
  revalidatePath("/admin/locations");
  revalidatePath("/admin/dealers");
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}deleted=1`);
}
