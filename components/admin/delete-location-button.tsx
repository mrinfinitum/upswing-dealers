"use client";

import { useState } from "react";
import { deleteLocationAction } from "@/app/admin/actions";

export function DeleteLocationButton({ id, name, returnTo }: { id: string; name: string; returnTo: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) return <button className="admin-danger-link" type="button" onClick={() => setConfirming(true)}>Delete location</button>;
  return (
    <div className="admin-delete-confirm" role="alert">
      <p>Delete {name}? This cannot be undone.</p>
      <form action={deleteLocationAction.bind(null, id, returnTo)}><button className="admin-button admin-button--danger" type="submit">Yes, delete</button></form>
      <button className="admin-button" type="button" onClick={() => setConfirming(false)}>Cancel</button>
    </div>
  );
}
