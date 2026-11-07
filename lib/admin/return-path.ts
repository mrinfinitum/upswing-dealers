const fallbackAdminPath = "/admin/locations";

export function safeAdminReturnPath(value: string | undefined, fallback = fallbackAdminPath) {
  if (!value || value.startsWith("//")) return fallback;

  try {
    const parsed = new URL(value, "https://upswing-admin.local");
    if (parsed.origin !== "https://upswing-admin.local") return fallback;
    const allowed = parsed.pathname === "/admin/locations" || parsed.pathname === "/admin/applications" || parsed.pathname.startsWith("/admin/dealers/");
    if (!allowed) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}

// Names the page a return path leads to, for "← Applications"-style back links.
export function adminReturnLabel(path: string) {
  const pathname = path.split("?")[0];
  if (pathname === "/admin/applications") return "Applications";
  if (pathname === "/admin/dealers/locations") return "Dealer locations";
  if (pathname === "/admin/dealers/map-review") return "Map review";
  if (pathname.startsWith("/admin/dealers/")) return "Dealer organization";
  return "Locations";
}
