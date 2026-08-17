"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import type { AdminUserFormState } from "@/lib/admin/user-form-state";
import { listAuthUsers } from "@/lib/admin/users";
import { canonicalSiteUrl } from "@/lib/site";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^\S+@\S+\.\S+$/;
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function inviteAdministratorAction(_: AdminUserFormState, formData: FormData): Promise<AdminUserFormState> {
  await requireAdmin();
  const email = text(formData, "email").toLowerCase();
  const displayName = text(formData, "displayName");
  if (!emailPattern.test(email)) return { message: "Enter a valid email address." };

  try {
    const supabase = createSupabaseAdminClient();
    const existingUsers = await listAuthUsers();
    const existing = existingUsers.find((user) => user.email?.toLowerCase() === email);
    if (existing) {
      return { message: existing.app_metadata?.role === "admin" ? "This account is already an administrator." : "An account with this email already exists. Existing roles are not changed automatically." };
    }

    const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { display_name: displayName },
      redirectTo: `${canonicalSiteUrl}/admin/reset-password`,
    });
    if (inviteError || !data.user) return { message: inviteError?.message || "The administrator invitation could not be sent." };

    const { error: roleError } = await supabase.auth.admin.updateUserById(data.user.id, {
      app_metadata: { ...data.user.app_metadata, role: "admin" },
      user_metadata: { ...data.user.user_metadata, display_name: displayName || undefined },
    });
    if (roleError) return { message: "The invitation was sent, but the administrator role could not be assigned. Review the account in Supabase before it signs in." };

    revalidatePath("/admin/users");
    return { success: true, message: `Administrator invitation sent to ${email}.` };
  } catch {
    return { message: "Administrator invitations require the server-only Supabase service role configuration." };
  }
}
