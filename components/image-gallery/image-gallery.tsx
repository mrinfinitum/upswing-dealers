"use client";

import Image from "next/image";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { assignGalleryCategoryAction } from "@/app/image-gallery/actions";
import { initialGalleryCategoryActionState } from "@/lib/gallery/category-form-state";
import { galleryCategories, type GalleryCategory, type GalleryImage } from "@/types/gallery";

const categoryLabels: Record<GalleryCategory, string> = { upswing: "UpSwing", galaxy: "Galaxy", accessories: "Accessories" };

function cleanDisplayName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function imageUrl(image: GalleryImage, kind: "thumbnail" | "original") {
  return `/api/dropbox/images/${encodeURIComponent(image.id)}/${kind}`;
}

export function ImageGallery({ images, canManageCategories = false }: { images: GalleryImage[]; canManageCategories?: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | GalleryCategory>("all");
  const [managingCategories, setManagingCategories] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryState, categoryAction, categoryPending] = useActionState(assignGalleryCategoryAction, initialGalleryCategoryActionState);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const visibleImages = useMemo(() => activeCategory === "all" ? images : images.filter((image) => image.category === activeCategory), [activeCategory, images]);
  const selected = selectedIndex === null ? null : visibleImages[selectedIndex];

  useEffect(() => {
    console.info("Image gallery client props", { images: images.length, metadataFetch: false });
  }, [images.length]);

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
    if (managingCategories) {
      const id = visibleImages[index].id;
      setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
      return;
    }
    previousFocusRef.current = trigger;
    setSelectedIndex(index);
  }

  function filterBy(category: "all" | GalleryCategory) {
    setSelectedIndex(null);
    setActiveCategory(category);
  }

  return <>
    <form action={categoryAction} className="image-gallery-browser">
      <div className="image-gallery-categories">
        <div className="image-gallery-categories__pills" aria-label="Filter gallery by category">
          <button type="button" className={activeCategory === "all" ? "is-active" : ""} onClick={() => filterBy("all")}>All <span>{images.length}</span></button>
          {galleryCategories.map((category) => <button type="button" className={activeCategory === category ? "is-active" : ""} onClick={() => filterBy(category)} key={category}>{categoryLabels[category]} <span>{images.filter((image) => image.category === category).length}</span></button>)}
        </div>
        {canManageCategories ? <button className={`image-gallery-manage${managingCategories ? " is-active" : ""}`} type="button" onClick={() => { setManagingCategories((current) => !current); setSelectedIds([]); }}>{managingCategories ? "Done assigning" : "Assign categories"}</button> : null}
      </div>

      {canManageCategories && managingCategories ? <div className="image-gallery-bulk" aria-label="Bulk category assignment">
        <div><strong>{selectedIds.length} selected</strong><span>Select image cards, then choose a category.</span></div>
        <div>{selectedIds.map((id) => <input type="hidden" name="imageId" value={id} key={id} />)}{galleryCategories.map((category) => <button type="submit" name="category" value={category} disabled={!selectedIds.length || categoryPending} key={category}>{categoryLabels[category]}</button>)}</div>
      </div> : null}
      {categoryState.message ? <p className={categoryState.success ? "image-gallery-message is-success" : "image-gallery-message"} role="status">{categoryState.message}</p> : null}

      {visibleImages.length ? <section className="image-gallery-grid" aria-label="Approved image gallery">
      {visibleImages.map((image, index) => <article className={`image-gallery-card${selectedIds.includes(image.id) ? " is-selected" : ""}`} key={image.id}>
        <button type="button" onClick={(event) => open(index, event.currentTarget)} aria-label={managingCategories ? `${selectedIds.includes(image.id) ? "Deselect" : "Select"} ${image.name}` : `View ${image.name}`} aria-pressed={managingCategories ? selectedIds.includes(image.id) : undefined}>
          {managingCategories ? <span className="image-gallery-card__select" aria-hidden="true">{selectedIds.includes(image.id) ? "✓" : ""}</span> : null}
          <span className="image-gallery-card__image"><Image src={imageUrl(image, "thumbnail")} alt="" width={640} height={480} sizes="(max-width: 520px) 100vw, (max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw" unoptimized /></span>
          <span className="image-gallery-card__content"><em>{image.category ? categoryLabels[image.category] : "Uncategorized"}</em><strong>{cleanDisplayName(image.name)}</strong>{image.modifiedAt ? <small>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(image.modifiedAt))}</small> : null}<i>{managingCategories ? "Select image" : "View image"} <span aria-hidden="true">{managingCategories ? "+" : "↗"}</span></i></span>
        </button>
      </article>)}
      </section> : <div className="image-gallery-filter-empty"><strong>No images in this category.</strong><button type="button" onClick={() => filterBy("all")}>View all images</button></div>}
    </form>

    {selected ? <div className="image-lightbox" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="image-lightbox__dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="image-lightbox-title">
        <header><div><span>Approved image</span><h2 id="image-lightbox-title">{selected.name}</h2></div><button ref={closeRef} type="button" onClick={close} aria-label="Close image viewer">×</button></header>
        <div className="image-lightbox__stage"><Image key={selected.id} src={imageUrl(selected, "original")} alt={cleanDisplayName(selected.name)} width={selected.width || 1600} height={selected.height || 1200} sizes="95vw" unoptimized priority /></div>
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
