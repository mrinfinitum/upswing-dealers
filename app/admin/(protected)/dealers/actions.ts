"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { canonicalSiteUrl } from "@/lib/site";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { portalPageKeys, type PortalPageKey } from "@/types/portal";
import type { PortalFormState } from "@/lib/portal/form-state";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const emailPattern = /^\S+@\S+\.\S+$/;

function permissions(formData: FormData): PortalPageKey[] {
  return portalPageKeys.filter((page) => formData.get(`permission-${page}`) === "on");
}

export async function inviteDealerUserAction(_: PortalFormState, formData: FormData): Promise<PortalFormState> {
  await requireAdmin();
  const email = text(formData, "email").toLowerCase();
  const displayName = text(formData, "displayName");
  const organizationId = text(formData, "organizationId");
  const pagePermissions = permissions(formData);
  if (!emailPattern.test(email)) return { message: "Enter a valid email address." };
  if (!organizationId) return { message: "Choose a dealer organization." };
  if (!pagePermissions.length) return { message: "Enable at least one portal page." };

  try {
    const admin = createSupabaseAdminClient();
    const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return { message: "Supabase could not check existing users." };
    let user = listed.users.find((candidate) => candidate.email?.toLowerCase() === email);
    let invited = false;

    if (user?.app_metadata?.role === "admin") return { message: "Administrator accounts cannot be converted to dealer accounts." };
    if (!user) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { display_name: displayName },
        redirectTo: `${canonicalSiteUrl}/partner/reset-password`,
      });
      if (error || !data.user) return { message: error?.message || "The invitation could not be sent." };
      user = data.user;
      invited = true;
    }

    const { error: roleError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, role: "dealer" },
      user_metadata: { ...user.user_metadata, display_name: displayName || user.user_metadata?.display_name },
    });
    if (roleError) return { message: "The dealer role could not be assigned." };

    const { error: profileError } = await admin.from("dealer_portal_users").upsert({
      user_id: user.id,
      email,
      display_name: displayName || null,
      role: "dealer",
      active: true,
    });
    if (profileError) return { message: "The portal profile could not be created. Apply the dealer portal migration first." };
    const { error: membershipError } = await admin.from("dealer_memberships").upsert({
      user_id: user.id,
      organization_id: organizationId,
      page_permissions: pagePermissions,
      active: true,
    });
    if (membershipError) return { message: "The organization membership could not be assigned." };

    revalidatePath("/admin/dealers");
    return { success: true, message: invited ? `Invitation sent to ${email}.` : `${email} was assigned to the dealer portal.` };
  } catch {
    return { message: "Dealer invitations require the server-only Supabase service role configuration." };
  }
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
  revalidatePath(`/admin/dealers/${organizationId}`);
  return { success: true, message: "Dealer organization updated." };
}
