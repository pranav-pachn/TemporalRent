import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';

describe('Phase 10: Conflict Explanation Layer', () => {
  let businessId: string;
  let token: string;
  let itemSofaId: string;
  let itemUrliId: string;

  beforeAll(async () => {
    // 1. Setup Business with default buffers (1 hour before, 1 hour after)
    const biz = await prisma.business.create({
      data: { 
        name: 'Phase 10 Biz', 
        slug: `phase10-biz-${Date.now()}`, 
        plan: 'FREE',
        defaultBufferBeforeMinutes: 60,
        defaultBufferAfterMinutes: 60
      },
    });
    businessId = biz.id;

    // 2. Setup User & Token
    const user = await prisma.user.create({
      data: { businessId, email: 'phase10@test.com', passwordHash: 'hash', role: 'OWNER' },
    });
    token = await signAccessToken({ userId: user.id, businessId, role: 'OWNER' });

    // 4. Setup Inventory Items
    const itemSofa = await prisma.inventoryItem.create({
      data: { businessId, name: 'Sofa', totalQty: 10 },
    });
    itemSofaId = itemSofa.id;

    const itemUrli = await prisma.inventoryItem.create({
      data: { businessId, name: 'Urli', totalQty: 20 },
    });
    itemUrliId = itemUrli.id;

    const customer = await prisma.customer.create({ data: { businessId, name: 'Cust A' } });
    const bookingId = crypto.randomUUID();
    
    // Insert Booking and Reservations via raw SQL because Prisma doesn't support tstzrange mutations
    await prisma.$executeRaw`
      INSERT INTO "bookings" ("id", "businessId", "customerId", "eventName", "eventStart", "eventEnd", "createdByUserId", "status", "period", "createdAt", "updatedAt")
      VALUES (${bookingId}, ${businessId}, ${customer.id}, 'Test Event', '2026-10-01 11:00:00+00', '2026-10-01 11:30:00+00', ${user.id}, 'ACTIVE', tstzrange('2026-10-01 10:00:00+00', '2026-10-01 12:00:00+00', '[)'), NOW(), NOW())
    `;

    await prisma.$executeRaw`
      INSERT INTO "inventory_reservations" ("id", "businessId", "inventoryItemId", "bookingId", "quantity", "period", "status", "createdAt", "updatedAt")
      VALUES 
      (gen_random_uuid()::text, ${businessId}, ${itemSofaId}, ${bookingId}, 5, tstzrange('2026-10-01 10:00:00+00', '2026-10-01 12:00:00+00', '[)'), 'ACTIVE', NOW(), NOW()),
      (gen_random_uuid()::text, ${businessId}, ${itemUrliId}, ${bookingId}, 15, tstzrange('2026-10-01 10:00:00+00', '2026-10-01 12:00:00+00', '[)'), 'ACTIVE', NOW(), NOW())
    `;
  });

  it('filters zero-shortage conflicts correctly (usable 20, req 5, over 15 -> available true, shortage 0, conflicts empty)', async () => {
    // Request from 11:30 to 12:30. 
    // Buffer expands to [10:30, 13:30) which overlaps with [10:00, 12:00)
    // Urli: usable 20, req 5. Overlaps with 15. 20 - 15 = 5 available. 5 required -> 0 shortage.
    const res = await request(app)
      .post('/api/availability/check')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          { inventoryItemId: itemUrliId, quantity: 5 }
        ],
        eventStart: '2026-10-01T11:30:00Z',
        eventEnd: '2026-10-01T12:30:00Z'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(true);
    
    const urli = res.body.data.items.find((i: any) => i.inventoryItemId === itemUrliId);
    expect(urli.shortage).toBe(0);
    expect(urli.reserved).toBe(15);
    expect(res.body.data.conflicts.length).toBe(0); // Zero-shortage filtering
  });

  it('isolates shortages (Sofa has shortage, Urli does not -> only Sofa conflict returned)', async () => {
    // Request from 11:30 to 12:30.
    // Sofa: usable 10, req 8. Overlaps with 5. 10 - 5 = 5 available. 8 required -> 3 shortage.
    // Urli: usable 20, req 5. Overlaps with 15. 20 - 15 = 5 available. 5 required -> 0 shortage.
    const res = await request(app)
      .post('/api/availability/check')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          { inventoryItemId: itemSofaId, quantity: 8 },
          { inventoryItemId: itemUrliId, quantity: 5 }
        ],
        eventStart: '2026-10-01T11:30:00Z',
        eventEnd: '2026-10-01T12:30:00Z'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(false);

    const conflicts = res.body.data.conflicts;
    expect(conflicts.length).toBeGreaterThan(0);
    
    const sofaConflicts = conflicts.filter((c: any) => c.inventoryItemId === itemSofaId);
    const urliConflicts = conflicts.filter((c: any) => c.inventoryItemId === itemUrliId);

    expect(sofaConflicts.length).toBe(1);
    expect(sofaConflicts[0].inventoryItemName).toBe('Sofa');
    expect(sofaConflicts[0].quantity).toBe(5);

    expect(urliConflicts.length).toBe(0);
  });

  it('guarantees zero database mutations during availability checks', async () => {
    const reservationsBefore = await prisma.inventoryReservation.count();
    const bookingsBefore = await prisma.booking.count();

    const res = await request(app)
      .post('/api/availability/check')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          { inventoryItemId: itemSofaId, quantity: 1 }
        ],
        eventStart: '2026-10-01T12:00:00Z',
        eventEnd: '2026-10-01T14:00:00Z'
      });

    expect(res.status).toBe(200);

    const reservationsAfter = await prisma.inventoryReservation.count();
    const bookingsAfter = await prisma.booking.count();

    expect(reservationsAfter).toBe(reservationsBefore);
    expect(bookingsAfter).toBe(bookingsBefore);
  });
});
