import "dotenv/config";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { landings, products, type LandingSection } from "../src/db/schema";
import {
  sectionSchemas,
  type SectionSettings,
  type SectionType,
} from "../src/lib/zod-schemas/sections";

/**
 * Crea (o actualiza) un producto y una landing demo publicada con todas las
 * secciones, para probar el render público de /:slug mientras no existe el
 * editor (Etapa 4). Idempotente: se puede correr varias veces.
 *
 *   npm run db:seed:landing   →  http://localhost:3000/botella-aurora
 */

const SLUG = "botella-aurora";

function section<T extends SectionType>(
  type: T,
  settings: Partial<SectionSettings[T]> = {},
): LandingSection {
  // parse() valida los overrides y rellena los defaults del esquema.
  return {
    id: randomUUID(),
    type,
    settings: sectionSchemas[type].parse(settings),
    visible: true,
  };
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  const db = drizzle(client);

  // ---------- Producto demo ----------
  const productData = {
    name: "Botella Térmica Aurora 750 ml",
    description:
      "Botella térmica de acero inoxidable con doble pared al vacío: mantiene tus bebidas frías 24 horas o calientes 12. Libre de BPA, antiderrames y con acabado soft-touch.",
    price: "89900",
    compareAtPrice: "129900",
    sku: "AUR-750",
    stock: 120,
    images: ["/demo/aurora-1.svg", "/demo/aurora-2.svg", "/demo/aurora-3.svg"],
    active: true,
  };

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.sku, "AUR-750"));

  let productId: string;
  if (existingProduct.length > 0) {
    productId = existingProduct[0].id;
    await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, productId));
    console.log(`Producto demo actualizado: ${productData.name}`);
  } else {
    const [inserted] = await db
      .insert(products)
      .values(productData)
      .returning({ id: products.id });
    productId = inserted.id;
    console.log(`Producto demo creado: ${productData.name}`);
  }

  // ---------- Secciones de la landing ----------
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const sections: LandingSection[] = [
    section("hero", {
      badge: "Nuevo · Botella Aurora",
      title: "Tu bebida a la temperatura perfecta, todo el día",
      subtitle:
        "24 horas de frío, 12 de calor. Acero inoxidable premium, cero derrames, cero BPA — hecha para acompañarte desde el gimnasio hasta la oficina.",
      image: "/demo/aurora-1.svg",
      ctaText: "Pedir la mía",
      rating: "4.8",
      ratingCount: "+1.200 pedidos entregados",
    }),
    section("trust-bar", {
      items: [
        { icon: "truck", text: "Envío gratis esta semana" },
        { icon: "credit-card", text: "Pago contra entrega" },
        { icon: "rotate-ccw", text: "Garantía de 30 días" },
        { icon: "users", text: "+1.200 clientes felices" },
      ],
    }),
    section("benefits", {
      title: "Todo lo que esperas de una botella térmica, sin lo que sobra",
      items: [
        {
          icon: "clock",
          title: "24 h de frío · 12 h de calor",
          description:
            "Doble pared al vacío de grado alimenticio: tu bebida se mantiene en su punto de la mañana a la noche, sin condensación por fuera.",
        },
        {
          icon: "shield",
          title: "Antiderrames garantizado",
          description: "Tapa de rosca con sello de silicona hermético.",
        },
        {
          icon: "leaf",
          title: "Libre de BPA",
          description: "Acero inoxidable 18/8, sin sabores extraños.",
        },
        {
          icon: "truck",
          title: "Envío contra entrega",
          description: "Pagas cuando la recibes, en todo el país.",
        },
        {
          icon: "sparkles",
          title: "Acabado soft-touch",
          description: "Se siente tan bien como se ve.",
        },
        {
          icon: "heart",
          title: "Garantía de 30 días",
          description: "Si no te encanta, te devolvemos tu dinero.",
        },
      ],
    }),
    section("steps", {
      eyebrow: "El proceso",
      title: "Pedir por pago contra entrega, sin vueltas",
      items: [
        {
          title: "Pide en 1 minuto",
          description: "Completa tus datos y elige forma de pago.",
        },
        {
          title: "Confirmamos por WhatsApp",
          description: "Validamos tu pedido y la dirección de envío.",
        },
        {
          title: "Recibe y paga",
          description: "Pagas en efectivo o transferencia al recibirla.",
        },
      ],
    }),
    section("gallery", { title: "Conócela de cerca" }),
    section("comparison", {
      eyebrow: "La diferencia",
      title: "Aurora frente a una botella común",
      ourLabel: "Aurora",
      otherLabel: "Botella común",
      rows: [
        { feature: "Retención de frío", ours: "24 horas", other: "4–6 horas" },
        { feature: "Retención de calor", ours: "12 horas", other: "2–3 horas" },
        {
          feature: "Sello antiderrames",
          ours: "Silicona hermética",
          other: "Tapa rosca simple",
        },
        {
          feature: "Material",
          ours: "Acero 18/8 sin BPA",
          other: "Plástico o aluminio genérico",
        },
        { feature: "Garantía", ours: "30 días", other: "No suele incluir" },
      ],
      note: "*Cifras de referencia para esta demo — reemplázalas por datos verificados de tu producto y de la competencia real.",
    }),
    section("countdown", {
      title: "El precio de lanzamiento termina en",
      endsAt: in7days.toISOString(),
    }),
    section("offer", {
      badge: "Oferta de lanzamiento",
      title: "Llévala hoy con 31% de descuento",
      description: "Precio especial por tiempo limitado, hasta agotar stock.",
      note: "Pago contra entrega · Garantía de 30 días",
      ctaText: "Aprovechar la oferta",
    }),
    section("testimonials", {
      title: "+1.200 personas ya la tienen",
      items: [
        {
          name: "Laura G. — Bogotá",
          text: "Le puse hielo a las 7 am y a las 9 pm seguía intacto. No exageran con las 24 horas.",
          rating: 5,
        },
        {
          name: "Andrés M. — Medellín",
          text: "La llevo al gimnasio y a la oficina. No suda, no gotea y se ve espectacular.",
          rating: 5,
        },
        {
          name: "Camila R. — Cali",
          text: "El café me dura caliente toda la mañana. Valió cada peso.",
          rating: 4,
        },
      ],
    }),
    section("faq", {
      items: [
        {
          question: "¿Cómo funciona el pago contra entrega?",
          answer:
            "Haces tu pedido con tus datos, te confirmamos por WhatsApp y pagas en efectivo o transferencia cuando la recibes.",
        },
        {
          question: "¿Cuánto tarda el envío?",
          answer:
            "Entre 24 y 72 horas hábiles según tu ciudad. Te compartimos la guía de seguimiento.",
        },
        {
          question: "¿Se puede lavar en lavavajillas?",
          answer:
            "Recomendamos lavado a mano para conservar el acabado exterior. El interior es de acero pulido, muy fácil de limpiar.",
        },
        {
          question: "¿Qué pasa si llega golpeada o no me gusta?",
          answer:
            "Tienes 30 días de garantía: te la cambiamos o te devolvemos el dinero, sin preguntas.",
        },
      ],
    }),
    section("order-form", {
      subtitle:
        "Déjanos tus datos y te contactamos por WhatsApp para confirmar tu pedido.",
      showNotes: true,
    }),
    section("quality", {
      eyebrow: "Hecha para durar",
      title: "Cada Aurora pasa 12 pruebas de calidad antes de salir de fábrica",
      items: [
        {
          icon: "badge-check",
          title: "12 pruebas de calidad",
          description: "Hermeticidad, retención térmica, caídas y acabado.",
        },
        {
          icon: "gem",
          title: "Acero 18/8 grado alimenticio",
          description: "Resistente a rayones, sin sabores extraños.",
        },
        {
          icon: "package",
          title: "Boca ancha",
          description: "Compatible con hielo y fácil de lavar.",
        },
      ],
    }),
    section("sticky-cta", { ctaText: "Pedir ahora" }),
    section("toast", {
      name: "Andrés",
      location: "Medellín",
      timeText: "hace 4 min",
    }),
  ];

  // ---------- Landing demo ----------
  const landingData = {
    slug: SLUG,
    name: "Botella Aurora",
    productId,
    status: "published" as const,
    theme: {
      primaryColor: "#4f46e5",
      backgroundColor: "#ffffff",
      textColor: "#171717",
    },
    seo: {
      title: "Botella Térmica Aurora — 24 h de frío, 12 h de calor",
      description:
        "Acero inoxidable premium, antiderrames y libre de BPA. Con 31% de descuento de lanzamiento y pago contra entrega.",
      ogImage: "/demo/aurora-1.svg",
    },
    pixels: {},
    checkoutMode: "cod" as const,
    sections,
    publishedSections: sections,
    publishedAt: new Date(),
  };

  const existingLanding = await db
    .select()
    .from(landings)
    .where(eq(landings.slug, SLUG));

  if (existingLanding.length > 0) {
    await db
      .update(landings)
      .set({ ...landingData, updatedAt: new Date() })
      .where(eq(landings.id, existingLanding[0].id));
    console.log(`Landing demo actualizada: /${SLUG}`);
  } else {
    await db.insert(landings).values(landingData);
    console.log(`Landing demo creada: /${SLUG}`);
  }

  await client.end();
  console.log(
    `Listo. Levanta el dev server y abre http://localhost:3000/${SLUG}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
