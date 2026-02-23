import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.talktobenji.com";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/prijzen`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/waarom-benji`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/algemene-voorwaarden`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
