import { redirect } from "next/navigation";

// Sign-in moved to the portal home page, which routes each role and is protected by Turnstile.
export default async function DealerLoginPage({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const { access } = await searchParams;
  redirect(access === "inactive" ? "/?access=inactive" : "/");
}
