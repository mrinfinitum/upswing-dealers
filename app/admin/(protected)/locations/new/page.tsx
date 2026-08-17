import Link from "next/link";
import { DealerBatchUpload } from "@/components/admin/dealer-batch-upload";
import { LocationForm } from "@/components/admin/location-form";
import { getMapConfiguration } from "@/lib/maps/provider";

export default async function NewLocationPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  const batchMode = mode === "batch";
  return <div className={`admin-page admin-create-dealer-page${batchMode ? " admin-create-dealer-page--batch" : " admin-page--form"}`}><Link className="admin-back-link" href="/admin/dealers">← Dealers</Link><div className="admin-page__heading"><div><p className="eyebrow">Dealer network</p><h1>Add dealer</h1><p>Create one location or import an existing multi-location dealer network.</p></div></div><nav className="admin-create-mode" aria-label="Dealer creation mode"><Link href="/admin/locations/new" aria-current={!batchMode ? "page" : undefined}>Single location</Link><Link href="/admin/locations/new?mode=batch" aria-current={batchMode ? "page" : undefined}>Batch upload</Link></nav>{batchMode ? <DealerBatchUpload /> : <LocationForm mapConfig={getMapConfiguration()} cancelHref="/admin/dealers" />}</div>;
}
