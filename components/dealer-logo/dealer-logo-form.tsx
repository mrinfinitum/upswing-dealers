"use client";

import { useActionState, useState } from "react";
import { initialPortalFormState, type PortalFormState } from "@/lib/portal/form-state";

type LogoAction = (state: PortalFormState, formData: FormData) => Promise<PortalFormState>;

// Shows the logo on light and dark tiles, since the locator uses both, and previews a chosen file before upload.
export function DealerLogoForm({ action: serverAction, logoUrl, organizationName, variant }: {
  action: LogoAction;
  logoUrl?: string;
  organizationName: string;
  variant: "admin" | "portal";
}) {
  const [preview, setPreview] = useState<string>();

  async function logoAction(previousState: PortalFormState, formData: FormData) {
    const result = await serverAction(previousState, formData);
    if (result.success) setPreview(undefined);
    return result;
  }

  const [state, action, pending] = useActionState(logoAction, initialPortalFormState);
  const shown = preview ?? logoUrl;
  const inputId = `logo-${variant}-${organizationName.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <form action={action} className={`dealer-logo-form dealer-logo-form--${variant}`}>
      <div className="dealer-logo-form__stage" aria-label={shown ? `${organizationName} logo preview` : undefined}>
        {shown ? ["light", "dark"].map((tone) => (
          // eslint-disable-next-line @next/next/no-img-element -- logos are SVG or small raster files served from the storage CDN
          <div className={`dealer-logo-form__tile is-${tone}`} key={tone}><img src={shown} alt={tone === "light" ? `${organizationName} logo` : ""} /></div>
        )) : <p className="dealer-logo-form__empty">No logo yet. The locator shows the dealer name in text.</p>}
      </div>
      {preview ? <p className="dealer-logo-form__hint">Preview — not saved until you upload.</p> : null}
      <div className="dealer-logo-form__controls">
        <label htmlFor={inputId}>{logoUrl ? "Replace logo" : "Logo file"}</label>
        <input
          id={inputId}
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : undefined);
          }}
        />
        <small>PNG, JPG, WebP, or SVG, up to 2 MB. A transparent PNG or SVG with a wide shape works best.</small>
      </div>
      {state.message ? <p className={state.success ? `${variant}-notice` : `${variant}-form-error`} role="status">{state.message}</p> : null}
      <div className="dealer-logo-form__actions">
        <button className={variant === "admin" ? "admin-button admin-button--primary" : "portal-button portal-button--dark"} disabled={pending} type="submit" name="intent" value="upload">{pending ? "Saving…" : "Upload logo"}</button>
        {logoUrl ? <button className={variant === "admin" ? "admin-button" : "portal-button"} disabled={pending} type="submit" name="intent" value="remove" formNoValidate>Remove logo</button> : null}
      </div>
    </form>
  );
}
