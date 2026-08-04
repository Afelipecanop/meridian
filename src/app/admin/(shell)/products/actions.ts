"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products } from "@/db/schema";

const productSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  description: z.string().trim(),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  compareAtPrice: z.coerce
    .number()
    .min(0, "El precio de comparación no puede ser negativo")
    .nullable(),
  sku: z.string().trim(),
  stock: z.coerce
    .number()
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo"),
  active: z.boolean(),
  images: z.array(z.string()),
});

export type ProductFormState =
  | { success: true }
  | { success?: false; error: string }
  | undefined;

function parseProductForm(formData: FormData) {
  let images: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("images") ?? "[]"));
    if (Array.isArray(parsed)) {
      images = parsed.filter((i): i is string => typeof i === "string");
    }
  } catch {
    images = [];
  }

  const compareRaw = String(formData.get("compareAtPrice") ?? "").trim();

  return productSchema.safeParse({
    name: formData.get("name"),
    description: String(formData.get("description") ?? ""),
    price: formData.get("price"),
    compareAtPrice: compareRaw === "" ? null : compareRaw,
    sku: String(formData.get("sku") ?? ""),
    stock: String(formData.get("stock") ?? "0"),
    active: formData.get("active") === "true",
    images,
  });
}

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireSession();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  await db.insert(products).values({
    name: data.name,
    description: data.description,
    price: data.price.toFixed(2),
    compareAtPrice:
      data.compareAtPrice === null ? null : data.compareAtPrice.toFixed(2),
    sku: data.sku || null,
    stock: data.stock,
    active: data.active,
    images: data.images,
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireSession();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  await db
    .update(products)
    .set({
      name: data.name,
      description: data.description,
      price: data.price.toFixed(2),
      compareAtPrice:
        data.compareAtPrice === null ? null : data.compareAtPrice.toFixed(2),
      sku: data.sku || null,
      stock: data.stock,
      active: data.active,
      images: data.images,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
  return { success: true };
}

export async function toggleProductActive(id: string, active: boolean) {
  await requireSession();
  await db
    .update(products)
    .set({ active, updatedAt: new Date() })
    .where(eq(products.id, id));
  revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireSession();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
}
