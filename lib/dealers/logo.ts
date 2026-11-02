import "server-only";

import { detectLogoFormat, type LogoFormat } from "@/lib/dealers/logo-format";
import { DEALER_LOGO_BUCKET } from "@/lib/dealers/logo-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export async function readLogoUpload(formData: FormData): Promise<{ bytes: Uint8Array; format: LogoFormat } | { error: string }> {
  const file = formData.get("logo");
  if (!(file instanceof File) || !file.size) return { error: "Choose a logo file to upload." };
  if (file.size > MAX_LOGO_BYTES) return { error: "Logos must be 2 MB or smaller." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = detectLogoFormat(bytes);
  if (format === "unsafe-svg") return { error: "That SVG contains scripts or embedded content. Export a plain SVG, or upload a PNG instead." };
  if (!format) return { error: "Upload a PNG, JPG, WebP, or SVG file." };
  return { bytes, format };
}

// Stores the new logo under a fresh name (so caches never serve the old one), then deletes the previous file.
export async function replaceOrganizationLogo(organizationId: string, upload: { bytes: Uint8Array; format: LogoFormat } | null) {
  const supabase = createSupabaseAdminClient();
  const { data: organization } = await supabase.from("dealer_organizations").select("logo_path").eq("id", organizationId).maybeSingle();
  if (!organization) return { error: "The dealer organization could not be found." };

  let logoPath: string | null = null;
  if (upload) {
    logoPath = `${organizationId}/${Date.now()}.${upload.format.extension}`;
    const { error } = await supabase.storage.from(DEALER_LOGO_BUCKET).upload(logoPath, upload.bytes, {
      contentType: upload.format.contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) return { error: "The logo could not be uploaded. Please try again." };
  }

  const { error } = await supabase.from("dealer_organizations").update({
    logo_path: logoPath,
    logo_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", organizationId);
  if (error) {
    if (logoPath) await supabase.storage.from(DEALER_LOGO_BUCKET).remove([logoPath]);
    return { error: "The logo could not be saved. Please try again." };
  }

  if (organization.logo_path) await supabase.storage.from(DEALER_LOGO_BUCKET).remove([organization.logo_path]);
  return { logoPath };
}
