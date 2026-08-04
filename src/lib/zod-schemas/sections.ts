import { z } from "zod";

/**
 * Esquemas de `settings` por tipo de sección.
 * Todos los campos tienen `.default()`, de modo que `schema.parse({})`
 * produce la configuración inicial de una sección recién agregada.
 * El editor (Etapa 4) genera sus formularios a partir de estos esquemas.
 */

export const heroSchema = z.object({
  badge: z.string().default(""),
  title: z.string().default("Tu producto estrella"),
  subtitle: z
    .string()
    .default("Describe en una frase por qué este producto es irresistible."),
  image: z.string().default(""),
  ctaText: z.string().default("Pedir ahora"),
  ctaHref: z.string().default("#pedido"),
});

export const benefitsSchema = z.object({
  title: z.string().default("¿Por qué elegirlo?"),
  items: z
    .array(
      z.object({
        icon: z.string().default("check"),
        title: z.string().default("Beneficio"),
        description: z.string().default(""),
      }),
    )
    .default([
      { icon: "truck", title: "Envío rápido", description: "Recibe en 24–72 horas." },
      { icon: "shield", title: "Garantía", description: "30 días de garantía total." },
      { icon: "star", title: "Calidad premium", description: "Materiales seleccionados." },
    ]),
});

export const gallerySchema = z.object({
  title: z.string().default(""),
  images: z.array(z.string()).default([]),
});

export const testimonialsSchema = z.object({
  title: z.string().default("Lo que dicen nuestros clientes"),
  items: z
    .array(
      z.object({
        name: z.string().default("Cliente"),
        text: z.string().default(""),
        rating: z.number().int().min(1).max(5).default(5),
      }),
    )
    .default([]),
});

export const faqSchema = z.object({
  title: z.string().default("Preguntas frecuentes"),
  items: z
    .array(
      z.object({
        question: z.string().default("¿Pregunta?"),
        answer: z.string().default(""),
      }),
    )
    .default([]),
});

export const offerSchema = z.object({
  badge: z.string().default("Oferta por tiempo limitado"),
  title: z.string().default("Precio especial de lanzamiento"),
  description: z.string().default(""),
  showCompareAtPrice: z.boolean().default(true),
  note: z.string().default("Pago contra entrega disponible"),
  ctaText: z.string().default("Lo quiero"),
  ctaHref: z.string().default("#pedido"),
});

export const countdownSchema = z.object({
  title: z.string().default("La oferta termina en"),
  /** Fecha-hora ISO; vacío = la sección no se muestra. */
  endsAt: z.string().default(""),
  expiredText: z.string().default("¡La oferta ha terminado!"),
});

export const orderFormSchema = z.object({
  /** Ancla para los CTA (`#pedido`). */
  anchorId: z.string().default("pedido"),
  title: z.string().default("Haz tu pedido"),
  subtitle: z
    .string()
    .default("Completa tus datos y te contactamos para confirmar."),
  buttonText: z.string().default("Confirmar pedido"),
  showEmail: z.boolean().default(false),
  showNotes: z.boolean().default(false),
  footnote: z.string().default("Pagas al recibir. Sin costos ocultos."),
  successTitle: z.string().default("¡Pedido recibido!"),
  successMessage: z
    .string()
    .default(
      "Gracias por tu compra. Te contactaremos muy pronto para confirmar la entrega.",
    ),
});

export const customHtmlSchema = z.object({
  html: z.string().default(""),
});

export const sectionSchemas = {
  hero: heroSchema,
  benefits: benefitsSchema,
  gallery: gallerySchema,
  testimonials: testimonialsSchema,
  faq: faqSchema,
  offer: offerSchema,
  countdown: countdownSchema,
  "order-form": orderFormSchema,
  "custom-html": customHtmlSchema,
} as const;

export type SectionType = keyof typeof sectionSchemas;

export type SectionSettings = {
  [T in SectionType]: z.infer<(typeof sectionSchemas)[T]>;
};

export type HeroSettings = SectionSettings["hero"];
export type BenefitsSettings = SectionSettings["benefits"];
export type GallerySettings = SectionSettings["gallery"];
export type TestimonialsSettings = SectionSettings["testimonials"];
export type FaqSettings = SectionSettings["faq"];
export type OfferSettings = SectionSettings["offer"];
export type CountdownSettings = SectionSettings["countdown"];
export type OrderFormSettings = SectionSettings["order-form"];
export type CustomHtmlSettings = SectionSettings["custom-html"];
