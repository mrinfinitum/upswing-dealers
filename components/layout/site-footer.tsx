import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__main shell">
        <div className="site-footer__brand">
          <a href="https://www.upswinggolf.com/" aria-label="UpSwing Golf home">
            <Image src="/brand/upswing-logo-white.png" alt="UpSwing Golf" width={345} height={159} style={{ width: 140, height: "auto" }} />
          </a>
          <p>Premium golf equipment engineered to grow with your golfer.</p>
        </div>
        <div>
          <p className="site-footer__title">Main menu</p>
          <a href="https://www.upswinggolf.com/collections/get-an-edge-on-competition-with-upswing">Products</a>
          <a href="https://www.upswinggolf.com/pages/virtual-fitting-tool">Find Your Fit</a>
          <a href="https://www.upswinggolf.com/pages/our-story-2">Our Story</a>
          <a href="https://www.upswinggolf.com/pages/contact">Contact Us</a>
        </div>
        <div>
          <p className="site-footer__title">Contact us</p>
          <a href="mailto:info@upswinggolf.com">info@upswinggolf.com</a>
          <span>Orders</span>
          <a href="mailto:orders@upswinggolf.com">orders@upswinggolf.com</a>
          <span>Orders in Canada</span>
          <a href="mailto:salescanada@upswinggolf.com">salescanada@upswinggolf.com</a>
        </div>
      </div>
      <div className="site-footer__tagline shell">
        <p>Grow Like a Pro™</p>
        <a href="https://www.instagram.com/upswinggolfclubs/">Instagram ↗</a>
      </div>
      <div className="site-footer__sub">
        <div className="shell"><span>© {new Date().getFullYear()} UpSwing Golf</span><a href="https://www.upswinggolf.com/policies/privacy-policy">Privacy Policy</a></div>
      </div>
    </footer>
  );
}
