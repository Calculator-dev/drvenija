CREATE TYPE "public"."levha_contact" AS ENUM('email', 'whatsapp', 'viber');--> statement-breakpoint
ALTER TABLE "levha_requests" ADD COLUMN "contact_method" "levha_contact" DEFAULT 'email' NOT NULL;