import { prisma } from '../../lib/prisma';
import { ApiError } from '../../lib/errors';
import { Prisma } from '@prisma/client';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addDays, startOfDay, isBefore, isAfter, max, min, addMonths, differenceInDays } from 'date-fns';

export interface CalendarEvent {
  bookingId: string;
  eventName: string;
  customerName: string;
  status: string;
  eventStart: string;
  eventEnd: string;
  periodStart: string;
  periodEnd: string;
}

export interface PressureSegment {
  start: string;
  end: string;
  reservedQty: number;
  usableQty: number;
  pressure: 'NORMAL' | 'FULL' | 'SHORTAGE';
}

export interface CalendarInventoryItem {
  inventoryItemId: string;
  name: string;
  usableQty: number;
  reservations: any[];
  pressureSegments: PressureSegment[];
}

export interface CalendarInventoryResponse {
  from: string;
  to: string;
  items: CalendarInventoryItem[];
}

export class CalendarService {
  /**
   * Helper to resolve the business timezone and parse the from/to boundary strings.
   * from/to are expected to be YYYY-MM-DD.
   */
  private async resolveWindow(businessId: string, fromDateStr: string, toDateStr: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { timezone: true },
    });

    if (!business) {
      throw new ApiError(404, 'BUSINESS_NOT_FOUND', 'Business not found');
    }

    const tz = business.timezone || 'UTC';

    // Parse 'YYYY-MM-DD' as local to the business timezone, then convert to UTC Date
    const parseLocal = (dateStr: string) => {
      // Create a date in local time for the given string
      const [year, month, day] = dateStr.split('-').map(Number);
      // We create a Date object in the business timezone's perspective
      // toZonedTime parses a date as if it is in that timezone.
      // Wait, date-fns-tz fromZonedTime takes a Date/string and a timezone, and returns UTC.
      // Easiest way to parse "2026-11-12 00:00:00" in tz to UTC:
      const localString = `${dateStr}T00:00:00`;
      return fromZonedTime(localString, tz);
    };

    const fromDate = parseLocal(fromDateStr);
    const toDate = parseLocal(toDateStr);

    if (fromDate >= toDate) {
      throw new ApiError(400, 'INVALID_DATE_RANGE', 'from must be before to');
    }

    const days = differenceInDays(toDate, fromDate);
    if (days > 40) {
      throw new ApiError(400, 'WINDOW_TOO_LARGE', 'Calendar window cannot exceed 40 days');
    }

    return { fromDate, toDate, tz };
  }

  async getEvents(businessId: string, fromDateStr: string, toDateStr: string): Promise<CalendarEvent[]> {
    const { fromDate, toDate } = await this.resolveWindow(businessId, fromDateStr, toDateStr);

    // Query bookings that overlap with [from, to)
    const bookings = await prisma.$queryRaw<any[]>`
      SELECT 
        b."id", 
        b."eventName", 
        c."name" as "customerName", 
        b."status", 
        b."eventStart", 
        b."eventEnd",
        lower(b."period") as "periodStart",
        upper(b."period") as "periodEnd"
      FROM "bookings" b
      JOIN "customers" c ON c."id" = b."customerId"
      WHERE b."businessId" = ${businessId}
        AND b."deletedAt" IS NULL
        AND b."period" && tstzrange(${fromDate.toISOString()}::timestamptz, ${toDate.toISOString()}::timestamptz, '[)')
      ORDER BY b."eventStart" ASC
    `;

    return bookings.map(b => ({
      bookingId: b.id,
      eventName: b.eventName,
      customerName: b.customerName,
      status: b.status,
      eventStart: b.eventStart.toISOString(),
      eventEnd: b.eventEnd.toISOString(),
      periodStart: b.periodStart.toISOString(),
      periodEnd: b.periodEnd.toISOString(),
    }));
  }

  async getInventoryTimeline(businessId: string, fromDateStr: string, toDateStr: string, inventoryItemId?: string): Promise<CalendarInventoryResponse> {
    const { fromDate, toDate, tz } = await this.resolveWindow(businessId, fromDateStr, toDateStr);

    // 1. Fetch Items
    const itemsQuery: any = { businessId };
    if (inventoryItemId) {
      itemsQuery.id = inventoryItemId;
    }

    const items = await prisma.inventoryItem.findMany({
      where: itemsQuery,
      select: { id: true, name: true, totalQty: true, damagedQty: true, missingQty: true, maintenanceQty: true },
      orderBy: { name: 'asc' }
    });

    if (items.length === 0) {
      return { from: fromDate.toISOString(), to: toDate.toISOString(), items: [] };
    }

    // 2. Fetch Overlapping Reservations
    const itemIds = items.map(i => i.id);
    const reservationsRaw = await prisma.$queryRaw<any[]>`
      SELECT 
        "id", "inventoryItemId", "bookingId", "quantity",
        lower("period") as "periodStart",
        upper("period") as "periodEnd"
      FROM "inventory_reservations"
      WHERE "businessId" = ${businessId}
        AND "status" = 'ACTIVE'
        AND "inventoryItemId" IN (${Prisma.join(itemIds)})
        AND "period" && tstzrange(${fromDate.toISOString()}::timestamptz, ${toDate.toISOString()}::timestamptz, '[)')
    `;

    // 3. Build response per item
    const days = differenceInDays(toDate, fromDate);
    
    // Pre-calculate the daily bucket boundaries in UTC for the given timezone
    const dayBuckets: { start: Date, end: Date }[] = [];
    for (let i = 0; i < days; i++) {
      // Calculate local day string, convert back to UTC bounds
      // We start at fromDate (which is local 00:00 in UTC).
      // Since fromDate is 00:00 in business timezone, adding 24 hours (or better, adding days in UTC)
      // wait, daylight savings time means adding 24h is unsafe.
      // Safer: construct string in local timezone, then convert.
      
      const localZoned = toZonedTime(fromDate, tz); // This should be 00:00 local
      const currentLocal = addDays(localZoned, i);
      const nextLocal = addDays(localZoned, i + 1);
      
      // We extract YYYY-MM-DD from currentLocal, but we can just use it directly since it preserves time
      const bucketStart = fromZonedTime(currentLocal, tz);
      const bucketEnd = fromZonedTime(nextLocal, tz);
      
      dayBuckets.push({ start: bucketStart, end: bucketEnd });
    }

    const inventoryResponseItems: CalendarInventoryItem[] = items.map(item => {
      const usableQty = item.totalQty - (item.damagedQty + item.missingQty + item.maintenanceQty);
      
      const itemReservations = reservationsRaw
        .filter(r => r.inventoryItemId === item.id)
        .map(r => ({
          id: r.id,
          bookingId: r.bookingId,
          start: r.periodStart,
          end: r.periodEnd,
          quantity: r.quantity
        }));

      // Calculate Daily Pressure Segments
      const pressureSegments: PressureSegment[] = dayBuckets.map(bucket => {
        // Find all reservations intersecting this bucket
        const overlapping = itemReservations.filter(r => 
          r.start < bucket.end && r.end > bucket.start
        );

        // Calculate max concurrent quantity in this bucket using sweep-line
        let maxConcurrent = 0;
        
        if (overlapping.length > 0) {
          const events: { time: number, delta: number }[] = [];
          for (const res of overlapping) {
            // Clip to bucket boundaries so sweep line stays inside the bucket
            const tStart = Math.max(res.start.getTime(), bucket.start.getTime());
            const tEnd = Math.min(res.end.getTime(), bucket.end.getTime());
            
            if (tStart < tEnd) {
              events.push({ time: tStart, delta: res.quantity });
              events.push({ time: tEnd, delta: -res.quantity });
            }
          }
          
          events.sort((a, b) => a.time - b.time || a.delta - b.delta);
          
          let currentQty = 0;
          for (const ev of events) {
            currentQty += ev.delta;
            if (currentQty > maxConcurrent) {
              maxConcurrent = currentQty;
            }
          }
        }

        let pressure: 'NORMAL' | 'FULL' | 'SHORTAGE' = 'NORMAL';
        if (maxConcurrent > usableQty) pressure = 'SHORTAGE';
        else if (maxConcurrent === usableQty && usableQty > 0) pressure = 'FULL';

        return {
          start: bucket.start.toISOString(),
          end: bucket.end.toISOString(),
          reservedQty: maxConcurrent,
          usableQty,
          pressure
        };
      });

      return {
        inventoryItemId: item.id,
        name: item.name,
        usableQty,
        reservations: itemReservations.map(r => ({
          bookingId: r.bookingId,
          start: r.start.toISOString(),
          end: r.end.toISOString(),
          quantity: r.quantity
        })),
        pressureSegments
      };
    });

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      items: inventoryResponseItems
    };
  }
}
