"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { portalPageKeys, type PortalPageKey } from "@/types/portal";
import type { PortalFormState } from "@/lib/portal/form-state";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

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
