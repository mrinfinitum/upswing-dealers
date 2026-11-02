import type { Metadata } from "next";
import { canonicalSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(canonicalSiteUrl),
  title: "UpSwing Dealer Portal | UpSwing Golf",
  description: "The UpSwing Golf dealer portal for authorized retail partners.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "UpSwing Dealer Portal",
    description: "Clubs that grow. Support that’s local.",
    type: "website",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "UpSwing Dealer Portal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UpSwing Dealer Portal",
    description: "Clubs that grow. Support that’s local.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
