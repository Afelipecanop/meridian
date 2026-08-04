"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orderEvents, orders } from "@/db/schema";

const statusSchema = z.enum([
  "nuevo",
  "confirmado",
  "enviado",
  "entregado",
  "cancelado",
]);

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
}

export type OrderActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<OrderActionResult> {
  await requireSession();

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { success: false, error: "Estado inválido" };

  const [current] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!current) return { success: false, error: "Pedido no encontrado" };
  if (current.status === parsed.data) return { success: true };

  await db
    .update(orders)
    .set({ status: parsed.data, updatedAt: new Date() })
    .where(eq(orders.id, id));

  await db.insert(orderEvents).values({
    orderId: id,
    type: "status_changed",
    data: { from: current.status, to: parsed.data },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { success: true };
}

export async function addOrderNote(
  id: string,
  note: string,
): Promise<OrderActionResult> {
  await requireSession();

  const text = note.trim();
  if (!text) return { success: false, error: "La nota está vacía" };
  if (text.length > 1000) {
    return { success: false, error: "La nota es demasiado larga" };
  }

  const [exists] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!exists) return { success: false, error: "Pedido no encontrado" };

  await db.insert(orderEvents).values({
    orderId: id,
    type: "note",
    data: { text },
  });

  revalidatePath(`/admin/orders/${id}`);
  return { success: true };
}
