-- CreateEnum
CREATE TYPE "BookingLineType" AS ENUM ('PACKAGE', 'INVENTORY_ITEM');

-- DropForeignKey
ALTER TABLE "booking_lines" DROP CONSTRAINT "booking_lines_businessId_fkey";

-- AlterTable
ALTER TABLE "booking_lines" DROP COLUMN "businessId",
ADD COLUMN     "inventoryItemId" TEXT,
ADD COLUMN     "type" "BookingLineType" NOT NULL,
ALTER COLUMN "packageVersionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "createdByUserId" TEXT NOT NULL,
ADD COLUMN     "eventEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "eventName" TEXT NOT NULL,
ADD COLUMN     "eventStart" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "location" TEXT;

-- CreateIndex
CREATE INDEX "bookings_businessId_createdAt_idx" ON "bookings"("businessId", "createdAt");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_lines" ADD CONSTRAINT "booking_lines_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add polymorphic check constraint for BookingLine
ALTER TABLE "booking_lines" ADD CONSTRAINT "chk_booking_line_polymorphic_reference"
CHECK (
  ("type" = 'PACKAGE' AND "packageVersionId" IS NOT NULL AND "inventoryItemId" IS NULL)
  OR
  ("type" = 'INVENTORY_ITEM' AND "inventoryItemId" IS NOT NULL AND "packageVersionId" IS NULL)
);

-- Add quantity positive check constraint for BookingLine
ALTER TABLE "booking_lines" ADD CONSTRAINT "chk_booking_line_quantity_positive"
CHECK ("quantity" > 0);

-- Add eventStart < eventEnd check constraint for Booking
ALTER TABLE "bookings" ADD CONSTRAINT "chk_booking_event_start_end"
CHECK ("eventStart" < "eventEnd");
