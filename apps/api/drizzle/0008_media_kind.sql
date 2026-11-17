CREATE TYPE "public"."media_kind" AS ENUM('gallery', 'room');--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "kind" "media_kind" DEFAULT 'gallery' NOT NULL;