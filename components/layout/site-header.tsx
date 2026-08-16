import Image from "next/image";

const links = [
  ["Home", "https://www.upswinggolf.com/"],
  ["Galaxy", "https://www.upswinggolf.com/pages/upswing-galaxy"],
  ["Products", "https://www.upswinggolf.com/collections/get-an-edge-on-competition-with-upswing"],
  ["Find Your Fit", "https://www.upswinggolf.com/pages/virtual-fitting-tool"],
  ["About UpSwing", "https://www.upswinggolf.com/pages/our-story-2"],
  ["Shop", "https://www.upswinggolf.com/collections"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a href="https://www.upswinggolf.com/" aria-label="UpSwing Golf home">
          <Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={345} height={159} className="site-header__logo" style={{ height: "auto" }} priority />
        </a>
        <nav className="site-header__desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          <a href="#locator" aria-current="page" className="is-current">Dealers</a>
        </nav>
        <div className="site-header__actions" aria-label="UpSwing store links">
          <a className="site-header__actions-contact" href="https://www.upswinggolf.com/pages/contact">Contact us</a>
          <a className="site-header__actions-shop" href="https://www.upswinggolf.com/collections/new-feature-block">Shop clubs <span aria-hidden="true">↗</span></a>
          <a className="site-header__actions-cart" href="https://www.upswinggolf.com/cart" aria-label="View cart on UpSwing Golf">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 8.5h11l1 12h-13l1-12Z" /><path d="M9 9V6.5a3 3 0 0 1 6 0V9" /></svg>
          </a>
        </div>
        <details className="site-header__mobile-menu">
          <summary aria-label="Open navigation"><span /><span /><span /></summary>
          <nav aria-label="Mobile navigation">
            <a href="#locator" aria-current="page">Dealer Locator</a>
            {links.map(([label, href]) => <a key={label} href={href}>{label}<span aria-hidden="true">↗</span></a>)}
            <a href="https://www.upswinggolf.com/pages/contact">Contact Us<span aria-hidden="true">↗</span></a>
            <a href="https://www.upswinggolf.com/cart">View Cart<span aria-hidden="true">↗</span></a>
          </nav>
        </details>
      </div>
    </header>
  );
}
