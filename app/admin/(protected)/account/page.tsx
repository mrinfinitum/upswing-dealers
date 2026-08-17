import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminAccountPage() {
  const admin = await requireAdmin();
  return (
    <div className="admin-page admin-account-page">
      <Link className="admin-back-link" href="/admin">← Administration</Link>
      <header className="admin-page__heading"><div><p className="eyebrow">Account</p><h1>Your account</h1><p>Review the identity currently authorized to manage the UpSwing dealer platform.</p></div></header>
      <section className="admin-account-card">
        <div className="admin-account-card__icon"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" /></svg></div>
        <div><span>Email</span><strong>{admin.email}</strong></div>
        <div><span>Access group</span><strong>UpSwing administrator</strong></div>
        <div><span>User ID</span><strong className="admin-record-id">{admin.id}</strong></div>
      </section>
    </div>
  );
}
