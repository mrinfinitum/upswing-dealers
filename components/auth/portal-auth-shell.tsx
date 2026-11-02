import Image from "next/image";

// Split layout shared by the portal sign-in and password pages: brand photo on the left, form panel on the right.
export function PortalAuthShell({ labelledBy, children }: { labelledBy: string; children: React.ReactNode }) {
  return (
    <main className="portal-home">
      <section className="portal-home__brand">
        <Image className="portal-home__photo" src="/brand/upswing-dealer-retail-hero.jpg" alt="" fill priority sizes="(max-width: 900px) 100vw, 55vw" />
        <div className="portal-home__brand-inner">
          <a href="https://www.upswinggolf.com/" aria-label="UpSwing Golf home"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={345} height={159} className="portal-home__logo" priority /></a>
          <div className="portal-home__tagline">
            <p className="eyebrow">Dealer portal</p>
            <h2>Premium equipment.<br />Purpose-built for juniors.</h2>
            <p>Locations, brand resources, and approved imagery for authorized UpSwing retail partners.</p>
          </div>
          <p className="portal-home__motto">Grow Like a Pro™</p>
        </div>
      </section>

      <section className="portal-home__panel" aria-labelledby={labelledBy}>
        <div className="portal-home__mobile-brand"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={345} height={159} priority /></div>
        <div className="portal-home__panel-inner">{children}</div>
        <footer className="portal-home__footer">
          <span>© {new Date().getFullYear()} UpSwing Golf</span>
          <a href="https://www.upswinggolf.com/">upswinggolf.com</a>
        </footer>
      </section>
    </main>
  );
}
