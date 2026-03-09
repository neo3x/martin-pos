-- Restaurant send flow, tip support primitives and QR guest requests

ALTER TABLE "tables"
ADD COLUMN IF NOT EXISTS "qrToken" TEXT;

UPDATE "tables"
SET "qrToken" = CONCAT('tbl_', "id")
WHERE "qrToken" IS NULL;

ALTER TABLE "tables"
ALTER COLUMN "qrToken" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "tables_qrToken_key" ON "tables"("qrToken");

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "sentToKitchen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "sentToKitchenAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "sentToCashier" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "sentToCashierAt" TIMESTAMP(3);

ALTER TABLE "order_items"
ADD COLUMN IF NOT EXISTS "sentToKitchen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ServiceRequestType') THEN
    CREATE TYPE "ServiceRequestType" AS ENUM ('CONSULTATION', 'BILL');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ServiceRequestStatus') THEN
    CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "table_service_requests" (
  "id" TEXT NOT NULL,
  "type" "ServiceRequestType" NOT NULL,
  "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acknowledgedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "branchId" TEXT NOT NULL,
  "tableId" TEXT NOT NULL,
  "orderId" TEXT,
  "resolvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "table_service_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "table_service_requests_branchId_status_idx"
  ON "table_service_requests"("branchId", "status");
CREATE INDEX IF NOT EXISTS "table_service_requests_tableId_status_idx"
  ON "table_service_requests"("tableId", "status");
CREATE INDEX IF NOT EXISTS "table_service_requests_requestedAt_idx"
  ON "table_service_requests"("requestedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'table_service_requests_branchId_fkey'
  ) THEN
    ALTER TABLE "table_service_requests"
      ADD CONSTRAINT "table_service_requests_branchId_fkey"
      FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'table_service_requests_tableId_fkey'
  ) THEN
    ALTER TABLE "table_service_requests"
      ADD CONSTRAINT "table_service_requests_tableId_fkey"
      FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'table_service_requests_orderId_fkey'
  ) THEN
    ALTER TABLE "table_service_requests"
      ADD CONSTRAINT "table_service_requests_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'table_service_requests_resolvedById_fkey'
  ) THEN
    ALTER TABLE "table_service_requests"
      ADD CONSTRAINT "table_service_requests_resolvedById_fkey"
      FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
