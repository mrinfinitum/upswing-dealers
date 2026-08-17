import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();
  return (
    <>
      <header className="admin-header"><Link href="/admin/locations"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={230} height={65} priority /></Link><nav aria-label="Admin navigation"><Link href="/admin/locations">Locations</Link><Link href="/admin/dealers">Dealer access</Link><Link href="/admin/requests">Requests</Link><Link href="/" target="_blank" rel="noreferrer">View locator ↗</Link></nav><div className="admin-account"><span>{admin.email}</span><form action={logoutAction}><button type="submit">Sign out</button></form></div></header>
      <main className="admin-main">{children}</main>
    </>
  );
}
