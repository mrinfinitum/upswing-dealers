"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { applyAutomaticCoordinates } from "@/lib/dealers/geocode-form";
import { dealerRowToDealer, dealerToMutation, type DealerRow } from "@/lib/dealers/supabase-mapper";
import { sendDealerLocationChangeEmail, type LocationChange } from "@/lib/email/dealer-location-change";
import { requireDealerPortal } from "@/lib/portal/auth";
import type { PortalFormState } from "@/lib/portal/form-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Dealer } from "@/types/dealer";
import type { DealerPortalIdentity } from "@/types/portal";

export type DealerLocationFormState = PortalFormState & { fieldErrors?: Record<string, string> };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim().slice(0, 300);
const optional = (formData: FormData, key: string) => text(formData, key) || undefined;

const editableFields = [
  ["locationName", "Location name"],
  ["addressLine1", "Address line 1"],
  ["addressLine2", "Address line 2"],
  ["city", "City"],
  ["stateProvince", "State / province"],
  ["postalCode", "ZIP / postal code"],
  ["country", "Country"],
  ["phone", "Phone"],
  ["website", "Website"],
  ["email", "Email"],
] as const satisfies ReadonlyArray<readonly [keyof Dealer, string]>;

type EditableValues = Pick<Dealer, (typeof editableFields)[number][0]>;

function parseLocationForm(formData: FormData) {
  const errors: Record<string, string> = {};
  const values: EditableValues = {
    locationName: optional(formData, "locationName"),
    addressLine1: optional(formData, "addressLine1"),
    addressLine2: optional(formData, "addressLine2"),
    city: text(formData, "city"),
    stateProvince: optional(formData, "stateProvince"),
    postalCode: optional(formData, "postalCode"),
    country: text(formData, "country"),
    phone: optional(formData, "phone"),
    website: optional(formData, "website"),
    email: optional(formData, "email"),
  };
  if (!values.addressLine1) errors.addressLine1 = "Street address is required so the location can be placed on the map.";
  if (!values.city) errors.city = "City is required.";
  if (!values.country) errors.country = "Country is required.";
  if (values.website) {
    try {
      const url = new URL(/^https?:\/\//i.test(values.website) ? values.website : `https://${values.website}`);
      if (!url.hostname.includes(".")) throw new Error();
      values.website = url.toString();
    } catch {
      errors.website = "Enter a valid website address.";
    }
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Enter a valid email address.";
  return { values, errors };
}

function editableOrganizations(identity: DealerPortalIdentity) {
  return identity.memberships.filter((membership) => membership.pagePermissions.includes("locations"));
}

// Resolves the location only when it is linked to an organization this dealer may manage.
async function loadManagedLocation(identity: DealerPortalIdentity, dealerId: string) {
  const organizationIds = editableOrganizations(identity).map((membership) => membership.organizationId);
  if (!organizationIds.length) return null;
  const supabase = createSupabaseAdminClient();
  const { data: link } = await supabase
    .from("dealer_organization_locations")
    .select("organization_id")
    .eq("dealer_id", dealerId)
    .in("organization_id", organizationIds)
    .limit(1)
    .maybeSingle();
  if (!link) return null;
  const { data: row } = await supabase.from("dealers").select("*").eq("id", dealerId).maybeSingle();
  if (!row) return null;
  const organization = identity.memberships.find((membership) => membership.organizationId === link.organization_id)!;
  return { supabase, dealer: dealerRowToDealer(row as DealerRow), organization };
}

function auditLine(identity: DealerPortalIdentity, summary: string) {
  return `[${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC] ${summary} in the dealer portal by ${identity.email}.`;
}

const appendNote = (notes: string | undefined, line: string) => (notes ? `${notes}\n${line}` : line);

function revalidateLocation(dealerId?: string) {
  revalidatePath("/partner/locations");
  if (dealerId) revalidatePath(`/partner/locations/${dealerId}`);
  revalidatePath("/admin/locations");
  revalidatePath("/admin/dealers");
}

export async function createDealerLocationAction(_: DealerLocationFormState, formData: FormData): Promise<DealerLocationFormState> {
  const identity = await requireDealerPortal("locations");
  const organization = editableOrganizations(identity).find((membership) => membership.organizationId === text(formData, "organizationId"));
  if (!organization) return { message: "Choose the dealer this location belongs to." };

  const { values, errors } = parseLocationForm(formData);
  if (Object.keys(errors).length) return { message: "Review the highlighted fields.", fieldErrors: errors };

  const dealer: Dealer = {
    ...values,
    id: crypto.randomUUID(),
    name: organization.organizationName,
    active: true,
    verificationStatus: "verified",
    notes: auditLine(identity, "Added"),
    source: { workbook: "Dealer portal", sheet: organization.organizationSlug, row: 0, rawCity: values.city, rawRegion: values.stateProvince },
  };
  const geocodeError = applyAutomaticCoordinates(dealer, formData);
  if (geocodeError) return geocodeError;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("dealers").insert(dealerToMutation(dealer));
  if (error) return { message: "The location could not be saved. Please try again." };
  const { error: linkError } = await supabase.from("dealer_organization_locations").insert({ organization_id: organization.organizationId, dealer_id: dealer.id });
  if (linkError) {
    await supabase.from("dealers").delete().eq("id", dealer.id);
    return { message: "The location could not be saved. Please try again." };
  }

  const changes: LocationChange[] = editableFields.filter(([key]) => dealer[key]).map(([key, label]) => ({ label, after: String(dealer[key]) }));
  after(() => sendDealerLocationChangeEmail({ kind: "added", dealer, organizationName: organization.organizationName, actorEmail: identity.email, changes }));
  revalidateLocation();
  redirect(`/partner/locations/${encodeURIComponent(dealer.id)}?saved=created`);
}

export async function updateDealerLocationAction(dealerId: string, _: DealerLocationFormState, formData: FormData): Promise<DealerLocationFormState> {
  const identity = await requireDealerPortal("locations");
  const managed = await loadManagedLocation(identity, dealerId);
  if (!managed) return { message: "This location isn’t assigned to your dealer account." };
  const { supabase, dealer: existing, organization } = managed;

  const { values, errors } = parseLocationForm(formData);
  if (Object.keys(errors).length) return { message: "Review the highlighted fields.", fieldErrors: errors };

  const changes: LocationChange[] = editableFields
    .filter(([key]) => (existing[key] ?? "") !== (values[key] ?? ""))
    .map(([key, label]) => ({ label, before: existing[key] ? String(existing[key]) : undefined, after: values[key] ? String(values[key]) : undefined }));
  if (!changes.length) redirect(`/partner/locations/${encodeURIComponent(dealerId)}`);

  const dealer: Dealer = { ...existing, ...values, notes: appendNote(existing.notes, auditLine(identity, `Edited (${changes.map((change) => change.label).join(", ")})`)) };
  const geocodeError = applyAutomaticCoordinates(dealer, formData, existing);
  if (geocodeError) return geocodeError;

  const { error } = await supabase.from("dealers").update(dealerToMutation(dealer)).eq("id", dealerId);
  if (error) return { message: "Your changes could not be saved. Please try again." };

  after(() => sendDealerLocationChangeEmail({ kind: "edited", dealer, organizationName: organization.organizationName, actorEmail: identity.email, changes }));
  revalidateLocation(dealerId);
  redirect(`/partner/locations/${encodeURIComponent(dealerId)}?saved=updated`);
}

// Removing hides the location from the public locator; the record is kept so it can be restored.
export async function setDealerLocationActiveAction(dealerId: string, active: boolean) {
  const identity = await requireDealerPortal("locations");
  const managed = await loadManagedLocation(identity, dealerId);
  if (!managed) redirect("/partner/locations");
  const { supabase, dealer, organization } = managed;
  if (dealer.active === active) redirect(`/partner/locations/${encodeURIComponent(dealerId)}`);

  const notes = appendNote(dealer.notes, auditLine(identity, active ? "Restored to the locator" : "Removed from the locator"));
  const { error } = await supabase.from("dealers").update({ active, notes }).eq("id", dealerId);
  if (error) redirect(`/partner/locations/${encodeURIComponent(dealerId)}?error=status`);

  after(() => sendDealerLocationChangeEmail({ kind: active ? "restored" : "removed", dealer: { ...dealer, active }, organizationName: organization.organizationName, actorEmail: identity.email, changes: [] }));
  revalidateLocation(dealerId);
  redirect(`/partner/locations/${encodeURIComponent(dealerId)}?saved=${active ? "restored" : "removed"}`);
}
