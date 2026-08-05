import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { landings, products } from "@/db/schema";
import { Toaster } from "@/components/ui/sonner";
import { EditorShell } from "@/components/editor/editor-shell";
import { DesktopOnlyNotice } from "@/components/admin/desktop-only-notice";

export const metadata: Metadata = { title: "Editor — Meridian" };

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [[landing], productRows] = await Promise.all([
    db.select().from(landings).where(eq(landings.id, id)).limit(1),
    db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(products.name),
  ]);

  if (!landing) notFound();

  return (
    <div className="dark">
      <div className="lg:hidden">
        <DesktopOnlyNotice />
      </div>
      <div className="hidden bg-background text-foreground lg:block">
        <EditorShell landing={landing} products={productRows} />
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
