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
  /** Ej: "4.8". Vacío = no muestra estrellas. */
  rating: z.string().default(""),
  /** Ej: "+1.200 pedidos entregados". */
  ratingCount: z.string().default(""),
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

export const trustBarSchema = z.object({
  items: z
    .array(
      z.object({
        icon: z.string().default("truck"),
        text: z.string().default("Envío gratis"),
      }),
    )
    .default([
      { icon: "truck", text: "Envío gratis esta semana" },
      { icon: "credit-card", text: "Pago contra entrega" },
      { icon: "rotate-ccw", text: "Garantía de 30 días" },
      { icon: "users", text: "Miles de clientes felices" },
    ]),
});

export const stepsSchema = z.object({
  eyebrow: z.string().default("El proceso"),
  title: z.string().default("Cómo funciona"),
  items: z
    .array(
      z.object({
        title: z.string().default("Paso"),
        description: z.string().default(""),
      }),
    )
    .default([
      {
        title: "Pide en 1 minuto",
        description: "Completa tus datos y elige forma de pago.",
      },
      {
        title: "Confirmamos tu pedido",
        description: "Validamos tu pedido y la dirección de envío.",
      },
      {
        title: "Recibe y paga",
        description: "Pagas en efectivo o transferencia al recibirla.",
      },
    ]),
});

export const comparisonSchema = z.object({
  eyebrow: z.string().default("La diferencia"),
  title: z.string().default("Por qué elegirnos"),
  ourLabel: z.string().default("Nosotros"),
  otherLabel: z.string().default("La competencia"),
  rows: z
    .array(
      z.object({
        feature: z.string().default("Característica"),
        ours: z.string().default(""),
        other: z.string().default(""),
      }),
    )
    .default([
      { feature: "Calidad de materiales", ours: "Premium", other: "Variable" },
      { feature: "Garantía", ours: "30 días", other: "No suele incluir" },
      { feature: "Envío", ours: "Gratis esta semana", other: "Con costo" },
    ]),
  note: z.string().default(""),
});

export const qualitySchema = z.object({
  eyebrow: z.string().default("Hecha para durar"),
  title: z.string().default("Calidad que puedes comprobar"),
  items: z
    .array(
      z.object({
        icon: z.string().default("shield"),
        title: z.string().default("Control de calidad"),
        description: z.string().default(""),
      }),
    )
    .default([
      {
        icon: "badge-check",
        title: "Pruebas de calidad",
        description: "Cada unidad se revisa antes de salir de fábrica.",
      },
      {
        icon: "gem",
        title: "Materiales premium",
        description: "Seleccionados por su durabilidad y acabado.",
      },
      {
        icon: "rotate-ccw",
        title: "Garantía real",
        description: "Cambio o devolución si algo no sale bien.",
      },
    ]),
});

export const stickyCtaSchema = z.object({
  /** Vacío = usa el nombre del producto. */
  label: z.string().default(""),
  ctaText: z.string().default("Pedir ahora"),
  ctaHref: z.string().default("#pedido"),
});

export const toastSchema = z.object({
  name: z.string().default("Alguien"),
  location: z.string().default("tu ciudad"),
  timeText: z.string().default("hace unos minutos"),
  delaySeconds: z.number().min(0).default(4),
  durationSeconds: z.number().min(1).default(6),
});

export const sectionSchemas = {
  hero: heroSchema,
  "trust-bar": trustBarSchema,
  benefits: benefitsSchema,
  steps: stepsSchema,
  gallery: gallerySchema,
  comparison: comparisonSchema,
  countdown: countdownSchema,
  offer: offerSchema,
  testimonials: testimonialsSchema,
  faq: faqSchema,
  "order-form": orderFormSchema,
  quality: qualitySchema,
  "custom-html": customHtmlSchema,
  "sticky-cta": stickyCtaSchema,
  toast: toastSchema,
} as const;

export type SectionType = keyof typeof sectionSchemas;

export type SectionSettings = {
  [T in SectionType]: z.infer<(typeof sectionSchemas)[T]>;
};

export type HeroSettings = SectionSettings["hero"];
export type TrustBarSettings = SectionSettings["trust-bar"];
export type BenefitsSettings = SectionSettings["benefits"];
export type StepsSettings = SectionSettings["steps"];
export type GallerySettings = SectionSettings["gallery"];
export type ComparisonSettings = SectionSettings["comparison"];
export type TestimonialsSettings = SectionSettings["testimonials"];
export type FaqSettings = SectionSettings["faq"];
export type OfferSettings = SectionSettings["offer"];
export type CountdownSettings = SectionSettings["countdown"];
export type OrderFormSettings = SectionSettings["order-form"];
export type QualitySettings = SectionSettings["quality"];
export type CustomHtmlSettings = SectionSettings["custom-html"];
export type StickyCtaSettings = SectionSettings["sticky-cta"];
export type ToastSettings = SectionSettings["toast"];
