"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { importDealerBatchAction } from "@/app/admin/(protected)/locations/new/actions";
import { initialBatchImportState } from "@/lib/admin/batch-import-state";

export function DealerBatchUpload() {
  const [state, action, pending] = useActionState(importDealerBatchAction, initialBatchImportState);
  const [fileName, setFileName] = useState("");
  return (
    <section className="admin-batch-card">
      <div className="admin-batch-card__intro"><p className="eyebrow">Three simple steps</p><ol><li><span>1</span><div><strong>Download the template</strong><small>Start with the approved columns so every record maps correctly.</small></div></li><li><span>2</span><div><strong>Add your locations</strong><small>Use one row per storefront. Keep required address fields complete.</small></div></li><li><span>3</span><div><strong>Upload and review</strong><small>The complete file is validated before any records are added.</small></div></li></ol><div className="admin-batch-template"><span>Need a clean starting point?</span><Link className="admin-button" href="/admin/locations/new/template">Download CSV template <b aria-hidden="true">↓</b></Link></div></div>
      <form action={action} className="admin-batch-form">
        <label className={`admin-file-drop${fileName ? " has-file" : ""}`} htmlFor="dealerFile"><span className="admin-file-drop__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5"/></svg></span><span className="admin-file-drop__type">CSV or XLSX</span><strong>{fileName || "Choose a dealer location file"}</strong><small>{fileName ? "File ready to validate" : "Maximum 4 MB · Up to 500 locations"}</small><span className="admin-file-drop__button">{fileName ? "Choose a different file" : "Browse files"}</span><input id="dealerFile" name="dealerFile" type="file" accept=".csv,.xlsx" required onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} /></label>
        <p className="admin-batch-safety"><span aria-hidden="true">✓</span><span><strong>Nothing is partially imported.</strong> If any row needs attention, the full file is returned with clear row-level errors.</span></p>
        {state.message ? <div className={state.success ? "admin-notice" : "admin-form-error"} role={state.success ? "status" : "alert"}><strong>{state.message}</strong>{state.errors?.length ? <ol>{state.errors.map((error) => <li key={error}>{error}</li>)}</ol> : null}</div> : null}
        <div className="admin-form-actions"><button className="admin-button admin-button--primary admin-add-button" disabled={pending || !fileName} type="submit">{pending ? "Validating file…" : <>Validate and import <span aria-hidden="true">→</span></>}</button><Link className="admin-button" href="/admin/dealers">Cancel</Link></div>
      </form>
    </section>
  );
}
