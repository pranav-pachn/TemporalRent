import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export interface CandidateItemWindow {
  inventoryItemId: string;
  effectiveStart: Date;
  effectiveEnd: Date;
}

export interface ReservedQuantityResult {
  inventoryItemId: string;
  reservedQuantity: number;
}

export interface ReservationDetailRecord {
  id: string;
  inventoryItemId: string;
  inventoryItemName?: string;
  bookingId: string;
  quantity: number;
  effectiveStart: Date;
  effectiveEnd: Date;
  eventName?: string;
}

export class AvailabilityRepository {
  /**
   * Batch queries the database for overlapping ACTIVE reservations for a list of candidate windows.
   */
  async findOverlappingReservations(
    businessId: string,
    candidates: CandidateItemWindow[]
  ): Promise<ReservedQuantityResult[]> {
    if (candidates.length === 0) {
      return [];
    }

    // 1. Safely construct the parameterized tuples for the VALUES clause
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

    // 2. Execute the batch query via CTE and return the aggregated reserved quantity
    const rows = await prisma.$queryRaw<ReservedQuantityResult[]>(Prisma.sql`
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
      GROUP BY r."inventoryItemId";
    `);

    return rows;
  }

  /**
   * Fetches detailed overlapping reservations, but only for the given candidates (shortage items).
   */
  async findOverlappingReservationDetails(
    businessId: string,
    candidates: CandidateItemWindow[],
    excludeBookingId?: string
  ): Promise<ReservationDetailRecord[]> {
    if (candidates.length === 0) {
      return [];
    }

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

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      WITH candidates AS (
        SELECT *
        FROM (
          VALUES ${candidateValues}
        ) AS c(inventory_item_id, candidate_period)
      )
      SELECT
        r."id",
        r."inventoryItemId",
        i."name" AS "inventoryItemName",
        r."bookingId",
        r."quantity",
        lower(r."period") AS "effectiveStart",
        upper(r."period") AS "effectiveEnd",
        b."eventName"
      FROM "inventory_reservations" r
      JOIN candidates c
        ON c.inventory_item_id = r."inventoryItemId"
       AND r."period" && c.candidate_period
      JOIN "bookings" b
        ON b."id" = r."bookingId"
      JOIN "inventory_items" i
        ON i."id" = r."inventoryItemId"
      WHERE
        r."businessId" = ${businessId}
        AND r."status" = 'ACTIVE'
        ${excludeBookingId ? Prisma.sql`AND r."bookingId" != ${excludeBookingId}::text` : Prisma.empty}
      ORDER BY r."inventoryItemId", lower(r."period");
    `);

    return rows.map((row) => ({
      id: row.id,
      inventoryItemId: row.inventoryItemId,
      inventoryItemName: row.inventoryItemName,
      bookingId: row.bookingId,
      quantity: row.quantity,
      effectiveStart: new Date(row.effectiveStart),
      effectiveEnd: new Date(row.effectiveEnd),
      eventName: row.eventName,
    }));
  }
}
