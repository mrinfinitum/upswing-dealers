"use client";

import { useActionState } from "react";
import { inviteDealerUserAction, updateDealerMembershipAction } from "@/app/admin/(protected)/dealers/actions";
import { initialPortalFormState } from "@/lib/portal/form-state";
import type { PortalPageKey } from "@/types/portal";

const pages: { key: PortalPageKey; label: string; description: string }[] = [
  { key: "dashboard", label: "Overview", description: "Portal home and organization summary" },
  { key: "locations", label: "Locations", description: "Assigned stores and update requests" },
  { key: "brand", label: "Brand resources", description: "Standards and approved downloads" },
];

function PermissionFields({ selected = ["dashboard", "locations", "brand"] }: { selected?: PortalPageKey[] }) {
  return <fieldset className="admin-permissions"><legend>Page access</legend>{pages.map((page) => <label key={page.key}><input type="checkbox" name={`permission-${page.key}`} defaultChecked={selected.includes(page.key)} /><span><strong>{page.label}</strong><small>{page.description}</small></span></label>)}</fieldset>;
}

export function InviteDealerUserForm({ organizations }: { organizations: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(inviteDealerUserAction, initialPortalFormState);
  return <form action={action} className="admin-portal-form"><div className="admin-form-grid"><div className="admin-field"><label htmlFor="dealerDisplayName">Contact name</label><input id="dealerDisplayName" name="displayName" /></div><div className="admin-field"><label htmlFor="dealerEmail">Email</label><input id="dealerEmail" name="email" type="email" required /></div><div className="admin-field admin-field--wide"><label htmlFor="dealerOrganization">Dealer organization</label><select id="dealerOrganization" name="organizationId" required><option value="">Choose organization</option>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></div></div><PermissionFields />{state.message ? <p className={state.success ? "admin-notice" : "admin-form-error"} role="status">{state.message}</p> : null}<button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? "Sending…" : "Invite dealer admin"}</button></form>;
}

export function DealerMembershipForm({ membership }: { membership: { userId: string; organizationId: string; permissions: PortalPageKey[]; active: boolean } }) {
  const [state, action, pending] = useActionState(updateDealerMembershipAction, initialPortalFormState);
  return <form action={action} className="admin-membership-form"><input type="hidden" name="userId" value={membership.userId} /><input type="hidden" name="organizationId" value={membership.organizationId} /><PermissionFields selected={membership.permissions} /><label className="admin-checkbox"><input type="checkbox" name="active" defaultChecked={membership.active} /><span>Membership active</span></label>{state.message ? <p className={state.success ? "admin-notice" : "admin-form-error"} role="status">{state.message}</p> : null}<button className="admin-button" disabled={pending} type="submit">{pending ? "Saving…" : "Save access"}</button></form>;
}
