import Link from "next/link";
import { DealerBatchUpload } from "@/components/admin/dealer-batch-upload";
import { LocationForm } from "@/components/admin/location-form";
import { getMapConfiguration } from "@/lib/maps/provider";

export default async function NewLocationPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  const batchMode = mode === "batch";
  return <div className="admin-page admin-create-dealer-page">
    <Link className="admin-back-link" href="/admin/dealers">← Dealers</Link>
    <div className="admin-page__heading"><div><p className="eyebrow">Dealer network</p><h1>Add dealer</h1><p>Choose the fastest way to add one storefront or an entire dealer network.</p></div></div>

    <nav className="admin-create-methods" aria-label="Dealer creation method">
      <Link href="/admin/locations/new" aria-current={!batchMode ? "page" : undefined}>
        <span className="admin-create-methods__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21s7-5.7 7-12A7 7 0 0 0 5 9c0 6.3 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg></span>
        <span className="admin-create-methods__copy"><small>One storefront</small><strong>Single location</strong><span>Add a store, fitting center, or independent retailer.</span></span>
        <span className="admin-create-methods__action">Use this method <b aria-hidden="true">→</b></span>
      </Link>
      <Link href="/admin/locations/new?mode=batch" aria-current={batchMode ? "page" : undefined}>
        <span className="admin-create-methods__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></span>
        <span className="admin-create-methods__copy"><small>Multiple storefronts</small><strong>Batch upload</strong><span>Import up to 500 locations from CSV or XLSX.</span></span>
        <span className="admin-create-methods__action">Use this method <b aria-hidden="true">→</b></span>
      </Link>
    </nav>

    <section className="admin-create-workspace" aria-labelledby="dealer-workflow-title">
      <header><div><p className="eyebrow">Selected workflow</p><h2 id="dealer-workflow-title">{batchMode ? "Import a dealer network" : "Add one dealer location"}</h2><p>{batchMode ? "Upload the approved template, validate every row, and review imported locations before publishing." : "Enter the location details once. We’ll calculate the map position automatically from the address."}</p></div><span>{batchMode ? "Batch import" : "Single location"}</span></header>
      {batchMode ? <DealerBatchUpload /> : <div className="admin-create-single"><LocationForm mapConfig={getMapConfiguration()} cancelHref="/admin/dealers" /><aside className="admin-create-guide"><p className="eyebrow">Before you begin</p><h3>Have these details ready.</h3><ul><li><span>01</span><div><strong>Dealer identity</strong><small>Retailer name and a recognizable location name.</small></div></li><li><span>02</span><div><strong>Complete address</strong><small>A precise street address lets Google place the map marker safely.</small></div></li><li><span>03</span><div><strong>Contact details</strong><small>Phone and website make the public dealer card more useful.</small></div></li></ul><div><strong>Safe by default</strong><p>New locations begin unverified. They only appear publicly after an administrator verifies the record.</p></div></aside></div>}
    </section>
  </div>;
}
