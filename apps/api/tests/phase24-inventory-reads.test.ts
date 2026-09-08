import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../src/app';
import { signAccessToken } from '../src/lib/jwt';

const prisma = new PrismaClient();

describe('Phase 24: Inventory Read Projections', () => {
  let b1Id: string;
  let b2Id: string;
  let user1Token: string;
  let item1Id: string;
  let item2Id: string; // Tenant B item
  let booking1Id: string;
  let booking2Id: string; // Tenant B booking

  async function clearDB() {
    await prisma.auditEvent.deleteMany({});
    await prisma.inventoryMovement.deleteMany({});
    await prisma.damageReport.deleteMany({});
    await prisma.inventoryReservation.deleteMany({});
    await prisma.bookingLine.deleteMany({});
    await prisma.bookingItemDemand.deleteMany({});
    await prisma.booking.deleteMany({});
    
    // Clear packages to remove foreign key constraints on inventory
    await prisma.packageComponent.deleteMany({});
    await prisma.packageVersion.deleteMany({});
    await prisma.package.deleteMany({});
    
    await prisma.inventoryItem.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.business.deleteMany({});
  }

  beforeAll(async () => {
    await clearDB();
    // Setup tenants
    const b1 = await prisma.business.create({
      data: { name: 'Tenant A', slug: 'tenant-a-p24', timezone: 'UTC' },
    });
    b1Id = b1.id;

    const b2 = await prisma.business.create({
      data: { name: 'Tenant B', slug: 'tenant-b-p24', timezone: 'UTC' },
    });
    b2Id = b2.id;

    // Setup users
    const u1 = await prisma.user.create({
      data: { businessId: b1.id, email: 'u1@a.com', passwordHash: 'hash', role: 'ADMIN' },
    });
    user1Token = await signAccessToken({ userId: u1.id, businessId: b1.id, role: u1.role });

    const c1 = await prisma.customer.create({ data: { businessId: b1.id, name: 'Cust A' } });
    const c2 = await prisma.customer.create({ data: { businessId: b2.id, name: 'Cust B' } });

    // Setup items
    const i1 = await prisma.inventoryItem.create({
      data: { businessId: b1.id, name: 'Item A', totalQty: 10 },
    });
    item1Id = i1.id;

    const i2 = await prisma.inventoryItem.create({
      data: { businessId: b2.id, name: 'Item B', totalQty: 10 },
    });
    item2Id = i2.id;

    // Setup bookings & reservations for Tenant A
    const booking1IdUuid = 'b0000000-0000-0000-0000-000000000001';
    booking1Id = booking1IdUuid;
    await prisma.$executeRaw`
      INSERT INTO bookings (id, "businessId", "customerId", "createdByUserId", "eventName", status, "eventStart", "eventEnd", period, "createdAt", "updatedAt")
      VALUES (${booking1IdUuid}::uuid, ${b1.id}, ${c1.id}, ${u1.id}, 'Event A', 'CONFIRMED', '2026-09-10T10:00:00Z'::timestamptz, '2026-09-10T18:00:00Z'::timestamptz, tstzrange('2026-09-10T10:00:00Z'::timestamptz, '2026-09-10T18:00:00Z'::timestamptz, '[)'), NOW(), NOW())
    `;

    // Active reservation overlaps [Sep 10 10:00, Sep 10 18:00)
    await prisma.$executeRaw`
      INSERT INTO inventory_reservations (id, "businessId", "inventoryItemId", "bookingId", quantity, period, status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${b1.id}, ${i1.id}, ${booking1IdUuid}::uuid, 2, tstzrange('2026-09-10T10:00:00Z'::timestamptz, '2026-09-10T18:00:00Z'::timestamptz, '[)'), 'ACTIVE', NOW(), NOW())
    `;

    // Cancelled reservation overlaps [Sep 15, Sep 16)
    await prisma.$executeRaw`
      INSERT INTO inventory_reservations (id, "businessId", "inventoryItemId", "bookingId", quantity, period, status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${b1.id}, ${i1.id}, ${booking1IdUuid}::uuid, 1, tstzrange('2026-09-15T10:00:00Z'::timestamptz, '2026-09-16T10:00:00Z'::timestamptz, '[)'), 'CANCELLED', NOW(), NOW())
    `;

    // Setup bookings & reservations for Tenant B
    const booking2IdUuid = 'b0000000-0000-0000-0000-000000000002';
    booking2Id = booking2IdUuid;
    await prisma.$executeRaw`
      INSERT INTO bookings (id, "businessId", "customerId", "createdByUserId", "eventName", status, "eventStart", "eventEnd", period, "createdAt", "updatedAt")
      VALUES (${booking2IdUuid}::uuid, ${b2.id}, ${c2.id}, ${u1.id}, 'Event B', 'CONFIRMED', '2026-09-10T10:00:00Z'::timestamptz, '2026-09-10T18:00:00Z'::timestamptz, tstzrange('2026-09-10T10:00:00Z'::timestamptz, '2026-09-10T18:00:00Z'::timestamptz, '[)'), NOW(), NOW())
    `;

    await prisma.$executeRaw`
      INSERT INTO inventory_reservations (id, "businessId", "inventoryItemId", "bookingId", quantity, period, status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${b2.id}, ${i2.id}, ${booking2IdUuid}::uuid, 5, tstzrange('2026-09-10T10:00:00Z'::timestamptz, '2026-09-10T18:00:00Z'::timestamptz, '[)'), 'ACTIVE', NOW(), NOW())
    `;

    // Setup damage report for Tenant A
    await prisma.damageReport.create({
      data: {
        businessId: b1.id,
        inventoryItemId: i1.id,
        bookingId: booking1IdUuid,
        quantityDamaged: 1,
        description: 'Scratched',
      },
    });
  });

  afterAll(async () => {
    await clearDB();
    await prisma.$disconnect();
  });

  describe('GET /inventory/:id/reservations', () => {
    it('should return 400 if from/to dates are missing', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/${item1Id}/reservations`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
    });

    it('should return overlapping ACTIVE reservations for date range', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/${item1Id}/reservations?from=2026-09-01T00:00:00Z&to=2026-09-30T00:00:00Z`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1); // Should only get ACTIVE, not CANCELLED
      expect(res.body.data[0].eventName).toBe('Event A');
    });

    it('should NOT return reservations outside date range', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/${item1Id}/reservations?from=2026-10-01T00:00:00Z&to=2026-10-31T00:00:00Z`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('should enforce tenant isolation', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/${item2Id}/reservations?from=2026-09-01T00:00:00Z&to=2026-09-30T00:00:00Z`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /inventory/:id/bookings', () => {
    it('should return bookings associated with item', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/${item1Id}/bookings`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(booking1Id);
      expect(res.body.data[0].eventName).toBe('Event A');
      expect(res.body.data[0].customer.name).toBe('Cust A');
    });

    it('should enforce tenant isolation', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/${item2Id}/bookings`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /inventory/:id/damage', () => {
    it('should return damage history for item', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/${item1Id}/damage`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].description).toBe('Scratched');
    });

    it('should enforce tenant isolation', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/${item2Id}/damage`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
    });
  });
});
