-- Room photos ("Slika u prostoru") were replaced by cutouts. Detach any that were uploaded so
-- they no longer belong to a product; the media cleanup script removes them from storage.
UPDATE "media_assets" SET "product_id" = NULL, "kind" = 'gallery', "is_primary" = false WHERE "kind" = 'room';
