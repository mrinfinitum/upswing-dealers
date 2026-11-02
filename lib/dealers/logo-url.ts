export const DEALER_LOGO_BUCKET = "dealer-logos";

// Public CDN URL for an organization logo stored in the dealer-logos bucket.
export function dealerLogoUrl(path: string | null | undefined) {
  if (!path) return undefined;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${DEALER_LOGO_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
