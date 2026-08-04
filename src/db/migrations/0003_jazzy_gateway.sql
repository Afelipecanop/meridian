ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'nuevo'::text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('nuevo', 'confirmado', 'en_preparacion', 'despachado', 'entregado', 'cancelado', 'devuelto');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'nuevo'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING (CASE "status" WHEN 'enviado' THEN 'despachado' ELSE "status" END)::"public"."order_status";