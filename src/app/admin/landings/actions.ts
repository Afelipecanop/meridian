"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { landings, type LandingSection } from "@/db/schema";
import { sectionSchemas, type SectionType } from "@/lib/zod-schemas/sections";
import {
  landingDraftSchema,
  normalizeSections,
  type LandingDraft,
} from "@/lib/zod-schemas/landing";
import { slugify, validateSlug } from "@/lib/slug";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
}

function makeSection(type: SectionType): LandingSection {
  return {
    id: randomUUID(),
    type,
    settings: sectionSchemas[type].parse({}) as Record<string, unknown>,
    visible: true,
  };
}

/** Plantilla base de una landing nueva. */
function templateSections(): LandingSection[] {
  return (
    [
      "hero",
      "benefits",
      "gallery",
      "offer",
      "testimonials",
      "faq",
      "order-form",
    ] as SectionType[]
  ).map(makeSection);
}

async function slugTaken(slug: string, excludeId?: string) {
  const rows = await db
    .select({ id: landings.id })
    .from(landings)
    .where(
      excludeId
        ? and(eq(landings.slug, slug), ne(landings.id, excludeId))
        : eq(landings.slug, slug),
    )
    .limit(1);
  return rows.length > 0;
}

// ---------- CRUD desde la lista ----------

export type LandingFormState =
  | { success?: false; error: string }
  | undefined;

export async function createLanding(
  _prev: LandingFormState,
  formData: FormData,
): Promise<LandingFormState> {
  await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio" };

  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
  const slugError = validateSlug(slug);
  if (slugError) return { error: slugError };
  if (await slugTaken(slug)) return { error: `El slug "${slug}" ya está en uso` };

  const productIdRaw = String(formData.get("productId") ?? "");
  const productId = productIdRaw === "" ? null : productIdRaw;

  const [created] = await db
    .insert(landings)
    .values({
      name,
      slug,
      productId,
      status: "draft",
      theme: {
        primaryColor: "#4f46e5",
        backgroundColor: "#ffffff",
        textColor: "#171717",
      },
      seo: {},
      pixels: {},
      checkoutMode: "cod",
      sections: templateSections(),
      publishedSections: [],
    })
    .returning({ id: landings.id });

  revalidatePath("/admin/landings");
  redirect(`/admin/landings/${created.id}/editor`);
}

export async function duplicateLanding(id: string) {
  await requireSession();

  const [source] = await db
    .select()
    .from(landings)
    .where(eq(landings.id, id))
    .limit(1);
  if (!source) throw new Error("Landing no encontrada");

  let slug = `${source.slug}-copia`.slice(0, 60);
  for (let i = 2; await slugTaken(slug); i++) {
    slug = `${source.slug}-copia-${i}`.slice(0, 60);
  }

  await db.insert(landings).values({
    name: `${source.name} (copia)`,
    slug,
    productId: source.productId,
    status: "draft",
    theme: source.theme,
    seo: source.seo,
    pixels: source.pixels,
    checkoutMode: source.checkoutMode,
    // Nuevos ids de sección para que la copia sea independiente.
    sections: source.sections.map((s) => ({ ...s, id: randomUUID() })),
    publishedSections: [],
  });

  revalidatePath("/admin/landings");
}

export async function archiveLanding(id: string) {
  await requireSession();
  const [row] = await db
    .update(landings)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(landings.id, id))
    .returning({ slug: landings.slug });
  revalidatePath("/admin/landings");
  if (row) revalidatePath(`/${row.slug}`);
}

export async function restoreLanding(id: string) {
  await requireSession();
  await db
    .update(landings)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(landings.id, id));
  revalidatePath("/admin/landings");
}

export async function deleteLanding(id: string) {
  await requireSession();
  const [row] = await db
    .delete(landings)
    .where(eq(landings.id, id))
    .returning({ slug: landings.slug });
  revalidatePath("/admin/landings");
  if (row) revalidatePath(`/${row.slug}`);
}

// ---------- Editor: borrador y publicación ----------

export type SaveResult = { success: true } | { success: false; error: string };

async function persistDraft(
  id: string,
  draftInput: unknown,
): Promise<{ draft: LandingDraft; previousSlug: string } | { error: string }> {
  const parsed = landingDraftSchema.safeParse(draftInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Borrador inválido" };
  }
  const draft = parsed.data;

  const slugError = validateSlug(draft.slug);
  if (slugError) return { error: slugError };
  if (await slugTaken(draft.slug, id)) {
    return { error: `El slug "${draft.slug}" ya está en uso` };
  }

  const [current] = await db
    .select({ slug: landings.slug })
    .from(landings)
    .where(eq(landings.id, id))
    .limit(1);
  if (!current) return { error: "Landing no encontrada" };

  await db
    .update(landings)
    .set({
      name: draft.name,
      slug: draft.slug,
      productId: draft.productId,
      checkoutMode: draft.checkoutMode,
      theme: draft.theme,
      seo: draft.seo,
      pixels: draft.pixels,
      sections: normalizeSections(draft.sections),
      updatedAt: new Date(),
    })
    .where(eq(landings.id, id));

  return { draft, previousSlug: current.slug };
}

export async function saveLandingDraft(
  id: string,
  draftInput: unknown,
): Promise<SaveResult> {
  await requireSession();
  const result = await persistDraft(id, draftInput);
  if ("error" in result) return { success: false, error: result.error };
  revalidatePath("/admin/landings");
  return { success: true };
}

export async function publishLanding(
  id: string,
  draftInput: unknown,
): Promise<SaveResult> {
  await requireSession();

  const result = await persistDraft(id, draftInput);
  if ("error" in result) return { success: false, error: result.error };

  const [updated] = await db
    .update(landings)
    .set({
      status: "published",
      publishedSections: normalizeSections(result.draft.sections),
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(landings.id, id))
    .returning({ slug: landings.slug });

  revalidatePath("/admin/landings");
  revalidatePath(`/${updated.slug}`);
  if (result.previousSlug !== updated.slug) {
    revalidatePath(`/${result.previousSlug}`);
  }
  return { success: true };
}

export async function unpublishLanding(id: string): Promise<SaveResult> {
  await requireSession();
  const [row] = await db
    .update(landings)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(landings.id, id))
    .returning({ slug: landings.slug });
  if (!row) return { success: false, error: "Landing no encontrada" };
  revalidatePath("/admin/landings");
  revalidatePath(`/${row.slug}`);
  return { success: true };
}
