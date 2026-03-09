DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AIProvider') THEN
    CREATE TYPE "AIProvider" AS ENUM ('OPENAI', 'ANTHROPIC');
  END IF;
END $$;

ALTER TABLE "order_items"
ADD COLUMN IF NOT EXISTS "estimatedPrepMinutes" INTEGER NOT NULL DEFAULT 15;

CREATE TABLE IF NOT EXISTS "ai_provider_keys" (
  "id" TEXT NOT NULL,
  "provider" "AIProvider" NOT NULL,
  "encryptedKey" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "authTag" TEXT NOT NULL,
  "keyFingerprint" TEXT,
  "last4" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "branchId" TEXT NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ai_provider_keys_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_provider_keys_branchId_provider_isActive_idx"
  ON "ai_provider_keys"("branchId", "provider", "isActive");
CREATE INDEX IF NOT EXISTS "ai_provider_keys_createdById_idx"
  ON "ai_provider_keys"("createdById");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_provider_keys_branchId_fkey'
  ) THEN
    ALTER TABLE "ai_provider_keys"
      ADD CONSTRAINT "ai_provider_keys_branchId_fkey"
      FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_provider_keys_createdById_fkey'
  ) THEN
    ALTER TABLE "ai_provider_keys"
      ADD CONSTRAINT "ai_provider_keys_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
