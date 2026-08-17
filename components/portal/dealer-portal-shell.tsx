import Image from "next/image";
import Link from "next/link";
import { dealerLogoutAction } from "@/app/partner/actions";
import { requireDealerPortal } from "@/lib/portal/auth";

export async function DealerPortalShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const identity = await requireDealerPortal();
  const nav = [
    { key: "dashboard", href: "/partner", label: "Overview" },
    { key: "locations", href: "/partner/locations", label: "Locations" },
    { key: "brand", href: "/partner/brand", label: "Brand" },
  ] as const;

  return <>
    <header className="portal-header">
      <Link className="portal-header__logo" href="/partner"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf dealer portal" width={230} height={65} priority /></Link>
      <nav aria-label="Dealer portal navigation">
        {nav.filter((item) => identity.permissions.includes(item.key)).map((item) => <Link href={item.href} key={item.key}>{item.label}</Link>)}
        <Link href="/image-gallery">Image gallery</Link>
      </nav>
      <div className="portal-header__account"><span>{identity.displayName || identity.email}</span><form action={dealerLogoutAction}><button type="submit">Sign out</button></form></div>
    </header>
    <main>{children}</main>
  </>;
}
