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
        <details className="site-header__mobile-menu">
          <summary aria-label="Open navigation"><span /><span /><span /></summary>
          <nav aria-label="Mobile navigation">
            <a href="#locator" aria-current="page">Dealer Locator</a>
            {links.map(([label, href]) => <a key={label} href={href}>{label}<span aria-hidden="true">↗</span></a>)}
          </nav>
        </details>
      </div>
    </header>
  );
}
