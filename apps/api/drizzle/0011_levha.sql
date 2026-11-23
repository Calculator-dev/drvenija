CREATE TYPE "public"."levha_request_status" AS ENUM('new', 'contacted', 'accepted', 'declined');--> statement-breakpoint
ALTER TYPE "public"."media_kind" ADD VALUE 'calligraphy';--> statement-breakpoint
CREATE TABLE "levha_ayahs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"arabic" text NOT NULL,
	"image_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "levha_ayahs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "levha_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar(40) NOT NULL,
	"locale" "locale" NOT NULL,
	"configuration" jsonb NOT NULL,
	"ayah_name" text,
	"price" integer,
	"full_name" varchar(160) NOT NULL,
	"email" varchar(190) NOT NULL,
	"phone" varchar(60),
	"notes" text,
	"status" "levha_request_status" DEFAULT 'new' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "levha_requests_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "levha_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "levha_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"pricing" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "levha_settings_single_row" CHECK ("levha_settings"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "levha_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "levha_ayahs" ADD CONSTRAINT "levha_ayahs_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "levha_requests_created_idx" ON "levha_requests" USING btree ("created_at");--> statement-breakpoint
-- Starter texts for the levha configurator; edit, reorder or switch them off in the CRM.
INSERT INTO "levha_ayahs" ("name", "arabic", "sort_order") VALUES
  ('{"bs":"Bismillah","en":"Bismillah"}', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', 10),
  ('{"bs":"Mašallah","en":"Mashallah"}', 'مَا شَاءَ ٱللَّهُ', 20),
  ('{"bs":"Šehadet","en":"Shahada"}', 'لَا إِلَٰهَ إِلَّا ٱللَّهُ مُحَمَّدٌ رَسُولُ ٱللَّهِ', 30),
  ('{"bs":"Rabbi zidni ilma (Ta-Ha, 114)","en":"Rabbi zidni ilma (Ta-Ha, 114)"}', 'رَبِّ زِدْنِي عِلْمًا', 40),
  ('{"bs":"Allah","en":"Allah"}', 'ٱللَّهُ', 50);
