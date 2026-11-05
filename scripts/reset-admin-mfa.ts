import { createClient } from "@supabase/supabase-js";

// Emergency recovery when no administrator can complete two-step verification (normally another admin
// resets it from /admin/users). Removes every MFA factor from one account; dry run unless --apply is passed.
// Usage: npx tsx --env-file=.env.local scripts/reset-admin-mfa.ts person@upswinggolf.com [--apply]
function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  const email = process.argv.slice(2).find((arg) => !arg.startsWith("--"))?.toLowerCase();
  if (!email) throw new Error("Pass the account email.");
  const apply = process.argv.includes("--apply");
  const supabase = createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

  let user;
  for (let page = 1; !user; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (data.users.length < 1000) break;
  }
  if (!user) throw new Error(`No account found for ${email}.`);

  const { data, error } = await supabase.auth.admin.mfa.listFactors({ userId: user.id });
  if (error) throw error;
  console.log(`${email}: ${data.factors.length} factor(s) — ${data.factors.map((factor) => `${factor.factor_type} ${factor.status}`).join(", ") || "none"}`);
  if (!apply) return console.log("Dry run only. Re-run with --apply to remove them.");
  for (const factor of data.factors) {
    const { error: deleteError } = await supabase.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
    if (deleteError) throw deleteError;
  }
  console.log("Removed. They will set up a new authenticator at their next sign-in.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
