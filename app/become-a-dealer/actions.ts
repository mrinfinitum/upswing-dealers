"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  APPLICATION_SOURCE_SHEET,
  APPLICATION_SOURCE_WORKBOOK,
  applicationFingerprint,
  applicationNotes,
  parseDealerApplication,
  readApplicationValues,
  type DealerApplicationValues,
} from "@/lib/dealers/application";
import { dealerToMutation } from "@/lib/dealers/supabase-mapper";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstileToken } from "@/lib/turnstile";

export type DealerApplicationState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Partial<Record<keyof DealerApplicationValues, string>>;
  values?: DealerApplicationValues;
};

const escapeLike = (value: string) => value.replaceAll(/[\\%_]/g, (match) => `\\${match}`);

export async function submitDealerApplicationAction(_: DealerApplicationState, formData: FormData): Promise<DealerApplicationState> {
  const values = readApplicationValues(formData);

  // Hidden honeypot field: real visitors never fill it in. Pretend success so bots learn nothing.
  if (String(formData.get("companyFax") ?? "").trim()) return { status: "success", message: "" };

  const { application, errors } = parseDealerApplication(values);
  if (!application) return { status: "error", message: "Please review the highlighted fields.", fieldErrors: errors, values };

  const requestHeaders = await headers();
  const remoteIp = requestHeaders.get("cf-connecting-ip") || requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  const verification = await verifyTurnstileToken(String(formData.get("cf-turnstile-response") ?? ""), remoteIp);
  if (verification === "failed") return { status: "error", message: "We couldn’t confirm you’re human. Please complete the check and submit again.", values };
  if (verification === "unavailable") return { status: "error", message: "Applications are temporarily unavailable. Please email info@upswinggolf.com instead.", values };

  const supabase = createSupabaseAdminClient();

  const { data: sameLocation, error: locationError } = await supabase
    .from("dealers")
    .select("name, address_line_1, postal_code, country, verification_status")
    .eq("country", application.country)
    .ilike("postal_code", escapeLike(application.postalCode));
  if (locationError) return { status: "error", message: "Something went wrong saving your application. Please try again.", values };
  const fingerprint = applicationFingerprint([application.businessName, application.postalCode]);
  const existing = (sameLocation ?? []).find((row) => applicationFingerprint([row.name, row.postal_code]) === fingerprint);
  if (existing?.verification_status === "verified") return { status: "error", message: `${application.businessName} is already an UpSwing dealer at this location. Email info@upswinggolf.com to update your listing.`, values };
  if (existing?.verification_status === "needs-review") return { status: "success", message: "We already have an application for this location, and our team is reviewing it." };

  const { count: pendingForEmail, error: emailError } = await supabase
    .from("dealers")
    .select("id", { count: "exact", head: true })
    .eq("source_workbook", APPLICATION_SOURCE_WORKBOOK)
    .eq("verification_status", "needs-review")
    .ilike("notes", `%Contact email: ${escapeLike(application.contactEmail)}%`);
  if (emailError) return { status: "error", message: "Something went wrong saving your application. Please try again.", values };
  if ((pendingForEmail ?? 0) >= 5) return { status: "success", message: "We already have applications from this email address, and our team is reviewing them." };

  const { error } = await supabase.from("dealers").insert(dealerToMutation({
    id: crypto.randomUUID(),
    name: application.businessName,
    addressLine1: application.addressLine1,
    addressLine2: application.addressLine2,
    city: application.city,
    stateProvince: application.region,
    postalCode: application.postalCode,
    country: application.country,
    phone: application.storePhone,
    website: application.website,
    active: false,
    verificationStatus: "needs-review",
    notes: applicationNotes(application, new Date()),
    source: { workbook: APPLICATION_SOURCE_WORKBOOK, sheet: APPLICATION_SOURCE_SHEET, row: 0, rawCity: application.city, rawRegion: application.region },
  }));
  if (error) {
    console.error("Dealer application insert failed", error.code, error.message);
    return { status: "error", message: "Something went wrong saving your application. Please try again.", values };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  return { status: "success", message: "" };
}
