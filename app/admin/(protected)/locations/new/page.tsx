import { LocationForm } from "@/components/admin/location-form";
import { getMapConfiguration } from "@/lib/maps/provider";

export default function NewLocationPage() {
  return <div className="admin-page admin-page--form"><div className="admin-page__heading"><div><p className="eyebrow">Dealer network</p><h1>Add location</h1><p>Create a new managed dealer record.</p></div></div><LocationForm mapConfig={getMapConfiguration()} /></div>;
}
