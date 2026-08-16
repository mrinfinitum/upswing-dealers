import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="admin-login">
      <section className="admin-login__card" aria-labelledby="admin-login-title">
        <Link className="admin-login__logo" href="/"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={230} height={65} priority /></Link>
        <div className="admin-login__body"><p className="eyebrow">Dealer management</p><h1 id="admin-login-title">Admin sign in</h1><p>Sign in with an authorized UpSwing administrator account.</p><LoginForm /></div>
      </section>
    </main>
  );
}
