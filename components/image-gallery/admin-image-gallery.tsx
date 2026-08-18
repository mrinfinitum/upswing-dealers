"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createGalleryCategoryAction, updateGalleryCategoryAction } from "@/app/image-gallery/actions";
import { GalleryViewToggle, type GalleryView } from "@/components/image-gallery/gallery-view-toggle";
import { initialGalleryCategoryActionState } from "@/lib/gallery/category-form-state";
import type { GalleryCategory, GalleryImage } from "@/types/gallery";

const pageSizes = [20, 50, 100] as const;
type PageSize = typeof pageSizes[number];
type CategoryFilter = "all" | "uncategorized" | string;

function thumbnailUrl(image: GalleryImage) {
  return `/api/dropbox/images/${encodeURIComponent(image.id)}/thumbnail`;
}

export function AdminImageGallery({ images, categories }: { images: GalleryImage[]; categories: GalleryCategory[] }) {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [visibleLimit, setVisibleLimit] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<GalleryView>("grid");
  const [state, action, pending] = useActionState(updateGalleryCategoryAction, initialGalleryCategoryActionState);
  const [createState, createAction, creating] = useActionState(createGalleryCategoryAction, initialGalleryCategoryActionState);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const counts = useMemo<Record<string, number>>(() => {
    const categoryCounts = Object.fromEntries(categories.map((category) => [category.slug, images.filter((image) => image.categories.includes(category.slug)).length]));
    return { all: images.length, uncategorized: images.filter((image) => !image.categories.length).length, ...categoryCounts };
  }, [categories, images]);

  const filteredImages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return images
      .filter((image) => {
        const categoryMatches = filter === "all" || (filter === "uncategorized" ? !image.categories.length : image.categories.includes(filter));
        const queryMatches = !normalizedQuery || image.name.toLocaleLowerCase().includes(normalizedQuery);
        return categoryMatches && queryMatches;
      })
      .sort((left, right) => {
        const difference = (Date.parse(right.modifiedAt || "") || 0) - (Date.parse(left.modifiedAt || "") || 0);
        return sort === "newest" ? difference : -difference;
      });
  }, [filter, images, query, sort]);

  const displayedImages = filteredImages.slice(0, visibleLimit);
  const hasMore = displayedImages.length < filteredImages.length;
  const displayedIds = displayedImages.map((image) => image.id);
  const allDisplayedSelected = displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));
  const selectedImages = images.filter((image) => selectedIds.includes(image.id));

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

  return <div className="gallery-admin-workspace">
    <section className="gallery-admin-controls" aria-label="Gallery management controls">
      <label className="gallery-admin-search"><span>Search assets</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleLimit(pageSize); setSelectedIds([]); }} placeholder="Search by filename" /></label>
      <label className="gallery-admin-sort"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as "newest" | "oldest")}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      <label className="gallery-admin-view"><span>View</span><select value={pageSize} onChange={(event) => changePageSize(Number(event.target.value))}>{pageSizes.map((size) => <option value={size} key={size}>{size} at a time</option>)}</select></label>
      <GalleryViewToggle view={view} onChange={setView} />
      <div className="gallery-admin-selection"><span>{selectedIds.length} selected</span><button type="button" onClick={toggleDisplayedSelection}>{allDisplayedSelected ? "Deselect visible" : "Select visible"}</button>{selectedIds.length ? <button type="button" onClick={() => setSelectedIds([])}>Clear</button> : null}</div>
    </section>

    <nav className="gallery-admin-filters" aria-label="Filter gallery by category">
      <button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => changeFilter("all")}>All <span>{counts.all}</span></button>
      <button type="button" className={filter === "uncategorized" ? "is-active" : ""} onClick={() => changeFilter("uncategorized")}>Uncategorized <span>{counts.uncategorized}</span></button>
      {categories.map((category) => <button type="button" className={filter === category.slug ? "is-active" : ""} onClick={() => changeFilter(category.slug)} key={category.slug}>{category.label} <span>{counts[category.slug] ?? 0}</span></button>)}
    </nav>

    <section className="gallery-admin-category-create" aria-label="Create gallery category">
      <div><span>Category library</span><strong>Add a category</strong><p>New categories become available in the admin workspace and dealer gallery filters.</p></div>
      <form action={createAction}><label><span>Category name</span><input key={createState.revision} name="label" type="text" minLength={2} maxLength={40} placeholder="For example: Lifestyle" required /></label><button type="submit" disabled={creating}>{creating ? "Adding…" : "Add category"}</button></form>
      {createState.message ? <p className={createState.success ? "gallery-admin-message is-success" : "gallery-admin-message"} role="status">{createState.message}</p> : null}
    </section>

    {selectedIds.length ? <form action={action} className="gallery-admin-bulk" aria-label="Automatic bulk category assignment">
      <div><span>Auto-save categories</span><strong>{selectedIds.length} {selectedIds.length === 1 ? "image" : "images"} selected</strong><p>Categories save immediately. Active categories can be removed without affecting the others.</p></div>
      <div>{selectedIds.map((id) => <input type="hidden" name="imageId" value={id} key={id} />)}{categories.map((category) => {
        const assignedToAll = selectedImages.every((image) => image.categories.includes(category.slug));
        const assignedToSome = !assignedToAll && selectedImages.some((image) => image.categories.includes(category.slug));
        return <button type="submit" name="categoryAction" value={`${assignedToAll ? "remove" : "add"}:${category.slug}`} className={assignedToAll ? "is-active" : assignedToSome ? "is-mixed" : ""} aria-pressed={assignedToAll} disabled={pending} key={category.slug}>{pending ? "Saving…" : `${assignedToAll ? "✓" : assignedToSome ? "±" : "+"} ${category.label}`}</button>;
      })}</div>
    </form> : null}

    {state.message ? <p className={state.success ? "gallery-admin-message is-success" : "gallery-admin-message"} role="status">{state.message}</p> : null}

    {displayedImages.length ? <section className={`gallery-admin-grid${view === "list" ? " is-list" : ""}`} aria-label={`Manage approved gallery images, ${view} view`}>
      {view === "list" ? <div className="gallery-list-header gallery-list-header--admin" aria-hidden="true"><span>Preview</span><span>Categories</span><span>Modified</span></div> : null}
      {displayedImages.map((image) => {
        const selected = selectedIds.includes(image.id);
        return <article className={selected ? "is-selected" : ""} key={image.id}>
          <button className="gallery-admin-card__preview" type="button" onClick={() => toggleSelection(image.id)} aria-pressed={selected} aria-label={`${selected ? "Deselect" : "Select"} ${image.name}`}>
            <span className="gallery-admin-card__image"><Image src={thumbnailUrl(image)} alt="" width={640} height={480} sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, (max-width: 1250px) 33vw, 25vw" loading="lazy" decoding="async" unoptimized /><span className="gallery-admin-card__check" aria-hidden="true">{selected ? "✓" : ""}</span></span>
          </button>
          <div className="gallery-admin-card__details">
            <form action={action} className="gallery-admin-card__categories" aria-label={`Categories for ${image.name}`}>
              <input type="hidden" name="imageId" value={image.id} />
              {categories.map((category) => {
                const active = image.categories.includes(category.slug);
                return <button type="submit" name="categoryAction" value={`${active ? "remove" : "add"}:${category.slug}`} className={active ? "is-active" : ""} aria-pressed={active} disabled={pending} key={category.slug}>{active ? "✓ " : "+ "}{category.label}</button>;
              })}
            </form>
            {image.modifiedAt ? <small>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(image.modifiedAt))}</small> : null}
          </div>
        </article>;
      })}
    </section> : <div className="gallery-admin-empty"><strong>No matching assets</strong><p>Try another category or clear the filename search.</p><button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Clear filters</button></div>}

    {filteredImages.length ? <div className="image-gallery-pagination" ref={loadMoreRef} aria-live="polite"><span>Showing {displayedImages.length} of {filteredImages.length}</span>{hasMore ? <button type="button" onClick={() => setVisibleLimit((current) => Math.min(current + pageSize, filteredImages.length))}>Load more</button> : <strong>All images loaded</strong>}</div> : null}
  </div>;
}
