"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { dealerRowToDealer, type DealerRow } from "@/lib/dealers/supabase-mapper";
import { reviewGeocodeCandidate, type GeocodeCandidate } from "@/lib/geo/geocode-review";
import { createClient } from "@/lib/supabase/server";
import { portalPageKeys, type PortalPageKey } from "@/types/portal";
import type { PortalFormState } from "@/lib/portal/form-state";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

type CoordinateBatchSubmission = {
  dealerId: string;
  candidates: GeocodeCandidate[];
};

function isGeocodeCandidate(value: unknown): value is GeocodeCandidate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GeocodeCandidate>;
  return Boolean(
    candidate.coordinates
    && Number.isFinite(candidate.coordinates.latitude)
    && candidate.coordinates.latitude >= -90
    && candidate.coordinates.latitude <= 90
    && Number.isFinite(candidate.coordinates.longitude)
    && candidate.coordinates.longitude >= -180
    && candidate.coordinates.longitude <= 180
    && typeof candidate.formattedAddress === "string"
    && Array.isArray(candidate.resultTypes)
    && typeof candidate.locationType === "string"
    && Array.isArray(candidate.addressComponents),
  );
}

function validCoordinateBatch(value: unknown): CoordinateBatchSubmission[] {
  if (!Array.isArray(value) || value.length > 10) return [];
  const seen = new Set<string>();
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Partial<CoordinateBatchSubmission>;
    if (typeof item.dealerId !== "string" || !item.dealerId || seen.has(item.dealerId) || !Array.isArray(item.candidates) || item.candidates.length > 10) return [];
    seen.add(item.dealerId);
    return [{ dealerId: item.dealerId, candidates: item.candidates.filter(isGeocodeCandidate) }];
  });
}

function permissions(formData: FormData): PortalPageKey[] {
  return portalPageKeys.filter((page) => formData.get(`permission-${page}`) === "on");
}

export async function updateDealerMembershipAction(_: PortalFormState, formData: FormData): Promise<PortalFormState> {
  await requireAdmin();
  const userId = text(formData, "userId");
  const organizationId = text(formData, "organizationId");
  const pagePermissions = permissions(formData);
  const active = formData.get("active") === "on";
  if (!userId || !organizationId) return { message: "The membership could not be identified." };
  if (!pagePermissions.length) return { message: "Enable at least one portal page." };

  const supabase = await createClient();
  const { error } = await supabase.from("dealer_memberships").update({
    page_permissions: pagePermissions,
    active,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId).eq("organization_id", organizationId);
  if (error) return { message: "Access settings could not be saved." };

  revalidatePath("/admin/dealers");
  revalidatePath("/admin/users");
  return { success: true, message: "Dealer access updated." };
}

export async function saveDealerCoordinateBatchAction(value: unknown) {
  await requireAdmin();
  const submissions = validCoordinateBatch(value);
  const emptyResult = { accepted: 0, needsReview: 0, failed: 0 };
  if (!submissions.length) return { ...emptyResult, failed: 1 };

  const supabase = await createClient();
  const { data, error } = await supabase.from("dealers").select("*").in("id", submissions.map((item) => item.dealerId));
  if (error) return { ...emptyResult, failed: submissions.length };
  const dealers = new Map((data as DealerRow[]).map((row) => [row.id, dealerRowToDealer(row)]));
  let accepted = 0;
  let needsReview = 0;
  let failed = 0;

  for (const submission of submissions) {
    const dealer = dealers.get(submission.dealerId);
    if (!dealer || dealer.coordinates || !dealer.active || dealer.verificationStatus !== "verified" || !dealer.addressLine1) {
      failed += 1;
      continue;
    }
    if (!submission.candidates.length) {
      const { error: updateError } = await supabase.from("dealers").update({
        coordinate_evidence: {
          source: "google-maps-js-geocoder",
          retrievedAt: new Date().toISOString(),
          verificationStatus: "failed",
          discrepancies: ["Google returned no geocoding candidates for this address."],
        },
      }).eq("id", dealer.id).is("latitude", null).is("longitude", null);
      if (updateError) failed += 1;
      else needsReview += 1;
      continue;
    }
    const reviewed = submission.candidates.map((candidate) => ({ candidate, review: reviewGeocodeCandidate(dealer, candidate) }));
    const verified = reviewed.filter(({ review }) => review.status === "verified");
    if (verified.length !== 1) {
      const preferred = reviewed[0];
      const discrepancies = verified.length > 1
        ? ["Google returned multiple precise candidates; an administrator must select the correct location."]
        : preferred?.review.discrepancies ?? ["Google did not return a reviewable address candidate."];
      const candidate = preferred?.candidate;
      const { error: updateError } = await supabase.from("dealers").update({
        coordinate_evidence: {
          source: "google-maps-js-geocoder",
          retrievedAt: new Date().toISOString(),
          formattedAddress: candidate?.formattedAddress,
          proposedCoordinates: candidate?.coordinates,
          resultTypes: candidate?.resultTypes,
          locationType: candidate?.locationType,
          verificationStatus: "needs-review",
          discrepancies,
        },
      }).eq("id", dealer.id).is("latitude", null).is("longitude", null);
      if (updateError) failed += 1;
      else needsReview += 1;
      continue;
    }
    const candidate = verified[0].candidate;
    const { error: updateError } = await supabase.from("dealers").update({
      latitude: candidate.coordinates.latitude,
      longitude: candidate.coordinates.longitude,
      coordinate_evidence: {
        source: "google-maps-js-geocoder",
        retrievedAt: new Date().toISOString(),
        formattedAddress: candidate.formattedAddress,
        resultTypes: candidate.resultTypes,
        locationType: candidate.locationType,
        verificationStatus: "verified",
        discrepancies: [],
      },
    }).eq("id", dealer.id).is("latitude", null).is("longitude", null);
    if (updateError) failed += 1;
    else accepted += 1;
  }

  revalidatePath("/");
  revalidatePath("/admin/dealers");
  return { accepted, needsReview, failed };
}

export async function approveDealerCoordinateCandidateAction(dealerId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("dealers").select("*").eq("id", dealerId).maybeSingle();
  if (error || !data) return;
  const dealer = dealerRowToDealer(data as DealerRow);
  const evidence = dealer.coordinateEvidence;
  const candidate = evidence?.proposedCoordinates;
  if (dealer.coordinates || evidence?.verificationStatus !== "needs-review" || !candidate) return;
  if (!Number.isFinite(candidate.latitude) || candidate.latitude < -90 || candidate.latitude > 90 || !Number.isFinite(candidate.longitude) || candidate.longitude < -180 || candidate.longitude > 180) return;

  const { error: updateError } = await supabase.from("dealers").update({
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    coordinate_evidence: {
      ...evidence,
      source: "manual-coordinate-review",
      verificationStatus: "verified",
      resolution: "Approved by a dealer administrator after reviewing the Google candidate and documented discrepancies.",
    },
  }).eq("id", dealerId).is("latitude", null).is("longitude", null);
  if (updateError) return;
  revalidatePath("/");
  revalidatePath("/admin/dealers");
  revalidatePath("/admin/dealers/map-review");
}

export async function updateDealerOrganizationAction(_: PortalFormState, formData: FormData): Promise<PortalFormState> {
  await requireAdmin();
  const organizationId = text(formData, "organizationId");
  const name = text(formData, "name");
  const active = formData.get("active") === "on";
  if (!organizationId) return { message: "The dealer organization could not be identified." };
  if (!name) return { message: "Dealer name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("dealer_organizations").update({
    name,
    active,
    updated_at: new Date().toISOString(),
  }).eq("id", organizationId);
  if (error) return { message: "Dealer details could not be saved. The name may already be in use." };

  revalidatePath("/admin/dealers");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/dealers/${organizationId}`);
  return { success: true, message: "Dealer organization updated." };
}
