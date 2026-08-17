import "server-only";

import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/auth";
import { getDealerPortalIdentity } from "@/lib/portal/auth";

export type GalleryIdentity =
  | { role: "admin"; id: string; email: string }
  | { role: "dealer"; id: string; email: string };

export async function getGalleryIdentity(): Promise<GalleryIdentity | null> {
  const admin = await getAdminIdentity();
  if (admin) return { role: "admin", id: admin.id, email: admin.email };
  const dealer = await getDealerPortalIdentity();
  if (dealer) return { role: "dealer", id: dealer.id, email: dealer.email };
  return null;
}

export async function requireGalleryIdentity() {
  const identity = await getGalleryIdentity();
  if (!identity) redirect("/partner/login");
  return identity;
}
