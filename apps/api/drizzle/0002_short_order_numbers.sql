UPDATE "orders"
SET "order_number" = 'DRV-' || to_char("created_at" AT TIME ZONE 'UTC', 'YYMMDD') || '-' || upper(substr(replace("id"::text, '-', ''), 1, 8))
WHERE "order_number" ~ '^DRV-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
