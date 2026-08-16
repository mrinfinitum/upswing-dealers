import type { Metadata } from "next";
import { canonicalSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(canonicalSiteUrl),
  title: "Find an UpSwing Dealer | UpSwing Golf",
  description: "Find an authorized UpSwing Golf dealer near you.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Find an UpSwing Dealer",
    description: "Clubs that grow. Support that’s local.",
    type: "website",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Find an UpSwing Dealer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find an UpSwing Dealer",
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
