import type { Metadata } from "next";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import {
  ArrowRight,
  Layers,
  Package,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { db } from "@/db";
import { landings, orders, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const session = await auth();

  const [
    [{ total: totalProducts }],
    [{ total: totalLandings }],
    [{ total: publishedLandings }],
    [{ total: totalOrders }],
    [{ total: newOrders }],
  ] = await Promise.all([
    db.select({ total: count() }).from(products),
    db.select({ total: count() }).from(landings),
    db
      .select({ total: count() })
      .from(landings)
      .where(eq(landings.status, "published")),
    db.select({ total: count() }).from(orders),
    db.select({ total: count() }).from(orders).where(eq(orders.status, "nuevo")),
  ]);

  const stats = [
    {
      title: "Productos",
      value: totalProducts,
      detail: "en catálogo",
      icon: Package,
      href: "/admin/products",
    },
    {
      title: "Landings",
      value: totalLandings,
      detail: `${publishedLandings} publicadas`,
      icon: Layers,
      href: "/admin/landings",
    },
    {
      title: "Pedidos",
      value: totalOrders,
      detail: `${newOrders} nuevos`,
      icon: ShoppingCart,
      href: "/admin/orders",
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

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href} className="group">
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
