import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.domain.replace(/\/$/, "");
  return [{ url: base, changeFrequency: "weekly", priority: 1 }];
}
