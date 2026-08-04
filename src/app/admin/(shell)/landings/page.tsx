import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ExternalLink, Layers } from "lucide-react";
import { db } from "@/db";
import { landings, products } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LandingCreateDialog } from "@/components/admin/landing-create-dialog";
import { LandingRowActions } from "@/components/admin/landing-row-actions";

export const metadata: Metadata = { title: "Landings" };

function StatusBadge({
  status,
  dirty,
}: {
  status: "draft" | "published" | "archived";
  dirty: boolean;
}) {
  if (status === "published") {
    return (
      <span className="flex items-center gap-2">
        <Badge className="bg-emerald-500/15 text-emerald-400">Publicada</Badge>
        {dirty && (
          <span
            className="text-xs text-amber-400"
            title="El borrador tiene cambios que aún no se publican"
          >
            ● cambios sin publicar
          </span>
        )}
      </span>
    );
  }
  if (status === "archived") {
    return <Badge variant="secondary">Archivada</Badge>;
  }
  return <Badge className="bg-sky-500/15 text-sky-400">Borrador</Badge>;
}

export default async function LandingsPage() {
  const [rows, productOptions] = await Promise.all([
    db
      .select({ landing: landings, productName: products.name })
      .from(landings)
      .leftJoin(products, eq(landings.productId, products.id))
      .orderBy(desc(landings.updatedAt)),
    db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.active, true))
      .orderBy(products.name),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Landings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "landing" : "landings"} en total
          </p>
        </div>
        <LandingCreateDialog products={productOptions} />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <Layers className="h-6 w-6 text-muted-foreground" aria-hidden />
          </span>
          <div>
            <p className="font-medium">Aún no hay landings</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea tu primera landing y edítala visualmente
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Landing</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Actualizada</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ landing, productName }) => {
                const dirty =
                  landing.status === "published" &&
                  JSON.stringify(landing.sections) !==
                    JSON.stringify(landing.publishedSections);
                return (
                  <TableRow key={landing.id}>
                    <TableCell>
                      <Link
                        href={`/admin/landings/${landing.id}/editor`}
                        className="font-medium hover:underline"
                      >
                        {landing.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {landing.status === "published" ? (
                        <a
                          href={`/${landing.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                        >
                          /{landing.slug}
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      ) : (
                        <>/{landing.slug}</>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {productName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={landing.status} dirty={dirty} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(landing.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <LandingRowActions
                        id={landing.id}
                        name={landing.name}
                        slug={landing.slug}
                        status={landing.status}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
