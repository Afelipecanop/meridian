import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";

export type CheckoutStatusResponse =
  | {
      found: true;
      paymentMethod: "cod" | "gateway";
      paymentStatus: "na" | "pending" | "paid" | "failed";
    }
  | { found: false };

/**
 * Estado del pago de un pedido, consultado por el banner de resultado en la
 * landing tras volver de la pasarela. Sin datos personales.
 */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(`checkout-status:${ip}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json({ found: false }, { status: 429 });
  }

  const parsed = z.uuid().safeParse(request.nextUrl.searchParams.get("order"));
  if (!parsed.success) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  const [order] = await db
    .select({
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(eq(orders.id, parsed.data))
    .limit(1);

  if (!order) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  const body: CheckoutStatusResponse = {
    found: true,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  };
  return NextResponse.json(body);
}
