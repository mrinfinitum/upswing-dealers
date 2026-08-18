"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GalleryViewToggle, type GalleryView } from "@/components/image-gallery/gallery-view-toggle";
import type { GalleryCategory, GalleryImage } from "@/types/gallery";

const galleryPageSizes = [20, 50, 100] as const;
type GalleryPageSize = typeof galleryPageSizes[number];

function cleanDisplayName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function imageUrl(image: GalleryImage, kind: "thumbnail" | "original") {
  return `/api/dropbox/images/${encodeURIComponent(image.id)}/${kind}`;
}

function categoryDisplay(image: GalleryImage, labels: Map<string, string>) {
  return image.categories.length ? image.categories.map((category) => labels.get(category) ?? category).join(" · ") : "Uncategorized";
}

export function ImageGallery({ images, categories }: { images: GalleryImage[]; categories: GalleryCategory[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [pageSize, setPageSize] = useState<GalleryPageSize>(20);
  const [visibleLimit, setVisibleLimit] = useState(20);
  const [view, setView] = useState<GalleryView>("grid");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const categoryLabels = useMemo(() => new Map(categories.map((category) => [category.slug, category.label])), [categories]);
  const visibleImages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return images
      .filter((image) => (activeCategory === "all" || image.categories.includes(activeCategory)) && (!normalizedQuery || image.name.toLocaleLowerCase().includes(normalizedQuery)))
      .sort((left, right) => {
        const difference = (Date.parse(right.modifiedAt || "") || 0) - (Date.parse(left.modifiedAt || "") || 0);
        return sort === "newest" ? difference : -difference;
      });
  }, [activeCategory, images, query, sort]);
  const displayedImages = visibleImages.slice(0, visibleLimit);
  const hasMore = displayedImages.length < visibleImages.length;
  const selected = selectedIndex === null ? null : visibleImages[selectedIndex];

  useEffect(() => {
    console.info("Image gallery client props", { images: images.length, metadataFetch: false });
  }, [images.length]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleLimit((current) => Math.min(current + pageSize, visibleImages.length));
      }
    }, { rootMargin: "500px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, pageSize, visibleImages.length]);

  const close = useCallback(() => {
    setSelectedIndex(null);
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, []);
  const previous = useCallback(() => setSelectedIndex((current) => current === null ? null : (current - 1 + visibleImages.length) % visibleImages.length), [visibleImages.length]);
  const next = useCallback(() => setSelectedIndex((current) => current === null ? null : (current + 1) % visibleImages.length), [visibleImages.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]")];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, next, previous, selectedIndex]);

  function open(index: number, trigger: HTMLElement) {
    previousFocusRef.current = trigger;
    setSelectedIndex(index);
  }

  function filterBy(category: string) {
    setSelectedIndex(null);
    setActiveCategory(category);
    setVisibleLimit(pageSize);
  }

  function changePageSize(value: number) {
    if (!galleryPageSizes.includes(value as GalleryPageSize)) return;
    setPageSize(value as GalleryPageSize);
    setVisibleLimit(value);
  }

  return <>
    <div className="image-gallery-browser">
      <div className="image-gallery-toolbar">
        <label className="image-gallery-toolbar__search"><span>Search gallery</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleLimit(pageSize); }} placeholder="Search approved imagery" /></label>
        <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as "newest" | "oldest")}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
        <GalleryViewToggle view={view} onChange={setView} />
        <label><span>View</span><select value={pageSize} onChange={(event) => changePageSize(Number(event.target.value))} aria-label="Images loaded per batch">{galleryPageSizes.map((size) => <option value={size} key={size}>{size} at a time</option>)}</select></label>
      </div>
      <div className="image-gallery-categories">
        <div className="image-gallery-categories__pills" aria-label="Filter gallery by category">
          <button type="button" className={activeCategory === "all" ? "is-active" : ""} onClick={() => filterBy("all")}>All <span>{images.length}</span></button>
          {categories.map((category) => <button type="button" className={activeCategory === category.slug ? "is-active" : ""} onClick={() => filterBy(category.slug)} key={category.slug}>{category.label} <span>{images.filter((image) => image.categories.includes(category.slug)).length}</span></button>)}
        </div>
      </div>

      {visibleImages.length ? <section className={`image-gallery-grid${view === "list" ? " is-list" : ""}`} aria-label={`Approved image gallery, ${view} view`}>
      {view === "list" ? <div className="gallery-list-header" aria-hidden="true"><span>Preview</span><span>Category</span><span>Modified</span><span>Action</span></div> : null}
      {displayedImages.map((image, index) => <article className="image-gallery-card" key={image.id}>
        <button type="button" onClick={(event) => open(index, event.currentTarget)} aria-label={`View ${image.name}`}>
          <span className="image-gallery-card__image"><Image src={imageUrl(image, "thumbnail")} alt="" width={640} height={480} sizes="(max-width: 520px) 100vw, (max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw" loading="lazy" decoding="async" unoptimized /></span>
          <span className="image-gallery-card__content"><em>{categoryDisplay(image, categoryLabels)}</em>{image.modifiedAt ? <small>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(image.modifiedAt))}</small> : null}</span>
          <span className="gallery-list-action">View <b aria-hidden="true">→</b></span>
        </button>
      </article>)}
      </section> : <div className="image-gallery-filter-empty"><strong>No images in this category.</strong><button type="button" onClick={() => filterBy("all")}>View all images</button></div>}
      {visibleImages.length ? <div className="image-gallery-pagination" ref={loadMoreRef} aria-live="polite"><span>Showing {displayedImages.length} of {visibleImages.length}</span>{hasMore ? <button type="button" onClick={() => setVisibleLimit((current) => Math.min(current + pageSize, visibleImages.length))}>Load more</button> : <strong>All images loaded</strong>}</div> : null}
    </div>

    {selected ? <div className="image-lightbox" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="image-lightbox__dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Approved image viewer">
        <header><span>Approved image</span><button ref={closeRef} type="button" onClick={close} aria-label="Close image viewer">×</button></header>
        <div className="image-lightbox__stage"><div className="image-lightbox__canvas"><Image key={selected.id} src={imageUrl(selected, "original")} alt={cleanDisplayName(selected.name)} fill sizes="95vw" unoptimized priority /></div></div>
        <footer><div><button type="button" onClick={previous} aria-label="Previous image">← Previous</button><span>{selectedIndex! + 1} / {visibleImages.length}</span><button type="button" onClick={next} aria-label="Next image">Next →</button></div><a className="admin-button admin-button--primary" href={`${imageUrl(selected, "original")}?download=1`}>Download <span aria-hidden="true">↓</span></a></footer>
      </div>
    </div> : null}
  </>;
}

export function GalleryHydrationDiagnostic({ images }: { images: number }) {
  useEffect(() => {
    console.info("Image gallery hydration", { initialImages: images, metadataFetch: false });
  }, [images]);
  return null;
}
