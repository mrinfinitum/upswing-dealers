import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();
  return (
    <>
      <header className="admin-header">
        <Link href="/admin"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf administration" width={230} height={65} priority /></Link>
        <nav aria-label="Admin navigation">
          <Link href="/admin/dealers">Dealers</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/" target="_blank" rel="noreferrer">View locator <span aria-hidden="true">↗</span></Link>
        </nav>
        <details className="admin-account-menu">
          <summary aria-label={`Open account menu for ${admin.email}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" /></svg>
            <span>{admin.email}</span>
            <svg className="admin-account-menu__chevron" aria-hidden="true" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" /></svg>
          </summary>
          <div className="admin-account-menu__panel">
            <span>Account</span>
            <Link href="/admin/account">Account</Link>
            <Link href="/admin">Admin</Link>
            <Link href="/" target="_blank" rel="noreferrer">View locator ↗</Link>
            <form action={logoutAction}><button type="submit">Sign out</button></form>
          </div>
        </details>
      </header>
      <main className="admin-main">{children}</main>
    </>
  );
}
