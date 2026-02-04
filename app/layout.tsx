import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/ConvexClientProvider";
import { AboutModalProvider } from "@/lib/AboutModalContext";
import { ProfessionalHelpProvider } from "@/lib/ProfessionalHelpContext";
import { LayoutMenu } from "@/components/chat/LayoutMenu";
import { CookieConsentBanner } from "@/components/chat/CookieConsentBanner";

export const metadata: Metadata = {
  title: "TalkToBenji - Benji",
  description: "Rustige gesprekspartner bij rouw en verlies",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
          <AboutModalProvider>
            <ProfessionalHelpProvider>
              <LayoutMenu />
              {children}
              <CookieConsentBanner />
            </ProfessionalHelpProvider>
          </AboutModalProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
