import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/ConvexClientProvider";
import { AboutModalProvider } from "@/lib/AboutModalContext";
import { ProfessionalHelpProvider } from "@/lib/ProfessionalHelpContext";
import { LayoutMenu } from "@/components/chat/LayoutMenu";
import { CookieConsentBanner } from "@/components/chat/CookieConsentBanner";
import { ConnectionBanner } from "@/components/chat/ConnectionBanner";
import { SessionProvider } from "@/lib/SessionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: {
    default: "Talk To Benji | Altijd een luisterend oor, wanneer jij het nodig hebt",
    template: "%s",
  },
  description: "Altijd iemand die luistert, ook 's nachts. Benji is er voor je als je verdriet hebt, rouwt of gewoon je gedachten kwijt wilt. Veilig, persoonlijk en altijd beschikbaar.",
  keywords: ["AI chatbot", "rouw", "verlies", "verdriet", "luisterend oor", "Benji", "TalkToBenji", "mentale steun"],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Talk To Benji | Altijd een luisterend oor, wanneer jij het nodig hebt",
    description: "Altijd iemand die luistert, ook 's nachts. Benji is er voor je als je verdriet hebt, rouwt of gewoon je gedachten kwijt wilt. Veilig, persoonlijk en altijd beschikbaar.",
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
    title: "Talk To Benji | Altijd een luisterend oor, wanneer jij het nodig hebt",
    description: "Altijd iemand die luistert, ook 's nachts. Benji is er voor je als je verdriet hebt, rouwt of gewoon je gedachten kwijt wilt. Veilig, persoonlijk en altijd beschikbaar.",
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','422608397394430');fbq('track','PageView');`}
        </Script>
      </head>
      <body>
        <ErrorBoundary>
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
