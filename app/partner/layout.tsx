import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Dealer portal", template: "%s | UpSwing Dealer Portal" },
  robots: { index: false, follow: false },
};

export default function DealerPortalRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="portal-root">{children}</div>;
}
