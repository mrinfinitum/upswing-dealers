"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createLocationAction, updateLocationAction } from "@/app/admin/actions";
import { initialAdminFormState } from "@/lib/admin/form-state";
import type { Dealer } from "@/types/dealer";
import type { MapConfiguration } from "@/lib/maps/provider";
import { geocodeCandidatesWithGoogle } from "@/lib/maps/google-loader";
import { dealerAddressFingerprint, formAddressFingerprint, formAddressQuery } from "@/lib/geo/address";

function FieldError({ error }: { error?: string }) {
  return error ? <span className="admin-field__error">{error}</span> : null;
}

type ExistingDealerOption = { name: string; locationCount: number };

export function LocationForm({ dealer, mapConfig, cancelHref = "/admin/locations", existingDealers = [], defaultDealerName }: { dealer?: Dealer; mapConfig: MapConfiguration; cancelHref?: string; existingDealers?: ExistingDealerOption[]; defaultDealerName?: string }) {
  const matchingDefault = existingDealers.find((option) => option.name.toLowerCase() === defaultDealerName?.toLowerCase());
  const [dealerSelection, setDealerSelection] = useState(dealer?.name ?? matchingDefault?.name ?? "");
  const [newDealerName, setNewDealerName] = useState("");
  const addingNewDealer = dealerSelection === "__new__";
  const serverAction = dealer ? updateLocationAction.bind(null, dealer.id) : createLocationAction;
  async function geocodingAction(previousState: typeof initialAdminFormState, formData: FormData) {
    const addressChanged = !dealer || formAddressFingerprint(formData) !== dealerAddressFingerprint(dealer);
    if (addressChanged || !dealer.coordinates) {
      if (mapConfig.provider !== "google") return { message: "Automatic geocoding is not configured." };
      try {
        const candidates = await geocodeCandidatesWithGoogle(formAddressQuery(formData), mapConfig);
        formData.set("geocodeCandidates", JSON.stringify(candidates));
      } catch {
        return { message: "Google could not geocode this address. Check the address and try again." };
      }
    }
    return serverAction(previousState, formData);
  }
  const [state, action, pending] = useActionState(geocodingAction, initialAdminFormState);
  const error = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={action} className={`admin-location-form${dealer ? "" : " admin-location-form--create"}`}>
      {dealer ? <input type="hidden" name="returnTo" value={cancelHref} /> : null}
      {state.message ? <p className="admin-form-error" role="alert">{state.message}</p> : null}
      <fieldset>
        <legend>Location identity</legend>
        {!dealer ? <div className="admin-dealer-picker">
          <div><p className="admin-dealer-picker__label">Choose a dealer *</p><p>Select an existing dealer to keep its locations grouped together, or create a new dealer.</p></div>
          <div className="admin-dealer-picker__options" role="radiogroup" aria-label="Choose a dealer">
            {existingDealers.map((option) => <label key={option.name}><input type="radio" name="dealerSelection" value={option.name} checked={dealerSelection === option.name} onChange={() => setDealerSelection(option.name)} required /><span><strong>{option.name}</strong><small>{option.locationCount} {option.locationCount === 1 ? "location" : "locations"}</small></span></label>)}
            <label className="admin-dealer-picker__new"><input type="radio" name="dealerSelection" value="__new__" checked={addingNewDealer} onChange={() => setDealerSelection("__new__")} required /><span><strong><b aria-hidden="true">＋</b> Add new dealer</strong><small>Create a new retailer group</small></span></label>
          </div>
          {addingNewDealer ? <div className="admin-field admin-dealer-picker__name"><label htmlFor="name">New retailer / dealer name *</label><input id="name" name="name" value={newDealerName} onChange={(event) => setNewDealerName(event.target.value)} autoFocus required /><FieldError error={error("name")} /></div> : <input type="hidden" name="name" value={dealerSelection} />}
          {!addingNewDealer ? <FieldError error={error("name")} /> : null}
        </div> : null}
        <div className="admin-form-grid">
          {dealer ? <div className="admin-field"><label htmlFor="name">Retailer / dealer name *</label><input id="name" name="name" defaultValue={dealer.name} required /><FieldError error={error("name")} /></div> : null}
          <div className={`admin-field${dealer ? "" : " admin-field--wide"}`}><label htmlFor="locationName">Location name</label><input id="locationName" name="locationName" defaultValue={dealer?.locationName} /></div>
          <div className="admin-field"><label htmlFor="verificationStatus">Verification status *</label><select id="verificationStatus" name="verificationStatus" defaultValue={dealer?.verificationStatus ?? "unverified"}><option value="unverified">Unverified</option><option value="needs-review">Needs review</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select><FieldError error={error("verificationStatus")} /></div>
        </div>
        <label className="admin-checkbox"><input name="active" type="checkbox" defaultChecked={dealer?.active ?? true} /><span>Active and eligible for publication when verified</span></label>
      </fieldset>

      <fieldset>
        <legend>Address</legend>
        <div className="admin-form-grid">
          <div className="admin-field admin-field--wide"><label htmlFor="addressLine1">Address line 1 *</label><input id="addressLine1" name="addressLine1" defaultValue={dealer?.addressLine1} required /><FieldError error={error("addressLine1")} /></div>
          <div className="admin-field admin-field--wide"><label htmlFor="addressLine2">Address line 2</label><input id="addressLine2" name="addressLine2" defaultValue={dealer?.addressLine2} /></div>
          <div className="admin-field"><label htmlFor="city">City *</label><input id="city" name="city" defaultValue={dealer?.city} required /><FieldError error={error("city")} /></div>
          <div className="admin-field"><label htmlFor="stateProvince">State / province / region</label><input id="stateProvince" name="stateProvince" defaultValue={dealer?.stateProvince} /></div>
          <div className="admin-field"><label htmlFor="postalCode">ZIP / postal code</label><input id="postalCode" name="postalCode" defaultValue={dealer?.postalCode} /></div>
          <div className="admin-field"><label htmlFor="country">Country *</label><input id="country" name="country" defaultValue={dealer?.country} required /><FieldError error={error("country")} /></div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Map location</legend>
        <p className="admin-form-help">Latitude and longitude are calculated automatically from the complete address when this record is saved. Ambiguous or approximate matches are not accepted.</p>
        {dealer?.coordinates ? <p className="admin-coordinate-status"><span>Current verified coordinates</span>{dealer.coordinates.latitude.toFixed(6)}, {dealer.coordinates.longitude.toFixed(6)}</p> : <p className="admin-coordinate-status"><span>Status</span>Coordinates will be calculated on save.</p>}
      </fieldset>

      <fieldset>
        <legend>Contact and notes</legend>
        <div className="admin-form-grid">
          <div className="admin-field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" defaultValue={dealer?.phone} /></div>
          <div className="admin-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={dealer?.email} /><FieldError error={error("email")} /></div>
          <div className="admin-field admin-field--wide"><label htmlFor="website">Location website</label><input id="website" name="website" type="url" placeholder="https://" defaultValue={dealer?.website} /><FieldError error={error("website")} /></div>
          <div className="admin-field admin-field--wide"><label htmlFor="notes">Internal notes</label><textarea id="notes" name="notes" rows={4} defaultValue={dealer?.notes} /></div>
        </div>
      </fieldset>
      <div className="admin-form-actions"><button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? "Validating address…" : dealer ? "Save changes" : "Create location"}</button><Link className="admin-button" href={cancelHref}>Cancel</Link></div>
    </form>
  );
}
