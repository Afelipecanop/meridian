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
  "en_preparacion",
  "despachado",
  "entregado",
  "cancelado",
  "devuelto",
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

  try {
    await db
      .update(orders)
      .set({ status: parsed.data, updatedAt: new Date() })
      .where(eq(orders.id, id));

    await db.insert(orderEvents).values({
      orderId: id,
      type: "status_changed",
      data: { from: current.status, to: parsed.data },
    });
  } catch (error) {
    // Suele ser un enum "order_status" desactualizado en la base de datos
    // (falta correr `npm run db:migrate` con el DATABASE_URL de producción).
    console.error("updateOrderStatus", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `No se pudo guardar: ${error.message}`
          : "No se pudo guardar el nuevo estado",
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { success: true };
}

/**
 * Marca como pagado un pedido contra entrega cuando el repartidor confirma
 * el cobro. Es la única forma de tocar payment_status por fuera del webhook
 * de la pasarela, y por eso está limitada a paymentMethod="cod": los pedidos
 * de pasarela solo cambian de estado de pago vía /api/webhooks/[provider].
 */
export async function markOrderPaid(id: string): Promise<OrderActionResult> {
  await requireSession();

  const [order] = await db
    .select({ paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!order) return { success: false, error: "Pedido no encontrado" };
  if (order.paymentMethod !== "cod") {
    return {
      success: false,
      error: "Solo se puede marcar manualmente el pago de pedidos contra entrega",
    };
  }
  if (order.paymentStatus === "paid") return { success: true };

  try {
    await db
      .update(orders)
      .set({ paymentStatus: "paid", updatedAt: new Date() })
      .where(eq(orders.id, id));

    await db.insert(orderEvents).values({
      orderId: id,
      type: "payment",
      data: { source: "admin", from: order.paymentStatus, to: "paid" },
    });
  } catch (error) {
    console.error("markOrderPaid", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `No se pudo guardar: ${error.message}`
          : "No se pudo marcar como pagado",
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { success: true };
}

export async function deleteOrder(id: string) {
  await requireSession();
  await db.delete(orders).where(eq(orders.id, id));
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
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
