import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, gte, type SQL } from "drizzle-orm";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { db } from "@/db";
import { landings, orders, products } from "@/db/schema";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OrderStatusBadge,
  PaymentBadge,
  orderStatusLabels,
  paymentStatusLabels,
  type OrderStatus,
  type PaymentStatus,
} from "@/components/admin/order-status";
import { OrderRowActions } from "@/components/admin/order-row-actions";

export const metadata: Metadata = { title: "Pedidos" };

const PAGE_SIZE = 10;

const dateRanges = {
  hoy: { label: "Hoy", days: 0 },
  "7d": { label: "Últimos 7 días", days: 7 },
  "30d": { label: "Últimos 30 días", days: 30 },
  todo: { label: "Todo", days: null },
} as const;

type DateRange = keyof typeof dateRanges;

function rangeStart(range: DateRange): Date | null {
  const spec = dateRanges[range];
  if (spec.days === null) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - spec.days);
  return start;
}

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    pago?: string;
    landing?: string;
    fecha?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const statusFilter =
    params.status && params.status in orderStatusLabels
      ? (params.status as OrderStatus)
      : undefined;
  const paymentStatusFilter =
    params.pago && params.pago in paymentStatusLabels
      ? (params.pago as PaymentStatus)
      : undefined;
  const landingFilter = params.landing || undefined;
  const range: DateRange =
    params.fecha && params.fecha in dateRanges
      ? (params.fecha as DateRange)
      : "todo";
  const currentPage = Math.max(1, Number(params.page) || 1);

  const conditions: SQL[] = [];
  if (statusFilter) conditions.push(eq(orders.status, statusFilter));
  if (paymentStatusFilter) {
    conditions.push(eq(orders.paymentStatus, paymentStatusFilter));
  }
  if (landingFilter) conditions.push(eq(orders.landingId, landingFilter));
  const start = rangeStart(range);
  if (start) conditions.push(gte(orders.createdAt, start));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }], landingOptions] = await Promise.all([
    db
      .select({
        order: orders,
        landingName: landings.name,
        productName: products.name,
      })
      .from(orders)
      .leftJoin(landings, eq(orders.landingId, landings.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset((currentPage - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(where),
    db
      .select({ id: landings.id, name: landings.name })
      .from(landings)
      .orderBy(landings.name),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(page: number) {
    const query = new URLSearchParams();
    if (statusFilter) query.set("status", statusFilter);
    if (paymentStatusFilter) query.set("pago", paymentStatusFilter);
    if (landingFilter) query.set("landing", landingFilter);
    if (range !== "todo") query.set("fecha", range);
    if (page > 1) query.set("page", String(page));
    const qs = query.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "pedido" : "pedidos"}
          {statusFilter || paymentStatusFilter || landingFilter || range !== "todo"
            ? " con estos filtros"
            : " en total"}
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-3">
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          aria-label="Filtrar por estado"
          className={selectClass}
        >
          <option value="">Todos los estados</option>
          {Object.entries(orderStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="pago"
          defaultValue={paymentStatusFilter ?? ""}
          aria-label="Filtrar por estado de pago"
          className={selectClass}
        >
          <option value="">Todos los pagos</option>
          {Object.entries(paymentStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="landing"
          defaultValue={landingFilter ?? ""}
          aria-label="Filtrar por landing"
          className={selectClass}
        >
          <option value="">Todas las landings</option>
          {landingOptions.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          name="fecha"
          defaultValue={range}
          aria-label="Filtrar por fecha"
          className={selectClass}
        >
          {Object.entries(dateRanges).map(([value, spec]) => (
            <option key={value} value={value}>
              {spec.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
      </form>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <ShoppingCart
              className="h-6 w-6 text-muted-foreground"
              aria-hidden
            />
          </span>
          <div>
            <p className="font-medium">
              {total === 0 && !statusFilter && !landingFilter && range === "todo"
                ? "Aún no hay pedidos"
                : "Sin resultados con estos filtros"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Los pedidos de tus landings publicadas aparecerán aquí
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Landing</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ order, landingName, productName }) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs font-medium hover:underline"
                    >
                      #{order.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {order.customer.nombres} {order.customer.apellidos}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer.telefono}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {landingName ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {productName ?? "—"}
                    <span className="ml-1 text-xs">×{order.quantity}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell>
                    <PaymentBadge
                      method={order.paymentMethod}
                      status={order.paymentStatus}
                    />
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <OrderRowActions id={order.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Anterior
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={pageHref(currentPage - 1)} />}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Anterior
              </Button>
            )}
            {currentPage >= totalPages ? (
              <Button variant="outline" size="sm" disabled>
                Siguiente
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={pageHref(currentPage + 1)} />}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
