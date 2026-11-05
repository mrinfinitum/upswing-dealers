import { redirect } from "next/navigation";

// Sign-in moved to the portal home page, which routes each role and is protected by Turnstile.
export default function AdminLoginPage() {
  redirect("/");
}
