CREATE TYPE "public"."landing_checkout_mode" AS ENUM('cod', 'gateway', 'both');--> statement-breakpoint
ALTER TABLE "landings" ALTER COLUMN "checkout_mode" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "landings" ALTER COLUMN "checkout_mode" SET DATA TYPE "public"."landing_checkout_mode" USING "checkout_mode"::text::"public"."landing_checkout_mode";--> statement-breakpoint
ALTER TABLE "landings" ALTER COLUMN "checkout_mode" SET DEFAULT 'cod';