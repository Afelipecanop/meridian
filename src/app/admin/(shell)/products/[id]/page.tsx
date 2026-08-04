import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { updateProduct } from "../actions";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });
  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, product.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar producto
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm product={product} action={updateWithId} />
    </div>
  );
}
