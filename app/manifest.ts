import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TalkToBenji",
    short_name: "Benji",
    description: "Rustige gesprekspartner bij rouw en verlies",
    start_url: "/",
    display: "standalone",
    background_color: "#f8feff",
    theme_color: "#51808f",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/vibetracker-logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/vibetracker-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
