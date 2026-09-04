import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const rows = await prisma.$queryRawUnsafe(`
EXPLAIN ANALYZE
WITH candidates AS (
  SELECT *
  FROM (
    VALUES ('some-uuid-1', tstzrange('2026-10-01'::timestamptz, '2026-10-02'::timestamptz, '[)'))
  ) AS c(inventory_item_id, candidate_period)
)
SELECT
  r."inventoryItemId",
  COALESCE(SUM(r."quantity"), 0)::INT AS "reservedQuantity"
FROM "inventory_reservations" r
JOIN candidates c
  ON c.inventory_item_id = r."inventoryItemId"
 AND r."period" && c.candidate_period
WHERE
  r."businessId" = 'some-uuid-2'
  AND r."status" = 'ACTIVE'
GROUP BY r."inventoryItemId";
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
