import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { allPairs } from "@/lib/lang-seo";
import { USAGES } from "@/lib/usage-seo";
import { ALTERNATIVES } from "@/lib/alternative-seo";

// Pages publiques indexables. À étendre quand de nouveaux articles
// de Journal ou pages marketing sont ajoutés.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/atelier", changeFrequency: "monthly", priority: 0.7 },
    { path: "/outils", changeFrequency: "monthly", priority: 0.7 },
    { path: "/outils/convertir-sous-titres", changeFrequency: "monthly", priority: 0.7 },
    { path: "/traduire-une-video", changeFrequency: "monthly", priority: 0.8 },
    // Pages programmatiques : 90 paires de langues (traduire X → Y).
    ...allPairs().map((p) => ({
      path: `/traduire-une-video/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { path: "/sous-titres", changeFrequency: "monthly", priority: 0.8 },
    // Pages programmatiques : usages (TikTok, YouTube, accessibilité…).
    ...USAGES.map((u) => ({
      path: `/sous-titres/${u.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { path: "/alternative", changeFrequency: "monthly", priority: 0.7 },
    // Pages programmatiques : alternatives (comparatifs concurrents).
    ...ALTERNATIVES.map((a) => ({
      path: `/alternative/${a.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
    { path: "/blog/traduire-video-francais-anglais", changeFrequency: "monthly", priority: 0.7 },
    { path: "/blog/submagic-alternative-francais", changeFrequency: "monthly", priority: 0.7 },
    { path: "/blog/pourquoi-maxline-studio", changeFrequency: "monthly", priority: 0.5 },
    { path: "/legal/mentions", changeFrequency: "yearly", priority: 0.2 },
    { path: "/legal/confidentialite", changeFrequency: "yearly", priority: 0.2 },
    { path: "/legal/cookies", changeFrequency: "yearly", priority: 0.2 },
    { path: "/legal/cgu", changeFrequency: "yearly", priority: 0.2 },
  ];

  return pages.map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
