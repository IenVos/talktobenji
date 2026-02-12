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

export const metadata: Metadata = {
  title: {
    default: "Talk To Benji | Altijd een luisterend oor, wanneer jij het nodig hebt",
    template: "%s",
  },
  description: "Op Talk to Benji vind je een vriendelijke AI die altijd luistert, dag en nacht. Deel je gevoelens, gedachten en verhalen in een veilige omgeving. Geen professionele hulp, maar een betrouwbare steun wanneer jij wilt praten.",
  keywords: ["AI chatbot", "rouw", "verlies", "verdriet", "luisterend oor", "Benji", "TalkToBenji", "mentale steun"],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Talk To Benji | Altijd een luisterend oor, wanneer jij het nodig hebt",
    description: "Een warme, betrouwbare plek waar je je verhaal kwijt kunt. 24/7 aandacht en steun, zonder oordeel.",
    type: "website",
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
      <body>
        <ConvexClientProvider>
          <SessionProvider>
            <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
              <AboutModalProvider>
                <ProfessionalHelpProvider>
                  <LayoutMenu />
                  {children}
                  <CookieConsentBanner />
                  <ConnectionBanner />
                </ProfessionalHelpProvider>
              </AboutModalProvider>
            </Suspense>
          </SessionProvider>
        </ConvexClientProvider>
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
