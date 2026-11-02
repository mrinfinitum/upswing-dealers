import type { MetadataRoute } from "next";
import { canonicalSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${canonicalSiteUrl}/become-a-dealer`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
