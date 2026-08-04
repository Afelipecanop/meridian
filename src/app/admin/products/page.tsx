import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { count, desc, ilike, or } from "drizzle-orm";
import { ChevronLeft, ChevronRight, Package, Plus, Search } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductRowActions } from "@/components/admin/product-row-actions";

export const metadata: Metadata = { title: "Productos" };

const PAGE_SIZE = 10;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const where = q
    ? or(ilike(products.name, `%${q}%`), ilike(products.sku, `%${q}%`))
    : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(PAGE_SIZE)
      .offset((currentPage - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(products).where(where),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "producto" : "productos"} en total
          </p>
        </div>
        <Button render={<Link href="/admin/products/new" />}>
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo producto
        </Button>
      </div>

      <form className="relative max-w-sm" role="search">
        <Search
          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o SKU..."
          aria-label="Buscar productos"
          className="pl-9"
        />
      </form>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <Package className="h-6 w-6 text-muted-foreground" aria-hidden />
          </span>
          <div>
            <p className="font-medium">
              {q ? "Sin resultados" : "Aún no hay productos"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q
                ? `Nada coincide con “${q}”`
                : "Crea tu primer producto para usarlo en una landing"}
            </p>
          </div>
          {!q && (
            <Button
              variant="outline"
              className="mt-2"
              render={<Link href="/admin/products/new" />}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Crear producto
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16"></TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white/5">
                        <Package
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden
                        />
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.sku ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(product.price)}
                    {product.compareAtPrice && (
                      <span className="ml-2 text-xs text-muted-foreground line-through">
                        {formatCurrency(product.compareAtPrice)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.stock}
                  </TableCell>
                  <TableCell>
                    {product.active ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ProductRowActions
                      id={product.id}
                      name={product.name}
                      active={product.active}
                    />
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
                render={
                  <Link
                    href={`/admin/products?q=${encodeURIComponent(q)}&page=${currentPage - 1}`}
                  />
                }
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
                render={
                  <Link
                    href={`/admin/products?q=${encodeURIComponent(q)}&page=${currentPage + 1}`}
                  />
                }
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
