import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderEvents, orders } from "@/db/schema";
import { boldProvider } from "@/lib/payments/bold";
import { mockProvider } from "@/lib/payments/mock";
import { wompiProvider } from "@/lib/payments/wompi";
import type { PaymentProvider } from "@/lib/payments/provider";

function resolveProvider(name: string): PaymentProvider | null {
  if (name === "bold") return boldProvider;
  if (name === "wompi") return wompiProvider;
  // El mock solo existe si está activado explícitamente (nunca en producción).
  if (name === "mock" && process.env.PAYMENT_PROVIDER === "mock") {
    return mockProvider;
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerName } = await params;
  const provider = resolveProvider(providerName);
  if (!provider) {
    return NextResponse.json({ error: "Proveedor desconocido" }, { status: 404 });
  }

  const rawBody = await request.text();
  const result = await provider.verifyWebhook(rawBody, request.headers);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (result.ignored) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const ref = z.uuid().safeParse(result.orderRef);
  if (!ref.success) {
    return NextResponse.json({ error: "Referencia inválida" }, { status: 400 });
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, ref.data))
    .limit(1);

  if (!order || order.paymentMethod !== "gateway") {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Idempotencia: un pedido pagado no cambia por webhooks repetidos o
  // tardíos, y un webhook que ya procesamos (mismo payment_id de la
  // pasarela) no se vuelve a aplicar aunque llegue duplicado.
  if (order.paymentStatus === "paid" || order.paymentRef === result.providerRef) {
    return NextResponse.json({ received: true });
  }

  await db
    .update(orders)
    .set({
      paymentStatus: result.paymentStatus,
      paymentRef: result.providerRef,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  await db.insert(orderEvents).values({
    orderId: order.id,
    type: "payment",
    data: {
      provider: provider.name,
      status: result.providerStatus,
      paymentStatus: result.paymentStatus,
      ref: result.providerRef,
    },
  });

  return NextResponse.json({ received: true });
}
