"use client";

import { useActionState, useState } from "react";
import { deleteDealerOrganizationAction } from "@/app/admin/(protected)/dealers/actions";
import { initialPortalFormState } from "@/lib/portal/form-state";

// Only offered once no locations are linked; the server action checks again before deleting.
export function DeleteDealerOrganization({ organization, locationCount, memberCount }: {
  organization: { id: string; name: string };
  locationCount: number;
  memberCount: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteDealerOrganizationAction.bind(null, organization.id), initialPortalFormState);

  if (locationCount) return <p className="admin-form-help">Delete its {locationCount} {locationCount === 1 ? "location" : "locations"} first. A dealer can be deleted once it has no locations.</p>;
  if (!confirming) return <button className="admin-button admin-button--danger" type="button" onClick={() => setConfirming(true)}>Delete dealer</button>;

  return (
    <form action={action} className="admin-delete-confirm">
      <p>Permanently delete {organization.name}? This can’t be undone.{memberCount ? ` Its ${memberCount} portal ${memberCount === 1 ? "user loses" : "users lose"} access; anyone without another dealer is deactivated.` : ""} Its logo is removed.</p>
      {state.message ? <span className="admin-form-error" role="alert">{state.message}</span> : null}
      <button className="admin-button admin-button--danger" disabled={pending} type="submit">{pending ? "Deleting…" : "Confirm delete"}</button>
      <button className="admin-button" type="button" onClick={() => setConfirming(false)}>Cancel</button>
    </form>
  );
}
