-- Enable pgvector and finalize the embedding vector column + index.
-- Prisma generates the base tables from schema.prisma; this migration adds the
-- pieces Prisma cannot express natively (the vector column and an ANN index).

CREATE EXTENSION IF NOT EXISTS vector;

-- The `Embedding.vector` column is declared as Unsupported("vector(1536)") in
-- schema.prisma. If your generated migration created it as a plain column,
-- ensure it is the correct vector type:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Embedding' AND column_name = 'vector'
  ) THEN
    ALTER TABLE "Embedding" ADD COLUMN "vector" vector(1536);
  END IF;
END $$;

-- Approximate nearest-neighbour index for fast cosine similarity search.
CREATE INDEX IF NOT EXISTS embedding_vector_hnsw
  ON "Embedding" USING hnsw ("vector" vector_cosine_ops);
