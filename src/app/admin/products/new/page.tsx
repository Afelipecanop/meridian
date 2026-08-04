import type { Metadata } from "next";
import { createProduct } from "../actions";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Nuevo producto" };

export default function NewProductPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nuevo producto
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completa la información del producto que venderás en tus landings
        </p>
      </div>
      <ProductForm action={createProduct} />
    </div>
  );
}
