import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = site.domain.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/sign-in", "/sign-up"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
