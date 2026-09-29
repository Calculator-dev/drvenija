ALTER TYPE "public"."order_status" ADD VALUE IF NOT EXISTS 'declined';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "decline_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "review_email_sent_at" timestamp with time zone;
