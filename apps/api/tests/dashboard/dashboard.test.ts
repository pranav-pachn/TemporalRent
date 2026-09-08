import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { DashboardService } from '../../src/modules/dashboard/dashboard.service';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addDays } from 'date-fns';
import { BookingsService } from '../../src/modules/bookings/bookings.service';

describe('DashboardService - Timezone Boundaries', () => {
  let businessId: string;
  let customerId: string;
  const service = new DashboardService();

  beforeAll(async () => {
    // Setup a business in Asia/Kolkata
    const business = await prisma.business.create({
      data: {
        name: 'Test Business TZ',
        slug: 'test-business-tz-' + Date.now(),
        timezone: 'Asia/Kolkata',
      },
    });
    businessId = business.id;

    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        businessId: business.id,
      },
    });
    customerId = customer.id;

    const user = await prisma.user.create({
      data: {
        businessId: business.id,
        email: 'test@tz.com',
        passwordHash: 'hash',
        role: 'OWNER'
      }
    });
    // @ts-ignore - attaching for use in test
    global.testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.business.delete({ where: { id: businessId } });
  });

  it('should include booking exactly on local boundary (midnight) and crossing midnight appropriately', async () => {
    // Today's boundaries for the test using the exact same logic as service
    const tz = 'Asia/Kolkata';
    const nowUtc = new Date();
    const nowLocal = toZonedTime(nowUtc, tz);
    
    // We mock the "now" date to a fixed point to be safe or just use dynamic relative boundaries
    // The service uses `new Date()` internally. We create bookings relative to `new Date()` 
    // mapped through the same timezone logic.
    
    // Let's create an event that starts yesterday 23:00 IST and ends today 02:00 IST
    // It should overlap "today" and be included.
    const startOfTodayLocal = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());
    
    // Booking 1: yesterday 23:00 to today 02:00 (overlaps today)
    const b1StartLocal = new Date(startOfTodayLocal.getTime() - 1 * 60 * 60 * 1000); // 23:00 yesterday
    const b1EndLocal = new Date(startOfTodayLocal.getTime() + 2 * 60 * 60 * 1000); // 02:00 today

    // Booking 2: today 00:00 to today 23:59 (entirely within today)
    const b2StartLocal = new Date(startOfTodayLocal.getTime());
    const b2EndLocal = new Date(startOfTodayLocal.getTime() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000);

    // Booking 3: tomorrow 00:00 to tomorrow 10:00 (entirely tomorrow, should NOT be in today's events)
    const b3StartLocal = addDays(startOfTodayLocal, 1);
    const b3EndLocal = addDays(startOfTodayLocal, 1.4);

    const b1StartUtc = fromZonedTime(b1StartLocal, tz);
    const b1EndUtc = fromZonedTime(b1EndLocal, tz);
    
    const b2StartUtc = fromZonedTime(b2StartLocal, tz);
    const b2EndUtc = fromZonedTime(b2EndLocal, tz);

    const b3StartUtc = fromZonedTime(b3StartLocal, tz);
    const b3EndUtc = fromZonedTime(b3EndLocal, tz);

    const bookingsService = new BookingsService();

    // Create the bookings using BookingsService to properly handle the period tstzrange
    const b1 = await bookingsService.createDraftBooking(businessId, global.testUserId as string, {
      customerId, eventName: 'B1',
      eventStart: b1StartUtc, eventEnd: b1EndUtc,
      lines: []
    });
    await bookingsService.transitionBooking(businessId, b1.id, global.testUserId as string, 'QUOTED');
    await bookingsService.transitionBooking(businessId, b1.id, global.testUserId as string, 'CONFIRMED');

    const b2 = await bookingsService.createDraftBooking(businessId, global.testUserId as string, {
      customerId, eventName: 'B2',
      eventStart: b2StartUtc, eventEnd: b2EndUtc,
      lines: []
    });
    await bookingsService.transitionBooking(businessId, b2.id, global.testUserId as string, 'QUOTED');
    await bookingsService.transitionBooking(businessId, b2.id, global.testUserId as string, 'CONFIRMED');

    const b3 = await bookingsService.createDraftBooking(businessId, global.testUserId as string, {
      customerId, eventName: 'B3',
      eventStart: b3StartUtc, eventEnd: b3EndUtc,
      lines: []
    });
    await bookingsService.transitionBooking(businessId, b3.id, global.testUserId as string, 'QUOTED');
    await bookingsService.transitionBooking(businessId, b3.id, global.testUserId as string, 'CONFIRMED');

    const dashboard = await service.getDashboard(businessId);
    
    // B1 overlaps today, B2 is in today, B3 is tomorrow
    // So today.events should be exactly 2
    expect(dashboard.today.events).toBe(2);
    
    // Upcoming bookings includes B2 (starts today) and B3 (starts tomorrow).
    // B1 is excluded from upcoming because it started yesterday, even though it's active today.
    expect(dashboard.upcomingBookings.length).toBe(2);
  });
});
