import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";
import { sectionSchemas } from "./sections";

const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color inválido");

export const landingThemeSchema = z.object({
  primaryColor: hexColor.optional(),
  backgroundColor: hexColor.optional(),
  textColor: hexColor.optional(),
  font: z.string().max(200).optional(),
});

export const landingSeoSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(300).optional(),
  ogImage: z.string().max(500).optional(),
});

export const landingPixelsSchema = z.object({
  metaPixelId: z.string().max(50).optional(),
  tiktokPixelId: z.string().max(50).optional(),
  gaId: z.string().max(50).optional(),
});

export const landingSectionSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  settings: z.record(z.string(), z.unknown()),
  visible: z.boolean(),
});

/**
 * Borrador completo que el editor guarda con autosave. Las `settings` de cada
 * sección se re-validan contra el esquema de su tipo en la server action
 * (secciones de tipo desconocido se descartan).
 */
export const landingDraftSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "El slug es obligatorio")
    .max(60)
    .regex(SLUG_PATTERN, "El slug solo puede tener minúsculas, números y guiones"),
  productId: z.uuid().nullable(),
  checkoutMode: z.enum(["cod", "gateway"]),
  theme: landingThemeSchema,
  seo: landingSeoSchema,
  pixels: landingPixelsSchema,
  sections: z.array(landingSectionSchema),
});

export type LandingDraft = z.infer<typeof landingDraftSchema>;

/** Valida las settings de cada sección con el esquema de su tipo. */
export function normalizeSections(
  sections: z.infer<typeof landingSectionSchema>[],
) {
  return sections.flatMap((section) => {
    const schema = sectionSchemas[section.type as keyof typeof sectionSchemas];
    if (!schema) return [];
    const parsed = schema.safeParse(section.settings);
    if (!parsed.success) return [];
    return [{ ...section, settings: parsed.data as Record<string, unknown> }];
  });
}
