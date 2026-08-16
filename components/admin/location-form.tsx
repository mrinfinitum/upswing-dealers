"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createLocationAction, updateLocationAction } from "@/app/admin/actions";
import { initialAdminFormState } from "@/lib/admin/form-state";
import type { Dealer } from "@/types/dealer";

function FieldError({ error }: { error?: string }) {
  return error ? <span className="admin-field__error">{error}</span> : null;
}

export function LocationForm({ dealer }: { dealer?: Dealer }) {
  const updateAction = dealer ? updateLocationAction.bind(null, dealer.id) : createLocationAction;
  const [state, action, pending] = useActionState(updateAction, initialAdminFormState);
  const error = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={action} className="admin-location-form">
      {state.message ? <p className="admin-form-error" role="alert">{state.message}</p> : null}
      <fieldset>
        <legend>Location identity</legend>
        <div className="admin-form-grid">
          <div className="admin-field"><label htmlFor="name">Retailer / dealer name *</label><input id="name" name="name" defaultValue={dealer?.name} required /><FieldError error={error("name")} /></div>
          <div className="admin-field"><label htmlFor="locationName">Location name</label><input id="locationName" name="locationName" defaultValue={dealer?.locationName} /></div>
          <div className="admin-field"><label htmlFor="dealerType">Type / category</label><input id="dealerType" name="dealerType" defaultValue={dealer?.dealerType} /></div>
          <div className="admin-field"><label htmlFor="verificationStatus">Verification status *</label><select id="verificationStatus" name="verificationStatus" defaultValue={dealer?.verificationStatus ?? "unverified"}><option value="unverified">Unverified</option><option value="needs-review">Needs review</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select><FieldError error={error("verificationStatus")} /></div>
        </div>
        <label className="admin-checkbox"><input name="active" type="checkbox" defaultChecked={dealer?.active ?? true} /><span>Active and eligible for publication when verified</span></label>
      </fieldset>

      <fieldset>
        <legend>Address</legend>
        <div className="admin-form-grid">
          <div className="admin-field admin-field--wide"><label htmlFor="addressLine1">Address line 1</label><input id="addressLine1" name="addressLine1" defaultValue={dealer?.addressLine1} /></div>
          <div className="admin-field admin-field--wide"><label htmlFor="addressLine2">Address line 2</label><input id="addressLine2" name="addressLine2" defaultValue={dealer?.addressLine2} /></div>
          <div className="admin-field"><label htmlFor="city">City *</label><input id="city" name="city" defaultValue={dealer?.city} required /><FieldError error={error("city")} /></div>
          <div className="admin-field"><label htmlFor="stateProvince">State / province / region</label><input id="stateProvince" name="stateProvince" defaultValue={dealer?.stateProvince} /></div>
          <div className="admin-field"><label htmlFor="postalCode">ZIP / postal code</label><input id="postalCode" name="postalCode" defaultValue={dealer?.postalCode} /></div>
          <div className="admin-field"><label htmlFor="country">Country *</label><input id="country" name="country" defaultValue={dealer?.country} required /><FieldError error={error("country")} /></div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Coordinates</legend>
        <p className="admin-form-help">Coordinates are optional, but both values are required together. Verification is separate from geocoding.</p>
        <div className="admin-form-grid">
          <div className="admin-field"><label htmlFor="latitude">Latitude</label><input id="latitude" name="latitude" type="number" step="any" defaultValue={dealer?.coordinates?.latitude} /><FieldError error={error("latitude")} /></div>
          <div className="admin-field"><label htmlFor="longitude">Longitude</label><input id="longitude" name="longitude" type="number" step="any" defaultValue={dealer?.coordinates?.longitude} /><FieldError error={error("longitude")} /></div>
        </div>
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
      <div className="admin-form-actions"><button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? "Saving…" : dealer ? "Save changes" : "Create location"}</button><Link className="admin-button" href="/admin/locations">Cancel</Link></div>
    </form>
  );
}
