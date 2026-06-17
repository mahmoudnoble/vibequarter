import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, Space_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import { authEnabled } from "@/lib/auth";
import { site } from "@/lib/site";
import { organizationJsonLd, softwareJsonLd } from "@/lib/seo";
import "./globals.css";

// Brand type system: Space Grotesk (huge, tight display) + Plus Jakarta Sans
// (body) + Space Mono (// eyebrows / labels). IBM Plex Sans Arabic carries both
// display and body when dir=rtl (swapped in globals.css).
const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-body", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: {
    default: `${site.legalName} — ${site.tagline}`,
    template: `%s · ${site.legalName}`,
  },
  description: site.description,
  applicationName: site.legalName,
  keywords: [
    "AI website builder", "website generator", "small business website",
    "multi-tenant SaaS", "booking website", "Arabic website builder", "منشئ مواقع بالذكاء الاصطناعي",
  ],
  authors: [{ name: site.legalName }],
  openGraph: { type: "website", siteName: site.legalName, title: `${site.legalName} — ${site.tagline}`, description: site.description, url: site.domain },
  twitter: { card: "summary_large_image", title: `${site.legalName} — ${site.tagline}`, description: site.description, creator: site.twitter },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0F16" },
  ],
  width: "device-width",
  initialScale: 1,
};

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} ${arabic.variable}`}
    >
      <body className="min-h-screen bg-background font-body text-foreground antialiased">
        <Providers>{children}</Providers>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd()) }} />
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (authEnabled) {
    return (
      <ClerkProvider
        appearance={{
          variables: { colorPrimary: "#10B981", borderRadius: "12px" },
          // Make the bot-protection CAPTCHA full-width + branded so, when it
          // does appear (email/password path, or post-OAuth callback for a new
          // account), it's obvious — not a small box that's easy to miss.
          captcha: { theme: "light", size: "flexible", language: "en-US" },
        }}
      >
        <Document>{children}</Document>
      </ClerkProvider>
    );
  }
  return <Document>{children}</Document>;
}
