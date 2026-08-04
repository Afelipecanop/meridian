import type { SectionType } from "@/lib/zod-schemas/sections";

/**
 * Definición declarativa de los formularios del panel de ajustes.
 * Cada tipo de sección lista sus campos; el panel los renderiza genéricamente.
 * (Los esquemas Zod validan en servidor; esto define la UI en el cliente.)
 */

export type ScalarFieldDef =
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "textarea"; key: string; label: string; rows?: number; placeholder?: string }
  | { kind: "code"; key: string; label: string; rows?: number }
  | { kind: "boolean"; key: string; label: string }
  | { kind: "number"; key: string; label: string; min?: number; max?: number }
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: "image"; key: string; label: string }
  | { kind: "datetime"; key: string; label: string };

export type FieldDef =
  | ScalarFieldDef
  | { kind: "images"; key: string; label: string }
  | {
      kind: "items";
      key: string;
      label: string;
      /** Campo del item usado como título en la lista plegable. */
      itemLabelKey: string;
      addLabel: string;
      fields: ScalarFieldDef[];
      makeItem: () => Record<string, unknown>;
    };

const iconOptions = [
  { value: "check", label: "Check" },
  { value: "clock", label: "Reloj" },
  { value: "heart", label: "Corazón" },
  { value: "leaf", label: "Hoja" },
  { value: "package", label: "Paquete" },
  { value: "shield", label: "Escudo" },
  { value: "sparkles", label: "Destellos" },
  { value: "star", label: "Estrella" },
  { value: "thumbs-up", label: "Pulgar arriba" },
  { value: "truck", label: "Camión" },
  { value: "zap", label: "Rayo" },
];

export const sectionFields: Record<SectionType, FieldDef[]> = {
  hero: [
    { kind: "text", key: "badge", label: "Insignia", placeholder: "Ej: Nuevo · Envío gratis" },
    { kind: "text", key: "title", label: "Título" },
    { kind: "textarea", key: "subtitle", label: "Subtítulo", rows: 3 },
    { kind: "image", key: "image", label: "Imagen (vacío = imagen del producto)" },
    { kind: "text", key: "ctaText", label: "Texto del botón" },
    { kind: "text", key: "ctaHref", label: "Destino del botón", placeholder: "#pedido" },
  ],
  benefits: [
    { kind: "text", key: "title", label: "Título" },
    {
      kind: "items",
      key: "items",
      label: "Beneficios",
      itemLabelKey: "title",
      addLabel: "Agregar beneficio",
      fields: [
        { kind: "select", key: "icon", label: "Ícono", options: iconOptions },
        { kind: "text", key: "title", label: "Título" },
        { kind: "textarea", key: "description", label: "Descripción", rows: 2 },
      ],
      makeItem: () => ({ icon: "check", title: "Beneficio", description: "" }),
    },
  ],
  gallery: [
    { kind: "text", key: "title", label: "Título (opcional)" },
    { kind: "images", key: "images", label: "Imágenes (vacío = imágenes del producto)" },
  ],
  testimonials: [
    { kind: "text", key: "title", label: "Título" },
    {
      kind: "items",
      key: "items",
      label: "Testimonios",
      itemLabelKey: "name",
      addLabel: "Agregar testimonio",
      fields: [
        { kind: "text", key: "name", label: "Nombre" },
        { kind: "textarea", key: "text", label: "Testimonio", rows: 3 },
        { kind: "number", key: "rating", label: "Estrellas (1–5)", min: 1, max: 5 },
      ],
      makeItem: () => ({ name: "Cliente", text: "", rating: 5 }),
    },
  ],
  faq: [
    { kind: "text", key: "title", label: "Título" },
    {
      kind: "items",
      key: "items",
      label: "Preguntas",
      itemLabelKey: "question",
      addLabel: "Agregar pregunta",
      fields: [
        { kind: "text", key: "question", label: "Pregunta" },
        { kind: "textarea", key: "answer", label: "Respuesta", rows: 3 },
      ],
      makeItem: () => ({ question: "¿Pregunta?", answer: "" }),
    },
  ],
  offer: [
    { kind: "text", key: "badge", label: "Insignia" },
    { kind: "text", key: "title", label: "Título" },
    { kind: "textarea", key: "description", label: "Descripción", rows: 2 },
    { kind: "boolean", key: "showCompareAtPrice", label: "Mostrar precio de comparación" },
    { kind: "text", key: "note", label: "Nota bajo el botón" },
    { kind: "text", key: "ctaText", label: "Texto del botón" },
    { kind: "text", key: "ctaHref", label: "Destino del botón", placeholder: "#pedido" },
  ],
  countdown: [
    { kind: "text", key: "title", label: "Título" },
    { kind: "datetime", key: "endsAt", label: "Termina el" },
    { kind: "text", key: "expiredText", label: "Texto al expirar" },
  ],
  "order-form": [
    { kind: "text", key: "title", label: "Título" },
    { kind: "textarea", key: "subtitle", label: "Subtítulo", rows: 2 },
    { kind: "text", key: "buttonText", label: "Texto del botón" },
    { kind: "boolean", key: "showEmail", label: "Pedir correo" },
    { kind: "boolean", key: "showNotes", label: "Permitir notas" },
    { kind: "text", key: "footnote", label: "Nota al pie" },
    { kind: "text", key: "successTitle", label: "Título del mensaje de gracias" },
    { kind: "textarea", key: "successMessage", label: "Mensaje de gracias", rows: 3 },
    { kind: "text", key: "anchorId", label: "Ancla (para los CTA)", placeholder: "pedido" },
  ],
  "custom-html": [
    { kind: "code", key: "html", label: "HTML (se sanitiza en servidor: sin <script>)", rows: 14 },
  ],
};

export const fontOptions = [
  { value: "", label: "Predeterminada (Geist)" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia (serif)" },
  { value: "'Segoe UI', system-ui, sans-serif", label: "Segoe UI" },
  { value: "'Courier New', monospace", label: "Monoespaciada" },
];
