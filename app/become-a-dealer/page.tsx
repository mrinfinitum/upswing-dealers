import type { Metadata } from "next";
import { DealerApplicationForm } from "@/components/dealer-application/dealer-application-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getTurnstileSiteKey } from "@/lib/turnstile";

export const metadata: Metadata = {
  title: "Become an UpSwing Dealer | UpSwing Golf",
  description: "Apply to carry UpSwing Golf junior clubs in your shop, pro shop, or fitting studio.",
  alternates: { canonical: "/become-a-dealer" },
};

export default function BecomeADealerPage() {
  return (
    <>
      <SiteHeader />
      <main className="apply-page">
        <div className="shell apply-page__layout">
          <header className="apply-page__intro">
            <p className="eyebrow">Retail partnerships</p>
            <h1>Become an UpSwing dealer</h1>
            <p>Golf shops, pro shops, fitters, and junior academies across the United States and Canada carry UpSwing’s premium clubs built for growing players.</p>
            <ul>
              <li>Tell us about your business and store location.</li>
              <li>Our dealer team reviews every application, usually within a few business days.</li>
              <li>Once approved, your store appears on the UpSwing dealer locator.</li>
            </ul>
            <p className="apply-page__contact">Questions? Email <a href="mailto:info@upswinggolf.com">info@upswinggolf.com</a>.</p>
          </header>
          <DealerApplicationForm siteKey={getTurnstileSiteKey()} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
