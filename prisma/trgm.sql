-- trigram indexes for ILIKE/fuzzy search (Prisma cannot declare these natively)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Model_name_trgm_idx" ON "Model" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Model_slug_trgm_idx" ON "Model" USING gin ("slug" gin_trgm_ops);
