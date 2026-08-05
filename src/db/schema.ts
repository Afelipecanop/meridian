import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ---------- Tipos de los campos JSON ----------

export type LandingSection = {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  visible: boolean;
};

export type LandingTheme = {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  font?: string;
};

export type LandingSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
};

export type LandingPixels = {
  metaPixelId?: string;
  tiktokPixelId?: string;
  gaId?: string;
};

export type ProductVariantGroup = {
  name: string;
  options: string[];
};

export type OrderCustomer = {
  nombres: string;
  apellidos: string;
  /** ISO 3166-1 alpha-2 del indicativo elegido (ver src/lib/countries.ts). */
  pais: string;
  /** Con indicativo incluido, ej. "+573001234567". */
  telefono: string;
  email?: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  notas?: string;
};

// ---------- Enums ----------

export const landingStatusEnum = pgEnum("landing_status", [
  "draft",
  "published",
  "archived",
]);

/** Método de pago real de un pedido: siempre uno de los dos, nunca "both". */
export const paymentMethodEnum = pgEnum("checkout_mode", ["cod", "gateway"]);

/**
 * Modo de checkout que ofrece una landing. "both" deja que el comprador
 * elija en el formulario de pedido entre contra entrega y pago anticipado
 * (ver paymentMethodEnum, que es el que terminan usando los pedidos).
 */
export const landingCheckoutModeEnum = pgEnum("landing_checkout_mode", [
  "cod",
  "gateway",
  "both",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "na",
  "pending",
  "paid",
  "failed",
]);

/**
 * Estado operativo/logístico del pedido (independiente de payment_status).
 * "en_preparacion" = pedido confirmado, en alistamiento/empaque;
 * "despachado" = ya salió con la transportadora (antes "enviado");
 * "devuelto" = la transportadora lo regresó (no entregado o rechazado).
 */
export const orderStatusEnum = pgEnum("order_status", [
  "nuevo",
  "confirmado",
  "en_preparacion",
  "despachado",
  "entregado",
  "cancelado",
  "devuelto",
]);

// ---------- Tablas ----------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 12, scale: 2 }),
  sku: text("sku"),
  stock: integer("stock").notNull().default(0),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  variants: jsonb("variants")
    .$type<ProductVariantGroup[]>()
    .notNull()
    .default([]),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const landings = pgTable("landings", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  status: landingStatusEnum("status").notNull().default("draft"),
  theme: jsonb("theme").$type<LandingTheme>().notNull().default({}),
  seo: jsonb("seo").$type<LandingSeo>().notNull().default({}),
  pixels: jsonb("pixels").$type<LandingPixels>().notNull().default({}),
  checkoutMode: landingCheckoutModeEnum("checkout_mode").notNull().default("cod"),
  sections: jsonb("sections").$type<LandingSection[]>().notNull().default([]),
  publishedSections: jsonb("published_sections")
    .$type<LandingSection[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  landingId: uuid("landing_id").references(() => landings.id, {
    onDelete: "set null",
  }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  customer: jsonb("customer").$type<OrderCustomer>().notNull(),
  selectedVariants: jsonb("selected_variants")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cod"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("na"),
  paymentRef: text("payment_ref"),
  status: orderStatusEnum("status").notNull().default("nuevo"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  size: integer("size").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------- Tipos inferidos ----------

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Landing = typeof landings.$inferSelect;
export type NewLanding = typeof landings.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Asset = typeof assets.$inferSelect;
