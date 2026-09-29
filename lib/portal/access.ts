import { portalPageKeys, type PortalPageKey } from "@/types/portal";

export const portalPagePaths: Record<PortalPageKey, string> = {
  dashboard: "/partner",
  locations: "/partner/locations",
  brand: "/partner/brand",
};

// Signs out sessions that still carry the dealer role but no longer have usable portal access.
export const portalAccessEndedPath = "/partner/access-ended";

// Every active dealer can open the shared image gallery, so it is the landing page of last resort.
export const portalFallbackPath = "/image-gallery";

export function dealerPortalHome(permissions: readonly PortalPageKey[]) {
  const page = portalPageKeys.find((key) => permissions.includes(key));
  return page ? portalPagePaths[page] : portalFallbackPath;
}

/**
 * Returns where an active dealer must be sent instead of the requested page, or null when the page may render.
 * Every destination is permitted for the same identity, so the guard can never redirect to itself.
 */
export function dealerPortalRedirect(permissions: readonly PortalPageKey[], page?: PortalPageKey) {
  if (!page || permissions.includes(page)) return null;
  const home = dealerPortalHome(permissions);
  return home === portalPagePaths.dashboard ? `${home}?denied=1` : home;
}
