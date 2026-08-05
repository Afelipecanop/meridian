import type { ComponentType } from "react";
import {
  Award,
  BadgePercent,
  BellRing,
  Code2,
  HelpCircle,
  Images,
  ListChecks,
  ListOrdered,
  MessageSquareQuote,
  PanelBottom,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import {
  sectionSchemas,
  type SectionSettings,
  type SectionType,
} from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";
import { HeroSection } from "./hero";
import { TrustBarSection } from "./trust-bar";
import { BenefitsSection } from "./benefits";
import { StepsSection } from "./steps";
import { GallerySection } from "./gallery";
import { ComparisonSection } from "./comparison";
import { TestimonialsSection } from "./testimonials";
import { FaqSection } from "./faq";
import { OfferSection } from "./offer";
import { CountdownSection } from "./countdown";
import { OrderFormSection } from "./order-form";
import { QualitySection } from "./quality";
import { CustomHtmlSection } from "./custom-html";
import { StickyCtaSection } from "./sticky-cta";
import { ToastSection } from "./toast";

export type { SectionType, SectionSettings };

/**
 * Contrato de una sección: componente de render público + esquema Zod de sus
 * settings + defaults + metadatos para el editor (Etapa 4).
 * Agregar un tipo nuevo = crear el componente y su esquema, y registrarlo aquí.
 */
export type SectionRegistryEntry<T extends SectionType = SectionType> = {
  type: T;
  label: string;
  description: string;
  icon: LucideIcon;
  schema: (typeof sectionSchemas)[T];
  defaults: SectionSettings[T];
  component: ComponentType<SectionProps<SectionSettings[T]>>;
};

function entry<T extends SectionType>(
  type: T,
  label: string,
  description: string,
  icon: LucideIcon,
  component: ComponentType<SectionProps<SectionSettings[T]>>,
): SectionRegistryEntry<T> {
  return {
    type,
    label,
    description,
    icon,
    schema: sectionSchemas[type],
    defaults: sectionSchemas[type].parse({}) as SectionSettings[T],
    component,
  };
}

export const sectionRegistry: {
  [T in SectionType]: SectionRegistryEntry<T>;
} = {
  hero: entry(
    "hero",
    "Hero",
    "Encabezado principal con titular, imagen y CTA",
    Sparkles,
    HeroSection,
  ),
  benefits: entry(
    "benefits",
    "Beneficios",
    "Cuadrícula de beneficios con íconos",
    ListChecks,
    BenefitsSection,
  ),
  gallery: entry(
    "gallery",
    "Galería",
    "Imágenes del producto en cuadrícula",
    Images,
    GallerySection,
  ),
  testimonials: entry(
    "testimonials",
    "Testimonios",
    "Reseñas de clientes con calificación",
    MessageSquareQuote,
    TestimonialsSection,
  ),
  faq: entry(
    "faq",
    "Preguntas frecuentes",
    "Acordeón de preguntas y respuestas",
    HelpCircle,
    FaqSection,
  ),
  offer: entry(
    "offer",
    "Oferta / Precio",
    "Precio del producto con descuento y CTA",
    BadgePercent,
    OfferSection,
  ),
  countdown: entry(
    "countdown",
    "Cuenta regresiva",
    "Temporizador de urgencia hacia una fecha",
    Timer,
    CountdownSection,
  ),
  "order-form": entry(
    "order-form",
    "Formulario de pedido",
    "Captura de datos del cliente para comprar",
    ShoppingCart,
    OrderFormSection,
  ),
  "custom-html": entry(
    "custom-html",
    "HTML personalizado",
    "Bloque libre de HTML (sanitizado)",
    Code2,
    CustomHtmlSection,
  ),
  "trust-bar": entry(
    "trust-bar",
    "Barra de confianza",
    "Franja de íconos con garantías rápidas (envío, pago, devoluciones)",
    ShieldCheck,
    TrustBarSection,
  ),
  steps: entry(
    "steps",
    "Cómo funciona",
    "Pasos numerados del proceso de compra",
    ListOrdered,
    StepsSection,
  ),
  comparison: entry(
    "comparison",
    "Tabla comparativa",
    "Compara tu producto frente a la competencia",
    Scale,
    ComparisonSection,
  ),
  quality: entry(
    "quality",
    "Insignias de calidad",
    "Cuadrícula centrada de sellos de calidad o confianza",
    Award,
    QualitySection,
  ),
  "sticky-cta": entry(
    "sticky-cta",
    "CTA fija (móvil)",
    "Barra de compra fija al pie, visible solo en móvil",
    PanelBottom,
    StickyCtaSection,
  ),
  toast: entry(
    "toast",
    "Aviso de compra reciente",
    "Notificación flotante de prueba social",
    BellRing,
    ToastSection,
  ),
};

export const sectionTypes = Object.keys(sectionRegistry) as SectionType[];

export function isSectionType(type: string): type is SectionType {
  return type in sectionRegistry;
}
