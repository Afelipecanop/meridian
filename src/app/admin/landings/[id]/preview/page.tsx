import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { landings, products } from "@/db/schema";
import { PreviewClient } from "@/components/editor/preview-client";

export const metadata: Metadata = {
  title: "Vista previa — Meridian",
  robots: { index: false, follow: false },
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db
    .select({ landing: landings, product: products })
    .from(landings)
    .leftJoin(products, eq(landings.productId, products.id))
    .where(eq(landings.id, id))
    .limit(1);

  if (!row) notFound();

  return <PreviewClient landing={row.landing} product={row.product} />;
}
