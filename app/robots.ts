import type { MetadataRoute } from "next";
import { canonicalSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${canonicalSiteUrl}/sitemap.xml`,
    host: canonicalSiteUrl,
  };
}
