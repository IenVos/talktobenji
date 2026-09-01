import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/ConvexClientProvider";
import { AboutModalProvider } from "@/lib/AboutModalContext";
import { ProfessionalHelpProvider } from "@/lib/ProfessionalHelpContext";
import { LayoutMenu } from "@/components/chat/LayoutMenu";
import { CookieConsentBanner } from "@/components/chat/CookieConsentBanner";
import { ConnectionBanner } from "@/components/chat/ConnectionBanner";
import { SessionProvider } from "@/lib/SessionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { AnonymousSessionClaimer } from "@/lib/AnonymousSessionClaimer";
import { ConsentScripts } from "@/components/ConsentScripts";

export const metadata: Metadata = {
  title: {
    default: "Talk To Benji | Een luisterend oor bij verdriet en verlies",
    template: "%s",
  },
  description: "Benji is er als je verdriet hebt, rouwt of je alleen voelt. Praat anoniem en zonder oordeel, ook midden in de nacht.",
  keywords: ["AI chatbot", "rouw", "verlies", "verdriet", "luisterend oor", "Benji", "TalkToBenji", "mentale steun"],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Talk To Benji | Een luisterend oor bij verdriet en verlies",
    description: "Benji is er als je verdriet hebt, rouwt of je alleen voelt. Praat anoniem en zonder oordeel, ook midden in de nacht.",
    type: "website",
    url: "https://www.talktobenji.com",
    siteName: "Talk To Benji",
    images: [
      {
        url: "https://www.talktobenji.com/images/benji-logo-2.png",
        width: 512,
        height: 512,
        alt: "Talk To Benji",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Talk To Benji | Een luisterend oor bij verdriet en verlies",
    description: "Benji is er als je verdriet hebt, rouwt of je alleen voelt. Praat anoniem en zonder oordeel, ook midden in de nacht.",
    images: ["https://www.talktobenji.com/images/benji-logo-2.png"],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Benji",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "facebook-domain-verification": "wi3s5svji1s2mk87yop1q1red1auej",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#38465e" },
    { media: "(prefers-color-scheme: dark)", color: "#38465e" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <head>
        {/* Tracking (GTM, Meta Pixel, Clarity) staat in ConsentScripts en laadt pas
            ná cookie-toestemming. De oude <noscript>-fallbacks zijn bewust verwijderd:
            die vuurden buiten de consent om en no-JS-bezoekers kunnen de banner niet bedienen. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://www.talktobenji.com/#organization",
                  name: "Talk To Benji",
                  url: "https://www.talktobenji.com",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://www.talktobenji.com/images/benji-logo-2.png",
                    width: 512,
                    height: 512,
                  },
                  founder: {
                    "@type": "Person",
                    name: "Ien",
                  },
                  description: "AI-gesprekspartner voor mensen die rouwen of verdriet hebben. Altijd beschikbaar, zonder oordeel.",
                  inLanguage: "nl-NL",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.talktobenji.com/#website",
                  url: "https://www.talktobenji.com",
                  name: "Talk To Benji",
                  publisher: { "@id": "https://www.talktobenji.com/#organization" },
                  inLanguage: "nl-NL",
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <ConsentScripts />
        <ErrorBoundary>
          <SessionProvider>
            <ConvexClientProvider>
              <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
                <AboutModalProvider>
                  <ProfessionalHelpProvider>
                    <PageViewTracker />
                    <AnonymousSessionClaimer />
                    <LayoutMenu />
                    {children}
                    <CookieConsentBanner />
                    <ConnectionBanner />
                  </ProfessionalHelpProvider>
                </AboutModalProvider>
              </Suspense>
            </ConvexClientProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

// HydrateFallback voor Next.js 15+ streaming – minimal loader tijdens initiële hydration
export function HydrateFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50" aria-hidden="true">
      <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );
}
