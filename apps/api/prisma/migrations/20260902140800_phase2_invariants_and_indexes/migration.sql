-- Update UserRole Enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STAFF' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
      ALTER TYPE "UserRole" RENAME VALUE 'STAFF' TO 'SALES';
    END IF;
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'WAREHOUSE';
  END IF;
END $$;

-- Check constraint: quantity fulfilled between 0 and demanded
ALTER TABLE "booking_item_demands" 
ADD CONSTRAINT "quantity_fulfilled_valid" 
CHECK ("quantityFulfilled" >= 0 AND "quantityFulfilled" <= "quantityDemanded");

-- B-tree indexes
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_items_businessId_sku_key" ON "inventory_items"("businessId", "sku");
CREATE INDEX IF NOT EXISTS "inventory_items_businessId_idx" ON "inventory_items"("businessId");
CREATE INDEX IF NOT EXISTS "inventory_items_businessId_categoryId_idx" ON "inventory_items"("businessId", "categoryId");
CREATE INDEX IF NOT EXISTS "inventory_items_businessId_id_idx" ON "inventory_items"("businessId", "id");

CREATE INDEX IF NOT EXISTS "bookings_businessId_status_idx" ON "bookings"("businessId", "status");
CREATE INDEX IF NOT EXISTS "bookings_businessId_idx" ON "bookings"("businessId");

CREATE INDEX IF NOT EXISTS "inventory_reservations_bookingId_idx" ON "inventory_reservations"("bookingId");
CREATE INDEX IF NOT EXISTS "inventory_reservations_businessId_inventoryItemId_idx" ON "inventory_reservations"("businessId", "inventoryItemId");
