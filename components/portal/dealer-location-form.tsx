"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createDealerLocationAction, updateDealerLocationAction, type DealerLocationFormState } from "@/app/partner/(protected)/locations/actions";
import { formAddressFingerprint, formAddressQuery } from "@/lib/geo/address";
import { geocodeCandidatesWithGoogle } from "@/lib/maps/google-loader";
import type { MapConfiguration } from "@/lib/maps/provider";
import type { DealerPortalLocation } from "@/types/portal";

type Organization = { id: string; name: string };

function FieldError({ error }: { error?: string }) {
  return error ? <span className="portal-field__error">{error}</span> : null;
}

const addressFingerprint = (location: DealerPortalLocation) =>
  [location.addressLine1, location.addressLine2, location.city, location.stateProvince, location.postalCode, location.country]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .join("|");

export function DealerLocationForm({ location, organizations, mapConfig }: { location?: DealerPortalLocation; organizations: Organization[]; mapConfig: MapConfiguration }) {
  const serverAction = location ? updateDealerLocationAction.bind(null, location.dealerId) : createDealerLocationAction;

  // New and moved addresses are geocoded in the browser; the server accepts only one precise match.
  async function geocodingAction(previousState: DealerLocationFormState, formData: FormData) {
    const addressChanged = !location || formAddressFingerprint(formData) !== addressFingerprint(location);
    if (addressChanged) {
      if (mapConfig.provider !== "google") return { message: "Map placement isn’t available right now. Please try again later." };
      try {
        formData.set("geocodeCandidates", JSON.stringify(await geocodeCandidatesWithGoogle(formAddressQuery(formData), mapConfig)));
      } catch {
        return { message: "We couldn’t find that address on the map. Check the street, city, and postal code." };
      }
    }
    return serverAction(previousState, formData);
  }

  const [state, action, pending] = useActionState(geocodingAction, {} as DealerLocationFormState);
  const error = (name: string) => state.fieldErrors?.[name];
  const cancelHref = location ? `/partner/locations/${encodeURIComponent(location.dealerId)}` : "/partner/locations";

  return (
    <form action={action} className="portal-location-form">
      {state.message ? <p className="portal-form-error" role="alert">{state.message}</p> : null}

      {!location ? (organizations.length > 1 ? (
        <div className="portal-field"><label htmlFor="organizationId">Dealer *</label>
          <select id="organizationId" name="organizationId" required defaultValue="">
            <option value="" disabled>Choose a dealer</option>
            {organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}
          </select>
        </div>
      ) : <input type="hidden" name="organizationId" value={organizations[0]?.id ?? ""} />) : null}

      <fieldset>
        <legend>Location</legend>
        <div className="portal-form-grid">
          <div className="portal-field portal-field--wide"><label htmlFor="locationName">Location name</label><input id="locationName" name="locationName" defaultValue={location?.locationName} placeholder="e.g. Downtown Tulsa" /><small>Optional. Shown on the locator instead of the dealer name and city.</small></div>
          <div className="portal-field portal-field--wide"><label htmlFor="addressLine1">Street address *</label><input id="addressLine1" name="addressLine1" defaultValue={location?.addressLine1} autoComplete="address-line1" required /><FieldError error={error("addressLine1")} /></div>
          <div className="portal-field portal-field--wide"><label htmlFor="addressLine2">Suite, unit, etc.</label><input id="addressLine2" name="addressLine2" defaultValue={location?.addressLine2} autoComplete="address-line2" /></div>
          <div className="portal-field"><label htmlFor="city">City *</label><input id="city" name="city" defaultValue={location?.city} autoComplete="address-level2" required /><FieldError error={error("city")} /></div>
          <div className="portal-field"><label htmlFor="stateProvince">State / province</label><input id="stateProvince" name="stateProvince" defaultValue={location?.stateProvince} autoComplete="address-level1" placeholder="e.g. OK" /></div>
          <div className="portal-field"><label htmlFor="postalCode">ZIP / postal code</label><input id="postalCode" name="postalCode" defaultValue={location?.postalCode} autoComplete="postal-code" /></div>
          <div className="portal-field"><label htmlFor="country">Country *</label><input id="country" name="country" defaultValue={location?.country ?? "United States"} list="portal-countries" autoComplete="country-name" required /><FieldError error={error("country")} />
            <datalist id="portal-countries"><option value="United States" /><option value="Canada" /><option value="United Kingdom" /><option value="Australia" /><option value="Mexico" /></datalist>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Public contact details</legend>
        <div className="portal-form-grid">
          <div className="portal-field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" defaultValue={location?.phone} autoComplete="tel" /></div>
          <div className="portal-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={location?.email} autoComplete="email" /><FieldError error={error("email")} /></div>
          <div className="portal-field portal-field--wide"><label htmlFor="website">Website</label><input id="website" name="website" type="text" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="www.yourstore.com" defaultValue={location?.website} autoComplete="url" /><FieldError error={error("website")} /></div>
        </div>
      </fieldset>

      <p className="portal-form-help">Changes go live on the UpSwing dealer locator as soon as you save. Address changes are placed on the map automatically.</p>
      <div className="portal-form-actions">
        <button className="portal-button portal-button--dark" disabled={pending} type="submit">{pending ? "Saving…" : location ? "Save changes" : "Add location"}<span aria-hidden="true">→</span></button>
        <Link className="portal-button" href={cancelHref}>Cancel</Link>
      </div>
    </form>
  );
}
