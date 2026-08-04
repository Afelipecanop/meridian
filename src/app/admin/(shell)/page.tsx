import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, gte, notInArray, sum } from "drizzle-orm";
import {
  ArrowRight,
  Banknote,
  Layers,
  Package,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { db } from "@/db";
import { landings, orders, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  OrderStatusBadge,
  orderStatusLabels,
  type OrderStatus,
} from "@/components/admin/order-status";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const session = await auth();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  // Cancelados y devueltos no cuentan como venta real.
  const excludedStatuses: (typeof orders.status.enumValues)[number][] = [
    "cancelado",
    "devuelto",
  ];

  const [
    [{ total: totalProducts }],
    [{ total: totalLandings }],
    [{ total: publishedLandings }],
    [{ total: totalOrders }],
    [todayRow],
    statusCounts,
    topLandings,
  ] = await Promise.all([
    db.select({ total: count() }).from(products),
    db.select({ total: count() }).from(landings),
    db
      .select({ total: count() })
      .from(landings)
      .where(eq(landings.status, "published")),
    db.select({ total: count() }).from(orders),
    db
      .select({ total: count(), revenue: sum(orders.total) })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, todayStart),
          notInArray(orders.status, excludedStatuses),
        ),
      ),
    db
      .select({ status: orders.status, total: count() })
      .from(orders)
      .groupBy(orders.status),
    db
      .select({
        landingId: orders.landingId,
        landingName: landings.name,
        landingSlug: landings.slug,
        total: count(),
        revenue: sum(orders.total),
      })
      .from(orders)
      .leftJoin(landings, eq(orders.landingId, landings.id))
      .where(notInArray(orders.status, excludedStatuses))
      .groupBy(orders.landingId, landings.name, landings.slug)
      .orderBy(desc(count()))
      .limit(5),
  ]);

  const ordersToday = todayRow?.total ?? 0;
  const revenueToday = Number(todayRow?.revenue ?? 0);
  const newOrders =
    statusCounts.find((s) => s.status === "nuevo")?.total ?? 0;

  const stats = [
    {
      title: "Pedidos hoy",
      value: String(ordersToday),
      detail: `${formatCurrency(revenueToday)} en ventas`,
      icon: Banknote,
      href: "/admin/orders?fecha=hoy",
    },
    {
      title: "Pedidos",
      value: String(totalOrders),
      detail: `${newOrders} nuevos por gestionar`,
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      title: "Landings",
      value: String(totalLandings),
      detail: `${publishedLandings} publicadas`,
      icon: Layers,
      href: "/admin/landings",
    },
    {
      title: "Productos",
      value: String(totalProducts),
      detail: "en catálogo",
      icon: Package,
      href: "/admin/products",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {session?.user?.name ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Este es el estado de tu tienda hoy
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="group">
            <Card className="transition-colors duration-200 group-hover:border-primary/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-primary" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.detail}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {totalOrders > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pedidos por estado</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {(Object.keys(orderStatusLabels) as OrderStatus[]).map(
                (status) => {
                  const value =
                    statusCounts.find((s) => s.status === status)?.total ?? 0;
                  const pct =
                    totalOrders > 0 ? Math.round((value / totalOrders) * 100) : 0;
                  return (
                    <Link
                      key={status}
                      href={`/admin/orders?status=${status}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5"
                    >
                      <span className="w-28 shrink-0">
                        <OrderStatusBadge status={status} />
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <span
                          className="block h-full rounded-full bg-primary/60"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">
                        {value}
                      </span>
                    </Link>
                  );
                },
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pedidos por landing
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {topLandings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin pedidos todavía
                </p>
              ) : (
                topLandings.map((row) => (
                  <Link
                    key={row.landingId ?? "sin-landing"}
                    href={
                      row.landingId
                        ? `/admin/orders?landing=${row.landingId}`
                        : "/admin/orders"
                    }
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {row.landingName ?? "(landing eliminada)"}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {row.total} {Number(row.total) === 1 ? "pedido" : "pedidos"}
                    </span>
                    <span className="w-28 text-right text-sm font-medium tabular-nums">
                      {formatCurrency(Number(row.revenue ?? 0))}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {totalProducts === 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <div>
                <p className="font-medium">Empieza creando tu primer producto</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Los productos son la base de tus landings: precio, imágenes y
                  descripción.
                </p>
              </div>
            </div>
            <Button render={<Link href="/admin/products/new" />}>
              Crear producto
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
