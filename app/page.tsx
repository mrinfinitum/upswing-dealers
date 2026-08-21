import Image from "next/image";
import { DealerLocator } from "@/components/dealer-locator/dealer-locator";
import { GoogleMapsPreloader } from "@/components/dealer-locator/google-maps-preloader";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { dealerRepository } from "@/lib/dealers/repository";
import { getMapConfiguration } from "@/lib/maps/provider";
import { connection } from "next/server";

export default async function Home() {
  await connection();
  const dealers = await dealerRepository.getAll();
  const mapConfig = getMapConfiguration();

  return (
    <>
      {mapConfig.provider === "google" ? <GoogleMapsPreloader config={mapConfig} /> : null}
      <SiteHeader />
      <main>
        <section className="dealer-network-story">
          <div className="shell">
            <div className="dealer-network-story__card">
              <div className="dealer-network-story__copy">
                <p className="eyebrow">Authorized UpSwing retailers</p>
                <h1>Find UpSwing Golf Dealers Near You</h1>
                <p className="dealer-network-story__lead">Find authorized retailers, golf shops, and fitting locations carrying premium UpSwing clubs for growing players.</p>
                <div className="dealer-network-story__actions"><a href="#dealer-locator">View dealer map <span aria-hidden="true">↓</span></a><a href="mailto:info@upswinggolf.com">Become a retailer <span aria-hidden="true">↗</span></a></div>
              </div>
              <figure className="dealer-network-story__media">
                <Image src="/brand/upswing-dealer-retail-hero.jpg" alt="UpSwing Golf junior driver and golf balls on a course" fill priority sizes="(max-width: 900px) 100vw, 46vw" />
                <figcaption><span>UpSwing Golf</span><strong>Premium equipment.<br />Purpose-built for juniors.</strong></figcaption>
              </figure>
            </div>
          </div>
        </section>
        <div className="shell locator-section-wrap" id="dealer-locator">
          <DealerLocator dealers={dealers} mapConfig={mapConfig} />
        </div>
        <section className="locator-cta">
          <div className="shell">
            <div><p className="eyebrow">Not sure where to start?</p><h2>Find the right fit before you visit.</h2></div>
            <a href="https://www.upswinggolf.com/pages/virtual-fitting-tool">Get a virtual fitting <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
