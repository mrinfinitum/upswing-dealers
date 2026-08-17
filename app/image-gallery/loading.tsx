export default function ImageGalleryLoading() {
  return <div className="image-gallery-page" aria-busy="true" aria-label="Loading image gallery">
    <header className="image-gallery-heading"><div><p className="eyebrow">UpSwing media library</p><h1>Image Gallery</h1><p>Loading approved imagery…</p></div></header>
    <div className="image-gallery-skeleton" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <div key={index}><span /><i /><i /></div>)}</div>
  </div>;
}
