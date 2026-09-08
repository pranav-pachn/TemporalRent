import { PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, addDays } from 'date-fns';

export class DashboardService {
  /**
   * Retrieves the dashboard projection for a given business.
   */
  async getDashboard(businessId: string) {
    // 1. Resolve business and its timezone
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { timezone: true },
    });

    if (!business) {
      throw new Error('Business not found');
    }

    const tz = business.timezone || 'UTC';
    
    // Calculate today's bounds in UTC using the business timezone
    // e.g. If it's 2026-09-06T18:45:00Z and tz is Asia/Kolkata (+05:30), 
    // the local time is 2026-09-07T00:15:00. The local 'start of day' is 2026-09-07T00:00:00.
    const nowUtc = new Date();
    const nowLocal = toZonedTime(nowUtc, tz);
    const todayStartLocal = startOfDay(nowLocal);
    const tomorrowStartLocal = addDays(todayStartLocal, 1);
    
    const todayStart = fromZonedTime(todayStartLocal, tz);
    const tomorrowStart = fromZonedTime(tomorrowStartLocal, tz);

    // 2. Today's Events (overalapping today's operational horizon)
    const todayEventsCount = await prisma.booking.count({
      where: {
        businessId,
        status: {
          in: ['CONFIRMED', 'DISPATCHED', 'RETURNED', 'COMPLETED']
        },
        // Period overlaps [todayStart, tomorrowStart)
        // Which in Postgres tstzrange means: period && tstzrange(todayStart, tomorrowStart)
        // We can do this natively with Prisma using raw queries, or approximation with eventStart/End
        // Since `period` is a custom type unsupported directly by Prisma's standard API, 
        // we use eventStart and eventEnd for the approximation or a raw query.
        eventStart: { lt: tomorrowStart },
        eventEnd: { gte: todayStart },
      },
    });

    // 3. Dispatches scheduled for today
    // Let's assume dispatches are tracked by related bookings eventStart or a specific dispatch schedule
    // Using dispatch record createdAt or booking's eventStart for approximation if dispatchedAt is null
    const todayDispatchesRaw = await prisma.dispatch.findMany({
      where: {
        businessId,
        booking: {
          eventStart: { lt: tomorrowStart },
          eventEnd: { gte: todayStart },
        }
      },
      include: {
        booking: {
          include: { customer: true }
        },
        lines: true
      }
    });

    const todayDispatches = todayDispatchesRaw.map(d => ({
      id: d.id,
      bookingId: d.bookingId,
      clientName: d.booking.customer.name,
      scheduledTime: d.booking.eventStart.toISOString(),
      itemCount: d.lines.length,
      status: d.status
    }));

    // 4. Returns expected today
    const todayReturnsRaw = await prisma.return.findMany({
      where: {
        businessId,
        booking: {
          eventEnd: { gte: todayStart, lt: tomorrowStart },
        }
      },
      include: {
        booking: {
          include: { customer: true }
        },
        lines: true
      }
    });

    const todayReturns = todayReturnsRaw.map(r => ({
      id: r.id,
      bookingId: r.bookingId,
      clientName: r.booking.customer.name,
      scheduledTime: r.booking.eventEnd.toISOString(),
      itemCount: r.lines.length,
      status: r.status
    }));

    // 5. Inventory Alerts (Committed Qty for today)
    // We need to fetch items, and their active reservations overlapping today
    const items = await prisma.inventoryItem.findMany({
      where: { businessId },
    });

    // To avoid N+1, fetch all active reservations overlapping today for this business
    const activeReservations = await prisma.inventoryReservation.findMany({
      where: {
        businessId,
        status: 'ACTIVE',
        // Period overlaps [todayStart, tomorrowStart)
        // Assuming booking event boundaries map to the reservation
        booking: {
          eventStart: { lt: tomorrowStart },
          eventEnd: { gte: todayStart }
        }
      },
    });

    const committedQtyByItem = activeReservations.reduce((acc, res) => {
      acc[res.inventoryItemId] = (acc[res.inventoryItemId] || 0) + res.quantity;
      return acc;
    }, {} as Record<string, number>);

    const inventoryAlerts = [];
    for (const item of items) {
      const committedQty = committedQtyByItem[item.id] || 0;
      const availableQty = item.totalQty - item.damagedQty - item.missingQty - item.maintenanceQty - committedQty;
      
      let urgency: 'attention' | 'critical' | 'normal' = 'normal';
      const shortage = committedQty - (item.totalQty - item.damagedQty - item.missingQty - item.maintenanceQty);
      
      if (shortage > 0) {
        urgency = 'critical';
      } else if (availableQty === 0) {
        urgency = 'attention';
      }

      if (urgency !== 'normal') {
        inventoryAlerts.push({
          id: item.id,
          name: item.name,
          totalQty: item.totalQty,
          committedQty,
          availableQty,
          urgency
        });
      }
    }

    // 6. Upcoming Bookings
    const next7DaysStart = todayStart;
    const next7DaysEnd = addDays(todayStart, 7);

    const upcomingBookingsRaw = await prisma.booking.findMany({
      where: {
        businessId,
        status: 'CONFIRMED',
        eventStart: {
          gte: next7DaysStart,
          lt: next7DaysEnd
        }
      },
      orderBy: {
        eventStart: 'asc'
      },
      include: {
        customer: true
      }
    });

    const upcomingBookings = upcomingBookingsRaw.map(b => ({
      id: b.id,
      clientName: b.customer.name,
      eventDate: b.eventStart.toISOString(),
      status: b.status
    }));

    return {
      today: {
        events: todayEventsCount,
        dispatches: todayDispatches.length,
        returns: todayReturns.length
      },
      inventoryAlerts,
      todayDispatches,
      todayReturns,
      upcomingBookings
    };
  }
}
