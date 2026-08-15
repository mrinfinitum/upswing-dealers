import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Find an UpSwing Dealer | UpSwing Golf",
  description: "Find an authorized UpSwing Golf dealer near you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
