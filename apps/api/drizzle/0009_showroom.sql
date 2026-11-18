ALTER TYPE "public"."media_kind" ADD VALUE 'cutout';--> statement-breakpoint
ALTER TYPE "public"."media_kind" ADD VALUE 'showroom';--> statement-breakpoint
CREATE TABLE "showroom_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"image_id" uuid,
	"art_area" jsonb NOT NULL,
	"wall_outline" jsonb NOT NULL,
	"area_width_cm" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "showroom_settings_single_row" CHECK ("showroom_settings"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "showroom_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "showroom_settings" ADD CONSTRAINT "showroom_settings_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;