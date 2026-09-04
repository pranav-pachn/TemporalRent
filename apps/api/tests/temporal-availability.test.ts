import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';
import { ReservationStatus } from '@prisma/client';

describe('Phase 7: Temporal Availability Engine', () => {
  let businessId: string;
  let token: string;
  let itemSofaId: string;
  let itemUrliId: string;

  beforeAll(async () => {
    // 1. Setup Business with default buffers (1 hour before, 1 hour after)
    const biz = await prisma.business.create({
      data: { 
        name: 'Avail Biz', 
        slug: `avail-biz-${Date.now()}`, 
        plan: 'FREE',
        defaultBufferBeforeMinutes: 60,
        defaultBufferAfterMinutes: 60
      },
    });
    businessId = biz.id;

    // 2. Setup User & Token
    const user = await prisma.user.create({
      data: { businessId, email: 'avail@test.com', passwordHash: 'hash', role: 'OWNER' },
    });
    token = await signAccessToken({ userId: user.id, businessId, role: 'OWNER' });

    // 3. Setup Categories
    const catDecor = await prisma.category.create({
      data: { businessId, name: 'Decor', bufferBeforeMinutes: 30, bufferAfterMinutes: 30 },
    });

    // 4. Setup Inventory Items
    // Sofa inherits Category Decor buffer (30m/30m)
    const itemSofa = await prisma.inventoryItem.create({
      data: { businessId, categoryId: catDecor.id, name: 'Sofa', totalQty: 10 },
    });
    itemSofaId = itemSofa.id;

    // Urli inherits Business default buffer (60m/60m)
    const itemUrli = await prisma.inventoryItem.create({
      data: { businessId, name: 'Urli', totalQty: 20 },
    });
    itemUrliId = itemUrli.id;

    // 5. Create active reservations
    // Sofa has reservation from 10:00 to 12:00
    const customer = await prisma.customer.create({ data: { businessId, name: 'Cust A' } });
    const bookingId = crypto.randomUUID();
    
    // Insert Booking and Reservations via raw SQL because Prisma doesn't support tstzrange mutations
    await prisma.$executeRaw`
      INSERT INTO "bookings" ("id", "businessId", "customerId", "status", "period", "createdAt", "updatedAt")
      VALUES (${bookingId}, ${businessId}, ${customer.id}, 'ACTIVE', tstzrange('2026-10-01 10:00:00+00', '2026-10-01 12:00:00+00', '[)'), NOW(), NOW())
    `;

    await prisma.$executeRaw`
      INSERT INTO "inventory_reservations" ("id", "businessId", "inventoryItemId", "bookingId", "quantity", "period", "status", "createdAt", "updatedAt")
      VALUES 
      (gen_random_uuid()::text, ${businessId}, ${itemSofaId}, ${bookingId}, 5, tstzrange('2026-10-01 10:00:00+00', '2026-10-01 12:00:00+00', '[)'), 'ACTIVE', NOW(), NOW()),
      (gen_random_uuid()::text, ${businessId}, ${itemUrliId}, ${bookingId}, 15, tstzrange('2026-10-01 10:00:00+00', '2026-10-01 12:00:00+00', '[)'), 'CANCELLED', NOW(), NOW())
    `;
  });

  it('verifies 3-tier buffer resolution independently and calculates correct effective windows', async () => {
    // Request from 12:30 to 14:00
    // Sofa buffer (from category): 30m before, 30m after -> [12:00, 14:30)
    // - Previous reservation ends at 12:00. [10:00, 12:00) && [12:00, 14:30) = false! (adjacent non-overlapping)
    
    // Urli buffer (from business): 60m before, 60m after -> [11:30, 15:00)
    
    const res = await request(app)
      .post('/api/availability/check')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          { inventoryItemId: itemSofaId, quantity: 8 },
          { inventoryItemId: itemUrliId, quantity: 15 }
        ],
        eventStart: '2026-10-01T12:30:00Z',
        eventEnd: '2026-10-01T14:00:00Z'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(true);

    const items = res.body.data.items;
    
    const sofa = items.find((i: any) => i.inventoryItemId === itemSofaId);
    expect(sofa.period.start).toBe('2026-10-01T12:00:00.000Z');
    expect(sofa.period.end).toBe('2026-10-01T14:30:00.000Z');
    expect(sofa.reserved).toBe(0); // non-overlapping

    const urli = items.find((i: any) => i.inventoryItemId === itemUrliId);
    expect(urli.period.start).toBe('2026-10-01T11:30:00.000Z');
    expect(urli.period.end).toBe('2026-10-01T15:00:00.000Z');
    expect(urli.reserved).toBe(0); // cancelled reservation ignored
  });

  it('detects overlap conflict caused by expanded buffer', async () => {
    // Request from 12:15 to 14:00
    // Sofa buffer: 30m before -> effective start is 11:45
    // Previous reservation: [10:00, 12:00).
    // [10:00, 12:00) && [11:45, ...) = true (overlap!)
    
    const res = await request(app)
      .post('/api/availability/check')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          { inventoryItemId: itemSofaId, quantity: 8 }
        ],
        eventStart: '2026-10-01T12:15:00Z', // 12:15 - 30m = 11:45
        eventEnd: '2026-10-01T14:00:00Z'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(false);

    const sofa = res.body.data.items[0];
    expect(sofa.reserved).toBe(5); // The active reservation of 5
    expect(sofa.available).toBe(5); // 10 total - 5 reserved
    expect(sofa.shortage).toBe(3); // required 8 - available 5
  });

  it('rejects cross-tenant item requests with 404', async () => {
    // Create an item in a different business
    const bizOther = await prisma.business.create({ data: { name: 'Other', slug: `other-avail-${Date.now()}`, plan: 'FREE' } });
    const itemOther = await prisma.inventoryItem.create({ data: { businessId: bizOther.id, name: 'Other Item' } });

    const res = await request(app)
      .post('/api/availability/check')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          { inventoryItemId: itemOther.id, quantity: 1 }
        ],
        eventStart: '2026-10-01T12:00:00Z',
        eventEnd: '2026-10-01T14:00:00Z'
      });

    expect(res.status).toBe(404);
  });

  it('batches distinct item requests securely without cross-polluting effective windows', async () => {
    // Sofa requires 30m before and 30m after.
    // Urli requires 60m before and 60m after.
    // Ensure that Sofa's candidate window does not accidentally get Urli's buffer and vice versa.
    const res = await request(app)
      .post('/api/availability/check')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          { inventoryItemId: itemSofaId, quantity: 1 },
          { inventoryItemId: itemUrliId, quantity: 1 }
        ],
        eventStart: '2026-10-01T15:00:00Z',
        eventEnd: '2026-10-01T17:00:00Z'
      });

    expect(res.status).toBe(200);
    const items = res.body.data.items;
    const sofa = items.find((i: any) => i.inventoryItemId === itemSofaId);
    const urli = items.find((i: any) => i.inventoryItemId === itemUrliId);
    
    // Sofa period should be exactly [14:30, 17:30)
    expect(sofa.period.start).toBe('2026-10-01T14:30:00.000Z');
    expect(sofa.period.end).toBe('2026-10-01T17:30:00.000Z');

    // Urli period should be exactly [14:00, 18:00)
    expect(urli.period.start).toBe('2026-10-01T14:00:00.000Z');
    expect(urli.period.end).toBe('2026-10-01T18:00:00.000Z');
  });

  it('guarantees zero database mutations during availability checks', async () => {
    const reservationsBefore = await prisma.inventoryReservation.count();
    const demandsBefore = await prisma.bookingItemDemand.count();

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
    const demandsAfter = await prisma.bookingItemDemand.count();

    expect(reservationsAfter).toBe(reservationsBefore);
    expect(demandsAfter).toBe(demandsBefore);
  });
});
