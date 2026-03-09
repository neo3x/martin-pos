DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CashTransactionCategory') THEN
    CREATE TYPE "CashTransactionCategory" AS ENUM ('SALE', 'TIP', 'OTHER');
  END IF;
END $$;

ALTER TABLE "cash_transactions"
ADD COLUMN IF NOT EXISTS "category" "CashTransactionCategory" NOT NULL DEFAULT 'OTHER';

UPDATE "cash_transactions"
SET "category" = 'TIP'
WHERE "category" = 'OTHER'
  AND "description" ILIKE '%propina%';

UPDATE "cash_transactions"
SET "category" = 'SALE'
WHERE "category" = 'OTHER'
  AND "saleId" IS NOT NULL;
