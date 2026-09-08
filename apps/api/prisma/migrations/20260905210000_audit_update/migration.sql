-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('BUSINESS', 'USER', 'CUSTOMER', 'INVENTORY_ITEM', 'PACKAGE', 'PACKAGE_VERSION', 'BOOKING', 'BOOKING_LINE', 'BOOKING_ITEM_DEMAND', 'INVENTORY_RESERVATION', 'DISPATCH', 'DISPATCH_LINE', 'RETURN', 'RETURN_LINE', 'DAMAGE_REPORT');

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'CONFIRM', 'CANCEL', 'RESCHEDULE', 'START_PICKING', 'DISPATCH', 'RETURN', 'DAMAGE', 'OVERRIDE');
ALTER TABLE "audit_events" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- AlterEnum
ALTER TYPE "DispatchStatus" ADD VALUE 'PICKING';

-- AlterTable (Add columns first)
ALTER TABLE "audit_events" ADD COLUMN "bookingId" TEXT,
ADD COLUMN "entityId" TEXT,
ADD COLUMN "entityType" "AuditEntityType",
ADD COLUMN "metadata" JSONB,
ADD COLUMN "reason" TEXT;

-- Data Migration
UPDATE "audit_events"
SET "entityId" = "recordId",
    "entityType" = CASE
      WHEN "tableName" = 'businesses' THEN 'BUSINESS'::"AuditEntityType"
      WHEN "tableName" = 'users' THEN 'USER'::"AuditEntityType"
      WHEN "tableName" = 'customers' THEN 'CUSTOMER'::"AuditEntityType"
      WHEN "tableName" = 'inventory_items' THEN 'INVENTORY_ITEM'::"AuditEntityType"
      WHEN "tableName" = 'packages' THEN 'PACKAGE'::"AuditEntityType"
      WHEN "tableName" = 'package_versions' THEN 'PACKAGE_VERSION'::"AuditEntityType"
      WHEN "tableName" = 'bookings' THEN 'BOOKING'::"AuditEntityType"
      WHEN "tableName" = 'booking_lines' THEN 'BOOKING_LINE'::"AuditEntityType"
      WHEN "tableName" = 'booking_item_demands' THEN 'BOOKING_ITEM_DEMAND'::"AuditEntityType"
      WHEN "tableName" = 'inventory_reservations' THEN 'INVENTORY_RESERVATION'::"AuditEntityType"
      WHEN "tableName" = 'dispatches' THEN 'DISPATCH'::"AuditEntityType"
      WHEN "tableName" = 'dispatch_lines' THEN 'DISPATCH_LINE'::"AuditEntityType"
      WHEN "tableName" = 'returns' THEN 'RETURN'::"AuditEntityType"
      WHEN "tableName" = 'return_lines' THEN 'RETURN_LINE'::"AuditEntityType"
      WHEN "tableName" = 'damage_reports' THEN 'DAMAGE_REPORT'::"AuditEntityType"
      ELSE 'BOOKING'::"AuditEntityType"
    END;

-- Now make them required and drop legacy columns
ALTER TABLE "audit_events" ALTER COLUMN "entityId" SET NOT NULL,
ALTER COLUMN "entityType" SET NOT NULL;

ALTER TABLE "audit_events" DROP COLUMN "recordId",
DROP COLUMN "tableName";

-- CreateIndex
CREATE INDEX "audit_events_businessId_createdAt_idx" ON "audit_events"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_businessId_bookingId_createdAt_idx" ON "audit_events"("businessId", "bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_businessId_entityType_entityId_idx" ON "audit_events"("businessId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_events_businessId_action_createdAt_idx" ON "audit_events"("businessId", "action", "createdAt");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

