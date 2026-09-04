import { prisma } from '../src/lib/prisma';

async function applyInvariants() {
  console.log('Applying database invariants and custom indexes...');

  const statements = [
    `CREATE EXTENSION IF NOT EXISTS btree_gist;`,
    `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_inventory_qty_non_negative'
      ) THEN
        ALTER TABLE "inventory_items" 
        ADD CONSTRAINT "check_inventory_qty_non_negative" 
        CHECK ("totalQty" >= 0 AND "damagedQty" >= 0 AND "missingQty" >= 0 AND "maintenanceQty" >= 0);
      END IF;
    END $$;
    `,
    `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_inventory_state_capacity'
      ) THEN
        ALTER TABLE "inventory_items" 
        ADD CONSTRAINT "check_inventory_state_capacity" 
        CHECK (("damagedQty" + "missingQty" + "maintenanceQty") <= "totalQty");
      END IF;
    END $$;
    `,
    `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_pkg_comp_qty_positive'
      ) THEN
        ALTER TABLE "package_components" 
        ADD CONSTRAINT "check_pkg_comp_qty_positive" 
        CHECK ("quantity" > 0);
      END IF;
    END $$;
    `,
    `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_booking_line_qty_positive'
      ) THEN
        ALTER TABLE "booking_lines" 
        ADD CONSTRAINT "check_booking_line_qty_positive" 
        CHECK ("quantity" > 0);
      END IF;
    END $$;
    `,
    `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_demand_qty_positive'
      ) THEN
        ALTER TABLE "booking_item_demands" 
        ADD CONSTRAINT "check_demand_qty_positive" 
        CHECK ("quantityDemanded" > 0);
      END IF;
    END $$;
    `,
    `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'quantity_fulfilled_valid'
      ) THEN
        ALTER TABLE "booking_item_demands" 
        ADD CONSTRAINT "quantity_fulfilled_valid" 
        CHECK ("quantityFulfilled" >= 0 AND "quantityFulfilled" <= "quantityDemanded");
      END IF;
    END $$;
    `,
    `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_reservation_qty_positive'
      ) THEN
        ALTER TABLE "inventory_reservations" 
        ADD CONSTRAINT "check_reservation_qty_positive" 
        CHECK ("quantity" > 0);
      END IF;
    END $$;
    `,
    `CREATE INDEX IF NOT EXISTS "idx_inventory_reservation_overlap" ON "inventory_reservations" USING GIST ("businessId", "inventoryItemId", "period");`,
    `CREATE INDEX IF NOT EXISTS "idx_booking_period" ON "bookings" USING GIST ("period");`
  ];

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (error) {
      console.error('Error executing statement:', statement, error);
      throw error;
    }
  }

  console.log('All PostgreSQL CHECK constraints and GiST indexes applied successfully.');
}

applyInvariants()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
