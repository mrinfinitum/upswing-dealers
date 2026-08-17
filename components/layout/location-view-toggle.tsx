import Link from "next/link";

export type LocationView = "grid" | "list";

export function LocationViewToggle({ basePath, view }: { basePath: string; view: LocationView }) {
  return (
    <nav className="location-view-toggle" aria-label="Location display">
      <Link href={`${basePath}?view=grid`} aria-current={view === "grid" ? "page" : undefined}><span aria-hidden="true">▦</span> Grid</Link>
      <Link href={`${basePath}?view=list`} aria-current={view === "list" ? "page" : undefined}><span aria-hidden="true">☰</span> List</Link>
    </nav>
  );
}
