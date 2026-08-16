"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getManagedDealer } from "@/lib/admin/dealers";
import { dealerToMutation } from "@/lib/dealers/supabase-mapper";
import { createClient } from "@/lib/supabase/server";
import type { Dealer, DealerVerificationStatus } from "@/types/dealer";
import type { AdminFormState } from "@/lib/admin/form-state";

const statuses: DealerVerificationStatus[] = ["unverified", "needs-review", "verified", "rejected"];
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const optionalText = (formData: FormData, key: string) => text(formData, key) || undefined;

function parseNumber(value: string, field: string, min: number, max: number, errors: Record<string, string>) {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    errors[field] = `Enter a number from ${min} to ${max}.`;
    return undefined;
  }
  return parsed;
}

function parseDealerForm(formData: FormData, existing?: Dealer) {
  const errors: Record<string, string> = {};
  const name = text(formData, "name");
  const city = text(formData, "city");
  const country = text(formData, "country");
  const verificationStatus = text(formData, "verificationStatus") as DealerVerificationStatus;
  const latitude = parseNumber(text(formData, "latitude"), "latitude", -90, 90, errors);
  const longitude = parseNumber(text(formData, "longitude"), "longitude", -180, 180, errors);
  const website = optionalText(formData, "website");
  const email = optionalText(formData, "email");

  if (!name) errors.name = "Dealer name is required.";
  if (!city) errors.city = "City is required.";
  if (!country) errors.country = "Country is required.";
  if (!statuses.includes(verificationStatus)) errors.verificationStatus = "Choose a valid status.";
  if ((latitude === undefined) !== (longitude === undefined)) {
    errors.latitude = "Latitude and longitude must be supplied together.";
    errors.longitude = "Latitude and longitude must be supplied together.";
  }
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
    addressLine1: optionalText(formData, "addressLine1"),
    addressLine2: optionalText(formData, "addressLine2"),
    city,
    stateProvince: optionalText(formData, "stateProvince"),
    postalCode: optionalText(formData, "postalCode"),
    country,
    coordinates: latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined,
    coordinateEvidence: existing?.coordinateEvidence,
    phone: optionalText(formData, "phone"),
    website,
    email,
    dealerType: optionalText(formData, "dealerType"),
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

export async function loginAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const email = text(formData, "email");
  const password = text(formData, "password");
  if (!email || !password) return { message: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { message: "The email or password was not accepted." };

  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.app_metadata?.role !== "admin") {
    await supabase.auth.signOut();
    return { message: "This account does not have dealer administrator access." };
  }
  redirect("/admin/locations");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createLocationAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const { dealer, errors } = parseDealerForm(formData);
  if (Object.keys(errors).length) return { message: "Review the highlighted fields.", fieldErrors: errors };

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

  const supabase = await createClient();
  const { error } = await supabase.from("dealers").update(dealerToMutation(dealer)).eq("id", id);
  if (error) return { message: "The location could not be saved. Try again." };
  revalidatePath("/");
  revalidatePath("/admin/locations");
  revalidatePath(`/admin/locations/${id}`);
  redirect(`/admin/locations/${encodeURIComponent(id)}?saved=updated`);
}

export async function deleteLocationAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("dealers").delete().eq("id", id);
  if (error) redirect(`/admin/locations/${encodeURIComponent(id)}?error=delete`);
  revalidatePath("/");
  revalidatePath("/admin/locations");
  redirect("/admin/locations?deleted=1");
}
