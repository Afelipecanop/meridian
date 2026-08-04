import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { landings } from "@/db/schema";

// Se regenera como máximo cada hora para recoger landings recién publicadas.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const published = await db
    .select({
      slug: landings.slug,
      updatedAt: landings.updatedAt,
      publishedAt: landings.publishedAt,
    })
    .from(landings)
    .where(eq(landings.status, "published"));

  return [
    { url: siteUrl, lastModified: new Date() },
    ...published.map((landing) => ({
      url: `${siteUrl}/${landing.slug}`,
      lastModified: landing.updatedAt ?? landing.publishedAt ?? new Date(),
    })),
  ];
}
