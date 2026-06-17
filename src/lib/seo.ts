import { site } from "@/lib/site";

const baseUrl = site.domain.replace(/\/$/, "");

/** JSON-LD: Organization + SoftwareApplication — helps search + AI engines. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.legalName,
    url: baseUrl,
    description: site.description,
    sameAs: [`https://twitter.com/${site.twitter.replace("@", "")}`],
  };
}

export function softwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.legalName,
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    description: site.description,
    offers: { "@type": "Offer", price: "20.00", priceCurrency: "USD" },
  };
}
