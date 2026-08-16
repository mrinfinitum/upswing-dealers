import Image from "next/image";

const links = [
  ["Home", "https://www.upswinggolf.com/"],
  ["Galaxy", "https://www.upswinggolf.com/pages/upswing-galaxy"],
  ["Products", "https://www.upswinggolf.com/collections/get-an-edge-on-competition-with-upswing"],
  ["Find Your Fit", "https://www.upswinggolf.com/pages/virtual-fitting-tool"],
  ["About UpSwing", "https://www.upswinggolf.com/pages/our-story-2"],
  ["Contact Us", "https://www.upswinggolf.com/pages/contact"],
  ["Shop", "https://www.upswinggolf.com/collections"],
] as const;

function AccountIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m1 22 3.3-4h15.4l3.3 4M18 8.24a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" /></svg>;
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M10.1 17.7a7.6 7.6 0 1 0 0-15.2 7.6 7.6 0 0 0 0 15.2Zm11.4 3.8-5.7-5.7" /></svg>;
}

function CartIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M1 3h3.5L8 17h13.5V8H9" /><circle cx="8" cy="21" r="1.25" /><circle cx="20" cy="21" r="1.25" /></svg>;
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__desktop-logo" href="https://www.upswinggolf.com/" aria-label="UpSwing Golf home">
          <Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={345} height={159} className="site-header__logo" style={{ height: "auto" }} priority />
        </a>
        <nav className="site-header__desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>
        <div className="site-header__actions" aria-label="UpSwing store links">
          <a href="https://www.upswinggolf.com/account" aria-label="My account on UpSwing Golf"><AccountIcon /></a>
          <a href="https://www.upswinggolf.com/search" aria-label="Search UpSwing Golf"><SearchIcon /></a>
          <a href="https://www.upswinggolf.com/cart" aria-label="View cart on UpSwing Golf"><CartIcon /></a>
        </div>
        <div className="site-header__mobile-bar">
          <details className="site-header__mobile-menu">
            <summary aria-label="Open navigation"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M16 6H3M23 12H3M11 18H3" /></svg></summary>
            <nav aria-label="Mobile navigation">
              {links.map(([label, href]) => <a key={label} href={href}>{label}<span aria-hidden="true">↗</span></a>)}
              <a href="https://www.upswinggolf.com/account">My Account<span aria-hidden="true">↗</span></a>
            </nav>
          </details>
          <a href="https://www.upswinggolf.com/" aria-label="UpSwing Golf home">
            <Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={345} height={159} className="site-header__logo" style={{ height: "auto" }} priority />
          </a>
          <a className="site-header__mobile-cart" href="https://www.upswinggolf.com/cart" aria-label="View cart on UpSwing Golf"><CartIcon /></a>
        </div>
      </div>
    </header>
  );
}
