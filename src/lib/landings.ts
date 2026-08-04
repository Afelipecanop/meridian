import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { landings, products, type Landing, type Product } from "@/db/schema";

export type PublishedLanding = {
  landing: Landing;
  product: Product | null;
};

/**
 * Landing publicada por slug, con su producto asociado.
 * Memoizada con `cache` para compartir la consulta entre
 * `generateMetadata` y la página.
 */
export const getPublishedLanding = cache(
  async (slug: string): Promise<PublishedLanding | null> => {
    const rows = await db
      .select({ landing: landings, product: products })
      .from(landings)
      .leftJoin(products, eq(landings.productId, products.id))
      .where(and(eq(landings.slug, slug), eq(landings.status, "published")))
      .limit(1);

    if (rows.length === 0) return null;
    return { landing: rows[0].landing, product: rows[0].product };
  },
);
