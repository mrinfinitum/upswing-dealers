import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { DealerPortalShell } from "@/components/portal/dealer-portal-shell";
import { requireGalleryIdentity } from "@/lib/gallery/auth";

export const metadata: Metadata = {
  title: "Image Gallery | UpSwing Administration",
  robots: { index: false, follow: false },
};

export default async function ImageGalleryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const identity = await requireGalleryIdentity();
  return identity.role === "admin"
    ? <div className="admin-root"><AdminShell>{children}</AdminShell></div>
    : <div className="portal-root"><DealerPortalShell>{children}</DealerPortalShell></div>;
}
