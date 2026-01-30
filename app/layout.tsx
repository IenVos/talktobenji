import type { Metadata, Viewport } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { ConvexClientProvider } from "@/lib/ConvexClientProvider";
import { AboutModalProvider } from "@/lib/AboutModalContext";
import { AuthModalProvider } from "@/lib/AuthModalContext";
import { ProfessionalHelpProvider } from "@/lib/ProfessionalHelpContext";
import { GlobalMenu } from "@/components/chat/GlobalMenu";

export const metadata: Metadata = {
  title: "TalkToBenji - Benji",
  description: "Rustige gesprekspartner bij rouw en verlies",
  manifest: "/manifest.webmanifest",
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
    { media: "(prefers-color-scheme: light)", color: "#51808f" },
    { media: "(prefers-color-scheme: dark)", color: "#51808f" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="nl">
      <body>
        <ConvexClientProvider session={session}>
          <AboutModalProvider>
            <AuthModalProvider>
              <ProfessionalHelpProvider>
                <GlobalMenu />
                {children}
              </ProfessionalHelpProvider>
            </AuthModalProvider>
          </AboutModalProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
