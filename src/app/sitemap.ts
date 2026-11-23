// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // Core static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/rankings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/benchmarks`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/labs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/providers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const [models, labs, providers] = await Promise.all([
      prisma.model.findMany({
        where: { isDeprecated: false, providerCount: { gte: 1 } },
        select: { slug: true, updatedAt: true },
      }),
      prisma.lab.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.provider.findMany({
        select: { slug: true, updatedAt: true },
      }),
    ]);

    for (const m of models) {
      routes.push({
        url: `${baseUrl}/models/${m.slug}`,
        lastModified: m.updatedAt,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }

    for (const l of labs) {
      routes.push({
        url: `${baseUrl}/labs/${l.slug}`,
        lastModified: l.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    for (const p of providers) {
      routes.push({
        url: `${baseUrl}/providers/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch dynamic entries from DB", err);
  }

  return routes;
}
