"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getManagedDealer } from "@/lib/admin/dealers";
import { dealerToMutation } from "@/lib/dealers/supabase-mapper";
import { createClient } from "@/lib/supabase/server";
import type { Dealer, DealerVerificationStatus } from "@/types/dealer";
import type { AdminFormState } from "@/lib/admin/form-state";
import { dealerAddressFingerprint } from "@/lib/geo/address";
import { reviewGeocodeCandidate, type GeocodeCandidate } from "@/lib/geo/geocode-review";
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

function parseGeocodeCandidates(formData: FormData): GeocodeCandidate[] {
  const raw = text(formData, "geocodeCandidates");
  if (!raw || raw.length > 100_000) return [];
  try {
    const candidates = JSON.parse(raw) as unknown;
    if (!Array.isArray(candidates) || candidates.length > 10) return [];
    return candidates.filter((candidate): candidate is GeocodeCandidate => {
      if (!candidate || typeof candidate !== "object") return false;
      const item = candidate as Partial<GeocodeCandidate>;
      return Boolean(
        item.coordinates
        && Number.isFinite(item.coordinates.latitude)
        && item.coordinates.latitude >= -90
        && item.coordinates.latitude <= 90
        && Number.isFinite(item.coordinates.longitude)
        && item.coordinates.longitude >= -180
        && item.coordinates.longitude <= 180
        && typeof item.formattedAddress === "string"
        && Array.isArray(item.resultTypes)
        && typeof item.locationType === "string"
        && Array.isArray(item.addressComponents),
      );
    });
  } catch {
    return [];
  }
}

function applyAutomaticCoordinates(dealer: Dealer, formData: FormData, existing?: Dealer): AdminFormState | null {
  const addressChanged = !existing || dealerAddressFingerprint(dealer) !== dealerAddressFingerprint(existing);
  if (!addressChanged && existing?.coordinates) return null;

  const reviewed = parseGeocodeCandidates(formData).map((candidate) => ({
    candidate,
    review: reviewGeocodeCandidate(dealer, candidate),
  }));
  const verified = reviewed.filter(({ review }) => review.status === "verified");
  if (verified.length !== 1) {
    return {
      message: verified.length > 1
        ? "Google returned multiple precise matches. Add more address detail and try again."
        : "The address did not produce one unambiguous precise match. Review the address and postal code.",
      fieldErrors: { addressLine1: "A unique, precise Google address match is required." },
    };
  }

  const { candidate } = verified[0];
  dealer.coordinates = candidate.coordinates;
  dealer.coordinateEvidence = {
    source: "google-maps-js-geocoder",
    retrievedAt: new Date().toISOString(),
    formattedAddress: candidate.formattedAddress,
    resultTypes: candidate.resultTypes,
    locationType: candidate.locationType,
    verificationStatus: "verified",
    discrepancies: [],
  };
  return null;
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
  redirect("/admin");
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

export async function deleteLocationAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("dealers").delete().eq("id", id);
  if (error) redirect(`/admin/locations/${encodeURIComponent(id)}?error=delete`);
  revalidatePath("/");
  revalidatePath("/admin/locations");
  redirect("/admin/locations?deleted=1");
}
