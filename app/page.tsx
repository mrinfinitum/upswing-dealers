import { DealerLocator } from "@/components/dealer-locator/dealer-locator";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { dealerRepository } from "@/lib/dealers/repository";
import { getMapConfiguration } from "@/lib/maps/provider";
import { connection } from "next/server";
import Image from "next/image";

export default async function Home() {
  await connection();
  const dealers = await dealerRepository.getAll();
  const mapConfig = getMapConfiguration();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="locator-hero">
          <div className="locator-hero__media" aria-hidden="true">
            <Image className="locator-hero__media-backdrop" src="/brand/dealer-hero-child-golfer.png" alt="" fill sizes="(max-width: 767px) 100vw, 58vw" quality={60} priority />
            <Image className="locator-hero__media-subject" src="/brand/dealer-hero-child-golfer.png" alt="" fill sizes="(max-width: 767px) 78vw, 32vw" quality={88} priority />
          </div>
          <div className="locator-hero__texture" aria-hidden="true" />
          <div className="shell locator-hero__content">
            <p className="eyebrow">UpSwing retail partners</p>
            <h1>Clubs that grow.<br />Support that’s local.</h1>
            <p>Find an authorized UpSwing dealer and get your golfer into equipment built for every stage of their game.</p>
            <a href="#locator">Find a dealer <span aria-hidden="true">↓</span></a>
          </div>
        </section>
        <div className="shell locator-section-wrap">
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
