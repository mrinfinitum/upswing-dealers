"use client";

import { useActionState } from "react";
import { updateDealerMembershipAction } from "@/app/admin/(protected)/dealers/actions";
import { initialPortalFormState } from "@/lib/portal/form-state";
import type { PortalPageKey } from "@/types/portal";

const pages: { key: PortalPageKey; label: string; description: string }[] = [
  { key: "dashboard", label: "Overview", description: "Portal home and organization summary" },
  { key: "locations", label: "Locations", description: "View assigned dealer locations" },
  { key: "brand", label: "Brand resources", description: "Standards and approved downloads" },
];

function PermissionFields({ selected = ["dashboard", "locations", "brand"] }: { selected?: PortalPageKey[] }) {
  return <fieldset className="admin-permissions"><legend>Page access</legend>{pages.map((page) => <label key={page.key}><input type="checkbox" name={`permission-${page.key}`} defaultChecked={selected.includes(page.key)} /><span><strong>{page.label}</strong><small>{page.description}</small></span></label>)}</fieldset>;
}

export function DealerMembershipForm({ membership }: { membership: { userId: string; organizationId: string; permissions: PortalPageKey[]; active: boolean } }) {
  const [state, action, pending] = useActionState(updateDealerMembershipAction, initialPortalFormState);
  return <form action={action} className="admin-membership-form"><input type="hidden" name="userId" value={membership.userId} /><input type="hidden" name="organizationId" value={membership.organizationId} /><PermissionFields selected={membership.permissions} /><label className="admin-checkbox"><input type="checkbox" name="active" defaultChecked={membership.active} /><span>Membership active</span></label>{state.message ? <p className={state.success ? "admin-notice" : "admin-form-error"} role="status">{state.message}</p> : null}<button className="admin-button" disabled={pending} type="submit">{pending ? "Saving…" : "Save access"}</button></form>;
}
