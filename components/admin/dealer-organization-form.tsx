"use client";

import { useActionState } from "react";
import { updateDealerOrganizationAction } from "@/app/admin/(protected)/dealers/actions";
import { initialPortalFormState } from "@/lib/portal/form-state";

export function DealerOrganizationForm({ organization }: { organization: { id: string; name: string; slug: string; active: boolean } }) {
  const [state, action, pending] = useActionState(updateDealerOrganizationAction, initialPortalFormState);
  return (
    <form action={action} className="admin-organization-form">
      <input type="hidden" name="organizationId" value={organization.id} />
      <div className="admin-field"><label htmlFor="organizationName">Dealer name</label><input id="organizationName" name="name" defaultValue={organization.name} required /></div>
      <div className="admin-field"><label htmlFor="organizationSlug">Portal identifier</label><input id="organizationSlug" value={organization.slug} readOnly aria-describedby="organizationSlugHelp" /><small id="organizationSlugHelp">Stable identifier; changing it requires a database migration.</small></div>
      <label className="admin-checkbox"><input type="checkbox" name="active" defaultChecked={organization.active} /><span>Dealer organization active</span></label>
      {state.message ? <p className={state.success ? "admin-notice" : "admin-form-error"} role="status">{state.message}</p> : null}
      <button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? "Saving…" : "Save dealer details"}</button>
    </form>
  );
}
