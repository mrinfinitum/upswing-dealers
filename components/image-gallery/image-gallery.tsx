"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryImage } from "@/types/gallery";

function cleanDisplayName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function imageUrl(image: GalleryImage, kind: "thumbnail" | "original") {
  return `/api/dropbox/images/${encodeURIComponent(image.id)}/${kind}`;
}

export function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const selected = selectedIndex === null ? null : images[selectedIndex];

  useEffect(() => {
    console.info("Image gallery client props", { images: images.length, metadataFetch: false });
  }, [images.length]);

  const close = useCallback(() => {
    setSelectedIndex(null);
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, []);
  const previous = useCallback(() => setSelectedIndex((current) => current === null ? null : (current - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setSelectedIndex((current) => current === null ? null : (current + 1) % images.length), [images.length]);

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

  return <>
    <section className="image-gallery-grid" aria-label="Approved image gallery">
      {images.map((image, index) => <article className="image-gallery-card" key={image.id}>
        <button type="button" onClick={(event) => open(index, event.currentTarget)} aria-label={`View ${image.name}`}>
          <span className="image-gallery-card__image"><Image src={imageUrl(image, "thumbnail")} alt="" width={640} height={480} sizes="(max-width: 520px) 100vw, (max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw" unoptimized /></span>
          <span className="image-gallery-card__content"><strong>{cleanDisplayName(image.name)}</strong>{image.modifiedAt ? <small>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(image.modifiedAt))}</small> : null}<i>View image <span aria-hidden="true">↗</span></i></span>
        </button>
      </article>)}
    </section>

    {selected ? <div className="image-lightbox" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="image-lightbox__dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="image-lightbox-title">
        <header><div><span>Approved image</span><h2 id="image-lightbox-title">{selected.name}</h2></div><button ref={closeRef} type="button" onClick={close} aria-label="Close image viewer">×</button></header>
        <div className="image-lightbox__stage"><Image key={selected.id} src={imageUrl(selected, "original")} alt={cleanDisplayName(selected.name)} width={selected.width || 1600} height={selected.height || 1200} sizes="95vw" unoptimized priority /></div>
        <footer><div><button type="button" onClick={previous} aria-label="Previous image">← Previous</button><span>{selectedIndex! + 1} / {images.length}</span><button type="button" onClick={next} aria-label="Next image">Next →</button></div><a className="admin-button admin-button--primary" href={`${imageUrl(selected, "original")}?download=1`}>Download <span aria-hidden="true">↓</span></a></footer>
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
