-- Add restaurant table sector metadata
ALTER TABLE "tables"
ADD COLUMN "sector" TEXT;

-- Reservation status enum
CREATE TYPE "ReservationStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'SEATED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
);

-- Reservations table
CREATE TABLE "reservations" (
  "id" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT,
  "partySize" INTEGER NOT NULL,
  "reservationAt" TIMESTAMP(3) NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
  "notes" TEXT,
  "tableId" TEXT,
  "branchId" TEXT NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reservations_branchId_idx" ON "reservations"("branchId");
CREATE INDEX "reservations_reservationAt_idx" ON "reservations"("reservationAt");
CREATE INDEX "reservations_status_idx" ON "reservations"("status");
CREATE INDEX "reservations_tableId_idx" ON "reservations"("tableId");

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_tableId_fkey"
FOREIGN KEY ("tableId") REFERENCES "tables"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "branches"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
