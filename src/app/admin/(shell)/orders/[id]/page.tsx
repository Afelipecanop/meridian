import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import {
  ArrowLeft,
  Banknote,
  CircleDot,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  User,
} from "lucide-react";
import { db } from "@/db";
import { landings, orderEvents, orders, products } from "@/db/schema";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  OrderStatusBadge,
  orderStatusLabels,
  type OrderStatus,
} from "@/components/admin/order-status";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { PaymentStatusControl } from "@/components/admin/payment-status-control";
import { OrderNoteForm } from "@/components/admin/order-note-form";

export const metadata: Metadata = { title: "Detalle de pedido" };

/** "checkout"/"webhook"/"admin": quién disparó el evento de pago. */
function paymentSourceLabel(source: unknown): string {
  if (source === "webhook") return "webhook";
  if (source === "admin") return "admin";
  return "checkout";
}

function describeEvent(event: {
  type: string;
  data: Record<string, unknown>;
}): string {
  if (event.type === "created") return "Pedido creado desde la landing";
  if (event.type === "status_changed") {
    const from = orderStatusLabels[event.data.from as OrderStatus] ?? "?";
    const to = orderStatusLabels[event.data.to as OrderStatus] ?? "?";
    return `Estado del pedido: ${from} → ${to} · fuente: admin`;
  }
  if (event.type === "note") return String(event.data.text ?? "");
  if (event.type === "payment") {
    const provider = String(event.data.provider ?? "pasarela");
    const source = paymentSourceLabel(event.data.source);
    if (event.data.error) {
      return `Pago (${provider}): error al iniciar · fuente: ${source}`;
    }
    if (source === "admin") {
      return `Pago marcado como pagado manualmente · fuente: admin`;
    }
    const status = String(event.data.status ?? "");
    const normalized =
      event.data.paymentStatus === "paid"
        ? "Pagado"
        : event.data.paymentStatus === "failed"
          ? "Fallido"
          : "Pendiente";
    return `Pago (${provider}): ${status} → ${normalized} · fuente: ${source}`;
  }
  return event.type;
}

function eventIcon(type: string) {
  if (type === "note") {
    return (
      <MessageSquare
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
        aria-hidden
      />
    );
  }
  if (type === "payment") {
    return (
      <Banknote
        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
        aria-hidden
      />
    );
  }
  return <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db
    .select({
      order: orders,
      landingName: landings.name,
      landingSlug: landings.slug,
      productName: products.name,
    })
    .from(orders)
    .leftJoin(landings, eq(orders.landingId, landings.id))
    .leftJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!row) notFound();
  const { order, landingName, landingSlug, productName } = row;

  const events = await db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, id))
    .orderBy(asc(orderEvents.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Volver a pedidos"
          render={<Link href="/admin/orders" />}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Button>
        <div className="flex-1">
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            Pedido{" "}
            <span className="font-mono text-lg text-muted-foreground">
              #{order.id.slice(0, 8)}
            </span>
            <OrderStatusBadge status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(order.createdAt)}
            {landingName ? (
              <>
                {" · desde "}
                {landingSlug ? (
                  <a
                    href={`/${landingSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {landingName}
                  </a>
                ) : (
                  landingName
                )}
              </>
            ) : null}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-4 w-4 text-primary" aria-hidden />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Producto</span>
                <span className="font-medium">{productName ?? "—"}</span>
              </div>
              {Object.keys(order.selectedVariants).length > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Variante</span>
                  <span className="text-right font-medium">
                    {Object.entries(order.selectedVariants)
                      .map(([name, value]) => `${name}: ${value}`)
                      .join(" · ")}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cantidad</span>
                <span className="tabular-nums">×{order.quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Precio unitario</span>
                <span className="tabular-nums">
                  {formatCurrency(order.unitPrice)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base">
                <span className="font-medium">Total</span>
                <span className="font-semibold tabular-nums text-primary">
                  {formatCurrency(order.total)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {order.paymentMethod === "cod"
                    ? "Pago contra entrega"
                    : "Pago online"}
                </span>
                <PaymentStatusControl
                  orderId={order.id}
                  method={order.paymentMethod}
                  status={order.paymentStatus}
                />
              </div>
              {order.paymentRef ? (
                <p className="text-xs text-muted-foreground">
                  Ref. transacción:{" "}
                  <span className="font-mono">{order.paymentRef}</span>
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RefreshCw className="h-4 w-4 text-primary" aria-hidden />
                Línea de tiempo
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ul className="flex flex-col gap-3">
                {events.map((event) => (
                  <li key={event.id} className="flex gap-3 text-sm">
                    {eventIcon(event.type)}
                    <div className="min-w-0 flex-1">
                      <p className="break-words">{describeEvent(event)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Separator />
              <OrderNoteForm orderId={order.id} />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" aria-hidden />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="font-medium">
              {order.customer.nombres} {order.customer.apellidos}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              <a
                href={`tel:${order.customer.telefono}`}
                className="hover:underline"
              >
                {order.customer.telefono}
              </a>
            </p>
            {order.customer.email ? (
              <p className="text-muted-foreground">{order.customer.email}</p>
            ) : null}
            <Separator />
            <p className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {order.customer.direccion}, {order.customer.ciudad},{" "}
                {order.customer.departamento}
              </span>
            </p>
            {order.customer.notas ? (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notas del cliente
                  </p>
                  <p className="mt-1">{order.customer.notas}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
