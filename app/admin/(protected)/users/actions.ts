"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import type { AdminUserFormState } from "@/lib/admin/user-form-state";
import { listAuthUsers } from "@/lib/admin/users";
import { canonicalSiteUrl } from "@/lib/site";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { portalPageKeys, type PortalPageKey } from "@/types/portal";

const emailPattern = /^\S+@\S+\.\S+$/;
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function permissions(formData: FormData): PortalPageKey[] {
  return portalPageKeys.filter((page) => formData.get(`permission-${page}`) === "on");
}

export async function addUserAction(_: AdminUserFormState, formData: FormData): Promise<AdminUserFormState> {
  await requireAdmin();
  const email = text(formData, "email").toLowerCase();
  const displayName = text(formData, "displayName");
  const role = text(formData, "role");
  const setupMode = text(formData, "setupMode") === "direct" ? "direct" : "invite";
  const password = text(formData, "password");
  const organizationId = text(formData, "organizationId");
  const pagePermissions = permissions(formData);

  if (!emailPattern.test(email)) return { message: "Enter a valid email address." };
  if (role !== "admin" && role !== "dealer") return { message: "Choose an account group." };
  if (setupMode === "direct" && password.length < 12) return { message: "Directly created users require a temporary password of at least 12 characters." };
  if (role === "dealer" && !organizationId) return { message: "Choose a dealer organization." };
  if (role === "dealer" && !pagePermissions.length) return { message: "Enable at least one dealer portal page." };

  try {
    const supabase = createSupabaseAdminClient();
    if (role === "dealer") {
      const { data: organization, error } = await supabase.from("dealer_organizations").select("id").eq("id", organizationId).eq("active", true).maybeSingle();
      if (error || !organization) return { message: "Choose an active dealer organization." };
    }

    const existingUsers = await listAuthUsers();
    let user = existingUsers.find((candidate) => candidate.email?.toLowerCase() === email);
    let invited = false;
    let createdDirectly = false;

    if (setupMode === "direct" && user) return { message: "An account with this email already exists." };
    if (user?.app_metadata?.role === "admin") {
      return { message: role === "admin" ? "This account is already an administrator." : "Administrator accounts cannot be converted to dealer accounts." };
    }
    if (role === "admin" && user) {
      return { message: "An account with this email already exists. Existing roles are not changed automatically." };
    }
    if (!user) {
      if (setupMode === "direct") {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          app_metadata: { role },
          user_metadata: { display_name: displayName },
        });
        if (error || !data.user) return { message: error?.message || "The user account could not be created." };
        user = data.user;
        createdDirectly = true;
      } else {
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: { display_name: displayName },
          redirectTo: `${canonicalSiteUrl}/${role === "admin" ? "admin" : "partner"}/reset-password`,
        });
        if (error || !data.user) return { message: error?.message || "The user invitation could not be sent." };
        user = data.user;
        invited = true;
      }
    }

    const { error: roleError } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, role },
      user_metadata: { ...user.user_metadata, display_name: displayName || user.user_metadata?.display_name },
    });
    if (roleError) return { message: "The account was created, but its group could not be assigned. Review the account in Supabase before it signs in." };

    if (role === "dealer") {
      const { error: profileError } = await supabase.from("dealer_portal_users").upsert({
        user_id: user.id,
        email,
        display_name: displayName || null,
        role: "dealer",
        active: true,
      });
      if (profileError) return { message: "The account was created, but its dealer portal profile could not be saved." };

      const { error: membershipError } = await supabase.from("dealer_memberships").upsert({
        user_id: user.id,
        organization_id: organizationId,
        page_permissions: pagePermissions,
        active: true,
      });
      if (membershipError) return { message: "The account was created, but its dealer organization permissions could not be saved." };
      revalidatePath("/admin/dealers");
    }

    revalidatePath("/admin/users");
    const groupLabel = role === "admin" ? "administrator" : "dealer";
    if (createdDirectly) return { success: true, message: `${groupLabel[0].toUpperCase()}${groupLabel.slice(1)} account created for ${email}.` };
    return { success: true, message: invited ? `${groupLabel[0].toUpperCase()}${groupLabel.slice(1)} invitation sent to ${email}.` : `${email} was assigned to the dealer portal.` };
  } catch {
    return { message: "User administration requires the server-only Supabase service role configuration." };
  }
}

export async function deleteUserAction(userId: string, previousState: AdminUserFormState, formData: FormData): Promise<AdminUserFormState> {
  void previousState;
  void formData;
  const currentAdmin = await requireAdmin();
  if (userId === currentAdmin.id) return { message: "You cannot delete the administrator account you are currently using." };

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error: lookupError } = await supabase.auth.admin.getUserById(userId);
    if (lookupError || !data.user) return { message: "This user no longer exists." };
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return { message: "The user could not be deleted." };
    revalidatePath("/admin/users");
    return { success: true, message: `${data.user.email || "User"} was deleted.` };
  } catch {
    return { message: "User deletion requires the server-only Supabase service role configuration." };
  }
}
