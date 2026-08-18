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
