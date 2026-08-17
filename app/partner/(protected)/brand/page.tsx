import Image from "next/image";
import { requireDealerPortal } from "@/lib/portal/auth";

const brandValues = ["Youth-first", "Confident", "Athletic", "Clear", "Premium", "Approachable"];

export default async function DealerBrandPage() {
  await requireDealerPortal("brand");
  return (
    <div className="brand-portal">
      <section className="brand-portal-hero">
        <Image className="brand-portal-hero__image" src="/brand/dealer-hero-child-golfer-wide.png" alt="Young golfer finishing a swing" fill priority sizes="(max-width: 900px) 100vw, 60vw" />
        <div className="brand-portal-hero__shade" />
        <div className="brand-portal-hero__copy"><p className="portal-kicker">UpSwing brand portal</p><h1>Grow like a pro.<br />Every touchpoint.</h1><p>Approved assets and practical standards for presenting UpSwing consistently—in store, online, and wherever junior golfers discover the game.</p><a className="portal-button portal-button--light" href="#approved-assets">View approved assets <span aria-hidden="true">↓</span></a></div>
        <div className="brand-portal-hero__seal"><span>Approved</span><strong>UpSwing</strong><span>Brand system</span></div>
      </section>

      <section className="brand-intro"><div><p className="portal-kicker">The UpSwing identity</p><h2>Confidence starts with consistency.</h2></div><p>UpSwing is energetic, expert, and built around young golfers. Every execution should balance premium performance with a welcoming sense of possibility—and feel unmistakably UpSwing at a glance.</p></section>
      <div className="brand-values" aria-label="Brand attributes">{brandValues.map((value) => <span key={value}>✓ {value}</span>)}</div>

      <section className="brand-section" id="approved-assets">
        <header><p className="portal-kicker">Approved downloads</p><h2>Start with the master assets.</h2><p>Use the supplied files directly. Never redraw, stretch, recolor, or reconstruct the UpSwing mark.</p></header>
        <div className="brand-downloads">
          <article className="brand-download-card"><p>Primary logo</p><div className="brand-logo-stage"><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf white logo" width={460} height={130} /></div><h3>UpSwing white logo</h3><p>Transparent PNG for dark digital and presentation use.</p><a className="portal-button portal-button--blue" href="/brand/upswing-logo-white.png" download>Download PNG <span aria-hidden="true">↓</span></a></article>
          <article className="brand-guide-card"><div><p>Quick reference</p><h3>Brand<br />Guide.</h3><span>Digital standards</span></div><div><p>Core system</p><h3>UpSwing partner standards</h3><p>Logo treatment, typography, color, photography, written voice, and practical usage rules.</p><a className="portal-button portal-button--light" href="#quick-guide">View quick guide <span aria-hidden="true">↓</span></a></div></article>
        </div>
      </section>

      <section className="brand-section" id="quick-guide">
        <header className="brand-section__split"><div><p className="portal-kicker">Quick guide</p><h2>The brand system at a glance.</h2></div><p>A clear starting point for work that looks, sounds, and feels unmistakably UpSwing.</p></header>
        <div className="brand-system-grid">
          <article className="brand-system-mark"><span>01 / Mark</span><Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf logo" width={460} height={130} /><p>Always reproduce the logo from approved master artwork.</p></article>
          <article className="brand-system-type"><span>02 / Typography</span><strong>Aa</strong><h3>Helvetica + Inter</h3><p>Clean, confident, highly legible, and direct.</p></article>
          <article className="brand-system-color"><span>03 / Color</span><h3>The approved primary palette.</h3><div><i className="is-blue" /><i className="is-red" /><i className="is-white" /></div></article>
          <article className="brand-system-photo"><Image src="/brand/dealer-hero-child-golfer-wide.png" alt="Junior golfer on green grass" fill sizes="50vw" /></article>
          <article className="brand-system-style"><span>04 / Visual style</span><h3>Premium performance. Real growth.</h3><p>Use authentic golf moments, strong contrast, open space, and restrained red and blue accents.</p></article>
        </div>
      </section>

      <section className="brand-section brand-standards">
        <header><p className="portal-kicker">Logo standards</p><h2>Protect the mark.</h2><p>The logo should always have room to breathe and remain immediately recognizable.</p></header>
        <div className="brand-rules"><article><h3>Minimum size</h3><dl><div><dt>Large format</dt><dd>Use approved master art</dd></div><div><dt>Print</dt><dd>30 mm minimum</dd></div><div><dt>Digital</dt><dd>100 px minimum width</dd></div><div><dt>Clear space</dt><dd>At least the “U” cap height</dd></div></dl></article><article><h3>Never do this</h3><ul><li>Do not stretch, rotate, or warp the logo</li><li>Do not change its colors or typeface</li><li>Do not place it on a low-contrast image</li><li>Do not add outlines, shadows, or effects</li><li>Do not separate or rearrange the mark</li></ul></article></div>
      </section>

      <section className="brand-section brand-colors"><header><p className="portal-kicker">Color standards</p><h2>Four colors. One identity.</h2></header><div>{[
        ["UpSwing Blue", "#347EE4", "52 / 126 / 228", "is-blue"], ["UpSwing Red", "#D34B47", "211 / 75 / 71", "is-red"], ["Black", "#040404", "4 / 4 / 4", "is-black"], ["White", "#FFFFFF", "255 / 255 / 255", "is-white"],
      ].map(([name, hex, rgb, className]) => <article key={name}><div className={className} /><h3>{name}</h3><dl><div><dt>HEX</dt><dd>{hex}</dd></div><div><dt>RGB</dt><dd>{rgb}</dd></div></dl></article>)}</div></section>

      <section className="brand-section brand-writing"><header><p className="portal-kicker">Written style</p><h2>Expert, clear, and encouraging.</h2><p>Speak to parents, partners, and young golfers with confidence—without losing the joy of the game.</p></header><div><article><h3>Writing standards</h3><ul><li>Keep copy short, direct, and easy to understand</li><li>Lead with the benefit for the young golfer</li><li>Use active voice and specific product language</li><li>Be optimistic without making inflated claims</li><li>Use “UpSwing” with a capital U and S</li></ul></article><blockquote><span>Preferred voice</span><strong>Built to grow with their game.</strong><p>Specific, confident, and centered on the golfer’s progress.</p></blockquote></div></section>

      <section className="brand-contact"><div><span aria-hidden="true">✉</span><div><p className="portal-kicker">Questions or approvals</p><h2>Ask the UpSwing team.</h2></div></div><p>For guidance beyond this reference, contact the team before publishing or producing materials.</p><a href="mailto:info@upswinggolf.com">info@upswinggolf.com →</a></section>
    </div>
  );
}
