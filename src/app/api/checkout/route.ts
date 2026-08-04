import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { landings, orderEvents, orders, products } from "@/db/schema";
import { getPaymentProvider } from "@/lib/payments/provider";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutSchema, type CheckoutResponse } from "@/lib/zod-schemas/checkout";

function json(body: CheckoutResponse, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  const limited = rateLimit(`checkout:${ip}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return json(
      { success: false, error: "Demasiados intentos. Espera un minuto." },
      429,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ success: false, error: "Solicitud inválida" }, 400);
  }

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      },
      400,
    );
  }
  const data = parsed.data;

  // Honeypot con valor → bot. Respondemos como éxito para no darle señal.
  if (data.website) {
    return json({ success: true, orderId: "ok" }, 201);
  }

  const [landing] = await db
    .select()
    .from(landings)
    .where(eq(landings.id, data.landingId))
    .limit(1);

  if (!landing || landing.status !== "published") {
    return json(
      { success: false, error: "Esta página ya no recibe pedidos" },
      404,
    );
  }
  const provider =
    landing.checkoutMode === "gateway" ? getPaymentProvider() : null;
  if (landing.checkoutMode === "gateway" && !provider) {
    return json(
      { success: false, error: "El pago online no está configurado" },
      503,
    );
  }
  if (!landing.productId) {
    return json(
      { success: false, error: "Esta página no tiene producto disponible" },
      400,
    );
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, landing.productId))
    .limit(1);

  if (!product || !product.active) {
    return json(
      { success: false, error: "El producto no está disponible" },
      400,
    );
  }

  // El precio SIEMPRE se calcula en servidor; el cliente solo envía cantidad.
  const unitPrice = Number(product.price);
  const total = unitPrice * data.quantity;

  const [order] = await db
    .insert(orders)
    .values({
      landingId: landing.id,
      productId: product.id,
      customer: {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
        city: data.city,
        notes: data.notes || undefined,
      },
      quantity: data.quantity,
      unitPrice: unitPrice.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: landing.checkoutMode,
      paymentStatus: landing.checkoutMode === "gateway" ? "pending" : "na",
      status: "nuevo",
    })
    .returning();

  await db.insert(orderEvents).values({
    orderId: order.id,
    type: "created",
    data: { source: "landing", slug: landing.slug, ip },
  });

  if (landing.checkoutMode === "cod") {
    return json({ success: true, orderId: order.id }, 201);
  }

  // Modo pasarela: crear el checkout y devolver la URL de pago.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    request.nextUrl.origin;
  const checkout = await provider!.createCheckout({
    order,
    landingSlug: landing.slug,
    redirectUrl: `${siteUrl}/${landing.slug}?pedido=${order.id}`,
  });

  if (!checkout.ok) {
    await db
      .update(orders)
      .set({ paymentStatus: "failed", updatedAt: new Date() })
      .where(eq(orders.id, order.id));
    await db.insert(orderEvents).values({
      orderId: order.id,
      type: "payment",
      data: { provider: provider!.name, error: checkout.error },
    });
    return json(
      { success: false, error: "No pudimos iniciar el pago. Intenta de nuevo." },
      502,
    );
  }

  await db.insert(orderEvents).values({
    orderId: order.id,
    type: "payment",
    data: { provider: provider!.name, status: "pending" },
  });

  return json(
    { success: true, orderId: order.id, redirectUrl: checkout.redirectUrl },
    201,
  );
}
