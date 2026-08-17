"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importDealerBatchAction } from "@/app/admin/(protected)/locations/new/actions";
import { initialBatchImportState } from "@/lib/admin/batch-import-state";

export function DealerBatchUpload() {
  const [state, action, pending] = useActionState(importDealerBatchAction, initialBatchImportState);
  return (
    <section className="admin-batch-card">
      <div className="admin-batch-card__intro"><p className="eyebrow">Multiple locations</p><h2>Upload dealer locations</h2><p>Import up to 500 locations in one all-or-nothing batch. Uploaded records remain unverified and unpublished until an administrator reviews them.</p><div className="admin-batch-template"><span>Start with the approved column structure.</span><Link className="admin-button" href="/admin/locations/new/template">Download CSV template ↓</Link></div></div>
      <form action={action} className="admin-batch-form">
        <label className="admin-file-drop" htmlFor="dealerFile"><span>CSV or XLSX</span><strong>Choose a dealer location file</strong><small>Maximum 4 MB · Legacy .xls should be saved as .xlsx or CSV</small><input id="dealerFile" name="dealerFile" type="file" accept=".csv,.xlsx" required /></label>
        {state.message ? <div className={state.success ? "admin-notice" : "admin-form-error"} role={state.success ? "status" : "alert"}><strong>{state.message}</strong>{state.errors?.length ? <ol>{state.errors.map((error) => <li key={error}>{error}</li>)}</ol> : null}</div> : null}
        <div className="admin-form-actions"><button className="admin-button admin-button--primary admin-add-button" disabled={pending} type="submit">{pending ? "Validating file…" : <>Upload locations <span aria-hidden="true">＋</span></>}</button><Link className="admin-button" href="/admin/dealers">Cancel</Link></div>
      </form>
    </section>
  );
}
