const fallbackAdminPath = "/admin/locations";

export function safeAdminReturnPath(value: string | undefined, fallback = fallbackAdminPath) {
  if (!value || value.startsWith("//")) return fallback;

  try {
    const parsed = new URL(value, "https://upswing-admin.local");
    if (parsed.origin !== "https://upswing-admin.local") return fallback;
    const allowed = parsed.pathname === "/admin/locations" || parsed.pathname.startsWith("/admin/dealers/");
    if (!allowed) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}
