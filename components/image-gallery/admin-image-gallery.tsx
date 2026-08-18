"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { assignGalleryCategoryAction } from "@/app/image-gallery/actions";
import { GalleryViewToggle, type GalleryView } from "@/components/image-gallery/gallery-view-toggle";
import { initialGalleryCategoryActionState } from "@/lib/gallery/category-form-state";
import { galleryCategories, type GalleryCategory, type GalleryImage } from "@/types/gallery";

const categoryLabels: Record<GalleryCategory, string> = { upswing: "UpSwing", galaxy: "Galaxy", accessories: "Accessories" };
const pageSizes = [20, 50, 100] as const;
type PageSize = typeof pageSizes[number];
type CategoryFilter = "all" | "uncategorized" | GalleryCategory;

function thumbnailUrl(image: GalleryImage) {
  return `/api/dropbox/images/${encodeURIComponent(image.id)}/thumbnail`;
}

export function AdminImageGallery({ images }: { images: GalleryImage[] }) {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [visibleLimit, setVisibleLimit] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<GalleryView>("grid");
  const [state, action, pending] = useActionState(assignGalleryCategoryAction, initialGalleryCategoryActionState);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const counts = useMemo<Record<CategoryFilter, number>>(() => {
    const categoryCounts = Object.fromEntries(galleryCategories.map((category) => [category, images.filter((image) => image.category === category).length])) as Record<GalleryCategory, number>;
    return { all: images.length, uncategorized: images.filter((image) => !image.category).length, ...categoryCounts };
  }, [images]);

  const filteredImages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return images.filter((image) => {
      const categoryMatches = filter === "all" || (filter === "uncategorized" ? !image.category : image.category === filter);
      const queryMatches = !normalizedQuery || image.name.toLocaleLowerCase().includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
  }, [filter, images, query]);

  const displayedImages = filteredImages.slice(0, visibleLimit);
  const hasMore = displayedImages.length < filteredImages.length;
  const displayedIds = displayedImages.map((image) => image.id);
  const allDisplayedSelected = displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleLimit((current) => Math.min(current + pageSize, filteredImages.length));
      }
    }, { rootMargin: "500px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [filteredImages.length, hasMore, pageSize]);

  function changeFilter(nextFilter: CategoryFilter) {
    setFilter(nextFilter);
    setVisibleLimit(pageSize);
    setSelectedIds([]);
  }

  function changePageSize(value: number) {
    if (!pageSizes.includes(value as PageSize)) return;
    setPageSize(value as PageSize);
    setVisibleLimit(value);
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : current.length < 500 ? [...current, id] : current);
  }

  function toggleDisplayedSelection() {
    setSelectedIds((current) => {
      if (allDisplayedSelected) return current.filter((id) => !displayedIds.includes(id));
      return Array.from(new Set([...current, ...displayedIds])).slice(0, 500);
    });
  }

  return <form action={action} className="gallery-admin-workspace">
    <section className="gallery-admin-summary" aria-label="Gallery category summary">
      <button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => changeFilter("all")}><span>Total images</span><strong>{counts.all}</strong><small>Entire Dropbox library</small></button>
      <button type="button" className={filter === "uncategorized" ? "is-active" : ""} onClick={() => changeFilter("uncategorized")}><span>Needs category</span><strong>{counts.uncategorized}</strong><small>Ready for review</small></button>
      {galleryCategories.map((category) => <button type="button" className={filter === category ? "is-active" : ""} onClick={() => changeFilter(category)} key={category}><span>{categoryLabels[category]}</span><strong>{counts[category]}</strong><small>Dealer-facing assets</small></button>)}
    </section>

    <section className="gallery-admin-controls" aria-label="Gallery management controls">
      <label className="gallery-admin-search"><span>Search assets</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleLimit(pageSize); setSelectedIds([]); }} placeholder="Search by filename" /></label>
      <label className="gallery-admin-view"><span>View</span><select value={pageSize} onChange={(event) => changePageSize(Number(event.target.value))}>{pageSizes.map((size) => <option value={size} key={size}>{size} at a time</option>)}</select></label>
      <GalleryViewToggle view={view} onChange={setView} />
      <div className="gallery-admin-selection"><span>{selectedIds.length} selected</span><button type="button" onClick={toggleDisplayedSelection}>{allDisplayedSelected ? "Deselect visible" : "Select visible"}</button>{selectedIds.length ? <button type="button" onClick={() => setSelectedIds([])}>Clear</button> : null}</div>
    </section>

    {selectedIds.length ? <section className="gallery-admin-bulk" aria-label="Bulk category assignment">
      <div><span>Bulk assignment</span><strong>Assign {selectedIds.length} {selectedIds.length === 1 ? "image" : "images"}</strong><p>Choose the category dealers will use to find these assets.</p></div>
      <div>{selectedIds.map((id) => <input type="hidden" name="imageId" value={id} key={id} />)}{galleryCategories.map((category) => <button type="submit" name="category" value={category} disabled={pending} key={category}>{pending ? "Saving…" : categoryLabels[category]}</button>)}</div>
    </section> : null}

    {state.message ? <p className={state.success ? "gallery-admin-message is-success" : "gallery-admin-message"} role="status">{state.message}</p> : null}

    {displayedImages.length ? <section className={`gallery-admin-grid${view === "list" ? " is-list" : ""}`} aria-label={`Manage approved gallery images, ${view} view`}>
      {view === "list" ? <div className="gallery-list-header gallery-list-header--admin" aria-hidden="true"><span>Preview</span><span>Category</span><span>Modified</span></div> : null}
      {displayedImages.map((image) => {
        const selected = selectedIds.includes(image.id);
        return <article className={selected ? "is-selected" : ""} key={image.id}>
          <button type="button" onClick={() => toggleSelection(image.id)} aria-pressed={selected} aria-label={`${selected ? "Deselect" : "Select"} ${image.name}`}>
            <span className="gallery-admin-card__image"><Image src={thumbnailUrl(image)} alt="" width={640} height={480} sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, (max-width: 1250px) 33vw, 25vw" loading="lazy" decoding="async" unoptimized /><span className="gallery-admin-card__check" aria-hidden="true">{selected ? "✓" : ""}</span></span>
            <span className="gallery-admin-card__meta"><em>{image.category ? categoryLabels[image.category] : "Uncategorized"}</em>{image.modifiedAt ? <small>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(image.modifiedAt))}</small> : null}</span>
          </button>
        </article>;
      })}
    </section> : <div className="gallery-admin-empty"><strong>No matching assets</strong><p>Try another category or clear the filename search.</p><button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Clear filters</button></div>}

    {filteredImages.length ? <div className="image-gallery-pagination" ref={loadMoreRef} aria-live="polite"><span>Showing {displayedImages.length} of {filteredImages.length}</span>{hasMore ? <button type="button" onClick={() => setVisibleLimit((current) => Math.min(current + pageSize, filteredImages.length))}>Load more</button> : <strong>All images loaded</strong>}</div> : null}
  </form>;
}
