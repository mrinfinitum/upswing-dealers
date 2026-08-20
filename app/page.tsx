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
                <h1>Find the right clubs.<br />Fit their next chapter.</h1>
                <p className="dealer-network-story__lead">UpSwing Golf is helping the next generation of golfers play with confidence, with premium junior golf clubs engineered specifically for growing players.</p>
                <p>Use our Dealer Locator to find UpSwing Golf clubs at authorized retail locations and golf shops around the world. See the clubs in person, get your junior golfer properly fit, and find the right UpSwing set for their game.</p>
                <div className="dealer-network-story__actions"><a href="#dealer-locator">Explore the dealer map <span aria-hidden="true">↓</span></a><a href="mailto:info@upswinggolf.com">Become a retailer <span aria-hidden="true">↗</span></a></div>
                <div className="dealer-network-story__signals" aria-label="UpSwing dealer benefits"><span>Authorized retailers</span><span>Professional fitting</span><span>Built for growing players</span></div>
              </div>
              <figure className="dealer-network-story__media">
                <Image src="/brand/upswing-dealer-retail-hero.jpg" alt="UpSwing Golf junior driver and golf balls on a course" fill priority sizes="(max-width: 900px) 100vw, 46vw" />
                <figcaption><span>UpSwing Golf</span><strong>Premium equipment.<br />Purpose-built for juniors.</strong></figcaption>
              </figure>
              <aside className="dealer-network-story__retailer"><div><span>Retail partnerships</span><strong>Interested in carrying UpSwing Golf?</strong></div><p>Retailers, golf shops, academies, and facilities can connect with our team to learn more about becoming an authorized dealer.</p><a href="mailto:info@upswinggolf.com">info@upswinggolf.com <span aria-hidden="true">↗</span></a></aside>
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
