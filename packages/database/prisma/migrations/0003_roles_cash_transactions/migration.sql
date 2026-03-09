-- Add new retail-focused roles
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SELLER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STOCKER';

-- Allow multiple payment movements for the same sale (mixed payments)
DROP INDEX IF EXISTS "cash_transactions_saleId_key";
CREATE INDEX IF NOT EXISTS "cash_transactions_saleId_idx" ON "cash_transactions"("saleId");
