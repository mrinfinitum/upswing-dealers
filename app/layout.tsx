import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Find an UpSwing Dealer | UpSwing Golf",
  description: "Find an authorized UpSwing Golf dealer near you.",
  openGraph: {
    title: "Find an UpSwing Dealer",
    description: "Clubs that grow. Support that’s local.",
    type: "website",
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
