import Image from "next/image";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="admin-login">
      <section className="admin-login__card" aria-labelledby="reset-password-title">
        <Link className="admin-login__logo" href="/"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={230} height={65} priority /></Link>
        <div className="admin-login__body"><p className="eyebrow">Dealer management</p><h1 id="reset-password-title">Choose a new password</h1><p>Enter a unique password with at least 12 characters.</p><ResetPasswordForm /></div>
      </section>
    </main>
  );
}
