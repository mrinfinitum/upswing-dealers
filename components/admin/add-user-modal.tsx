"use client";

import { useRef, type MouseEvent } from "react";
import { AddUserForm } from "@/components/admin/add-user-form";

export function AddUserModal({ organizations }: { organizations: { id: string; name: string }[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) event.currentTarget.close();
  }

  return (
    <>
      <button className="admin-button admin-button--primary admin-add-button" type="button" onClick={() => dialogRef.current?.showModal()}>
        Add user <span aria-hidden="true">＋</span>
      </button>
      <dialog aria-labelledby="add-user-dialog-title" className="admin-user-modal" onClick={closeOnBackdrop} ref={dialogRef}>
        <div className="admin-user-modal__card">
          <header className="admin-user-modal__header">
            <div>
              <p className="eyebrow">Account provisioning</p>
              <h2 id="add-user-dialog-title">Add user</h2>
              <p>Create an active account, choose its role, and assign dealer access.</p>
            </div>
            <button aria-label="Close add user form" className="admin-user-modal__close" onClick={() => dialogRef.current?.close()} type="button">×</button>
          </header>
          <AddUserForm organizations={organizations} />
        </div>
      </dialog>
    </>
  );
}
