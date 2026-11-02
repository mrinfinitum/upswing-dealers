"use client";

import Link from "next/link";
import Script from "next/script";
import { useActionState, useEffect, useState } from "react";
import { submitDealerApplicationAction, type DealerApplicationState } from "@/app/become-a-dealer/actions";
import { BUSINESS_TYPES, CA_PROVINCE_NAMES, type DealerApplicationValues } from "@/lib/dealers/application";
import { US_STATE_NAMES } from "@/lib/geo/us-states";

declare global {
  interface Window { turnstile?: { reset: (widget?: string) => void } }
}

const initialState: DealerApplicationState = { status: "idle", message: "" };

function Field({ name, label, error, wide, children }: { name: keyof DealerApplicationValues; label: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`apply-field${wide ? " apply-field--wide" : ""}${error ? " apply-field--invalid" : ""}`}>
      <label htmlFor={`apply-${name}`}>{label}</label>
      {children}
      {error ? <span className="apply-field__error" id={`apply-${name}-error`}>{error}</span> : null}
    </div>
  );
}

export function DealerApplicationForm({ siteKey }: { siteKey: string }) {
  const [state, action, pending] = useActionState(submitDealerApplicationAction, initialState);
  const [country, setCountry] = useState(state.values?.country || "US");
  const values = state.values;
  const errors = state.fieldErrors ?? {};
  // React applies a select's defaultValue only on mount, so selects below are keyed by their submitted
  // value to survive the automatic form reset after a failed submit.
  const input = (name: keyof DealerApplicationValues) => ({
    id: `apply-${name}`,
    name,
    defaultValue: values?.[name] ?? "",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `apply-${name}-error` : undefined,
  });

  // Each Turnstile token is single-use, so issue a fresh challenge after every failed submit.
  useEffect(() => {
    if (state.status === "error") window.turnstile?.reset();
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="apply-success" role="status">
        <p className="eyebrow">Application received</p>
        <h2>Thanks — we’ll be in touch.</h2>
        <p>{state.message || "Our dealer team reviews every application and will reach out within a few business days."}</p>
        <Link href="/">Back to the dealer locator <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  const regions = country === "CA" ? CA_PROVINCE_NAMES : US_STATE_NAMES;
  return (
    <form action={action} className="apply-form">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      {state.status === "error" && state.message ? <p className="apply-form__error" role="alert">{state.message}</p> : null}

      <fieldset>
        <legend>Your business</legend>
        <div className="apply-grid">
          <Field name="businessName" label="Business name *" error={errors.businessName}><input {...input("businessName")} autoComplete="organization" required /></Field>
          <Field name="businessType" label="Type of business *" error={errors.businessType}>
            <select key={values?.businessType} {...input("businessType")} required>
              <option value="">Choose one</option>
              {Object.entries(BUSINESS_TYPES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </Field>
          <Field name="website" label="Website" error={errors.website}><input {...input("website")} type="url" inputMode="url" placeholder="https://" autoComplete="url" /></Field>
          <Field name="storePhone" label="Store phone" error={errors.storePhone}><input {...input("storePhone")} type="tel" autoComplete="tel" /></Field>
          <Field name="yearsInBusiness" label="Years in business" error={errors.yearsInBusiness}>
            <select key={values?.yearsInBusiness} {...input("yearsInBusiness")}>
              <option value="">Prefer not to say</option>
              <option>Less than 1</option><option>1–3</option><option>4–10</option><option>More than 10</option>
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend>Store address</legend>
        <div className="apply-grid">
          <Field name="addressLine1" label="Street address *" error={errors.addressLine1} wide><input {...input("addressLine1")} autoComplete="address-line1" required /></Field>
          <Field name="addressLine2" label="Suite, unit, etc." error={errors.addressLine2} wide><input {...input("addressLine2")} autoComplete="address-line2" /></Field>
          <Field name="city" label="City *" error={errors.city}><input {...input("city")} autoComplete="address-level2" required /></Field>
          <Field name="country" label="Country *" error={errors.country}>
            <select id="apply-country" name="country" value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country" required>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>
          </Field>
          <Field name="region" label={country === "CA" ? "Province / territory *" : "State *"} error={errors.region}>
            <select key={`${country}-${values?.region}`} {...input("region")} autoComplete="address-level1" required>
              <option value="">Choose one</option>
              {Object.entries(regions).map(([code, name]) => <option value={code} key={code}>{name}</option>)}
            </select>
          </Field>
          <Field name="postalCode" label={country === "CA" ? "Postal code *" : "ZIP code *"} error={errors.postalCode}><input {...input("postalCode")} autoComplete="postal-code" required /></Field>
        </div>
      </fieldset>

      <fieldset>
        <legend>Who should we contact?</legend>
        <p className="apply-form__help">Contact details are only shared with the UpSwing team, never on the public locator.</p>
        <div className="apply-grid">
          <Field name="contactName" label="Your name *" error={errors.contactName}><input {...input("contactName")} autoComplete="name" required /></Field>
          <Field name="contactEmail" label="Email *" error={errors.contactEmail}><input {...input("contactEmail")} type="email" autoComplete="email" required /></Field>
          <Field name="contactPhone" label="Phone" error={errors.contactPhone}><input {...input("contactPhone")} type="tel" autoComplete="tel" /></Field>
          <Field name="message" label="Anything else we should know?" error={errors.message} wide><textarea {...input("message")} rows={5} maxLength={2000} placeholder="Tell us about your customers, junior programs, or the UpSwing products you’d like to carry." /></Field>
        </div>
      </fieldset>

      <div className="apply-honeypot" aria-hidden="true">
        <label htmlFor="apply-companyFax">Company fax</label>
        <input id="apply-companyFax" name="companyFax" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="apply-form__submit">
        <div className="cf-turnstile" data-sitekey={siteKey} data-action="dealer-application" />
        <button type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit application"} <span aria-hidden="true">→</span></button>
      </div>
    </form>
  );
}
