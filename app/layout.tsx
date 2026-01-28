import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/ConvexClientProvider";

export const metadata: Metadata = {
  title: "TalkToBenji - Benji",
  description: "Rustige gesprekspartner bij rouw en verlies",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Benji",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4b975" },
    { media: "(prefers-color-scheme: dark)", color: "#f4b975" },
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
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
