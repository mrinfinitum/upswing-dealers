"use client";

export type GalleryView = "grid" | "list";

export function GalleryViewToggle({ view, onChange }: { view: GalleryView; onChange: (view: GalleryView) => void }) {
  return <div className="gallery-view-toggle" role="group" aria-label="Gallery display">
    <button type="button" aria-pressed={view === "grid"} onClick={() => onChange("grid")}><span aria-hidden="true">▦</span> Grid</button>
    <button type="button" aria-pressed={view === "list"} onClick={() => onChange("list")}><span aria-hidden="true">☰</span> List</button>
  </div>;
}
