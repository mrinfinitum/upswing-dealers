import type { MetadataRoute } from "next";
import { canonicalSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: canonicalSiteUrl, changeFrequency: "monthly", priority: 1 }];
}
