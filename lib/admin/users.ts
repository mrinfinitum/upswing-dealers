import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export class AdminUserDirectoryError extends Error {}

export async function listAuthUsers() {
  const supabase = createSupabaseAdminClient();
  const users: User[] = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new AdminUserDirectoryError("The Supabase user directory could not be loaded.");
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}
