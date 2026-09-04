import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { CandidateItemWindow, ReservedQuantityResult } from '../availability/availability.repository';

export class ReservationsRepository {
  /**
   * Locks the specified inventory items for update, ordered by ID to prevent deadlocks.
   */
  async lockInventoryItems(
    tx: Prisma.TransactionClient,
    businessId: string,
    itemIds: string[]
  ): Promise<any[]> {
    if (itemIds.length === 0) return [];
    const sortedItemIds = [...new Set(itemIds)].sort();

    return tx.$queryRaw<any[]>`
      SELECT "id", "totalQty", "damagedQty", "missingQty", "maintenanceQty"
      FROM "inventory_items"
      WHERE "businessId" = ${businessId} AND "id" = ANY(${sortedItemIds})
      ORDER BY "id" ASC
      FOR UPDATE
    `;
  }

  /**
   * Batch queries the database for overlapping ACTIVE reservations for candidate windows within a transaction.
   */
  async findOverlappingReservationsTx(
    tx: Prisma.TransactionClient,
    businessId: string,
    candidates: CandidateItemWindow[],
    excludeBookingId?: string
  ): Promise<ReservedQuantityResult[]> {
    if (candidates.length === 0) return [];

    const tuples = candidates.map((candidate) =>
      Prisma.sql`(
        ${candidate.inventoryItemId}::text,
        tstzrange(
          ${candidate.effectiveStart.toISOString()}::timestamptz,
          ${candidate.effectiveEnd.toISOString()}::timestamptz,
          '[)'
        )
      )`
    );

    const candidateValues = Prisma.join(tuples, ', ');

    const rows = await tx.$queryRaw<ReservedQuantityResult[]>`
      WITH candidates AS (
        SELECT *
        FROM (
          VALUES ${candidateValues}
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
        r."businessId" = ${businessId}
        AND r."status" = 'ACTIVE'
        ${excludeBookingId ? Prisma.sql`AND r."bookingId" != ${excludeBookingId}::text` : Prisma.empty}
      GROUP BY r."inventoryItemId";
    `;

    return rows;
  }
}
