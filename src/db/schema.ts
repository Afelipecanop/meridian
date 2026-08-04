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

export type OrderCustomer = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
};

// ---------- Enums ----------

export const landingStatusEnum = pgEnum("landing_status", [
  "draft",
  "published",
  "archived",
]);

export const checkoutModeEnum = pgEnum("checkout_mode", ["cod", "gateway"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "na",
  "pending",
  "paid",
  "failed",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "nuevo",
  "confirmado",
  "enviado",
  "entregado",
  "cancelado",
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
  checkoutMode: checkoutModeEnum("checkout_mode").notNull().default("cod"),
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
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: checkoutModeEnum("payment_method").notNull().default("cod"),
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
