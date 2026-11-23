ALTER TABLE "levha_ayahs" ADD COLUMN "translation" jsonb;--> statement-breakpoint
ALTER TABLE "levha_requests" ADD COLUMN "subtitle_text" text;--> statement-breakpoint
UPDATE "levha_ayahs" SET "translation" = '{"bs":"U ime Allaha, Milostivog, Samilosnog","en":"In the name of Allah, the Most Gracious, the Most Merciful"}' WHERE "name"->>'bs' = 'Bismillah';--> statement-breakpoint
INSERT INTO "levha_ayahs" ("name", "arabic", "translation", "sort_order") VALUES
  ('{"bs":"Fe bi ejji ala-i rabbikuma tukezziban (Er-Rahman, 13)","en":"Fa-bi-ayyi ala''i rabbikuma tukadhdhiban (Ar-Rahman, 13)"}', 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ', '{"bs":"Pa, koju blagodat Gospodara svoga poričete?","en":"So which of the favours of your Lord would you deny?"}', 15);
--> statement-breakpoint
UPDATE "levha_ayahs" SET "translation" = '{"bs":"Ono što Allah hoće","en":"What Allah has willed"}' WHERE "name"->>'bs' = 'Mašallah' AND "translation" IS NULL;--> statement-breakpoint
UPDATE "levha_ayahs" SET "translation" = '{"bs":"Nema boga osim Allaha, Muhammed je Allahov Poslanik","en":"There is no god but Allah, Muhammad is the Messenger of Allah"}' WHERE "name"->>'bs' = 'Šehadet' AND "translation" IS NULL;--> statement-breakpoint
UPDATE "levha_ayahs" SET "translation" = '{"bs":"Gospodaru moj, znanje mi povećaj!","en":"My Lord, increase me in knowledge"}' WHERE "name"->>'bs' = 'Rabbi zidni ilma (Ta-Ha, 114)' AND "translation" IS NULL;
