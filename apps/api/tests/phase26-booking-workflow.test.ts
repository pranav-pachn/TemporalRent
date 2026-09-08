import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';
import { randomUUID } from 'crypto';

describe('Phase 26: Booking Workflow', () => {
  let business: any;
  let user: any;
  let token: string;
  let customer: any;
  let packageVersion: any;
  let item1: any;
  let item2: any;

  beforeAll(async () => {
    business = await prisma.business.create({
      data: { name: 'Workflow Test Business', slug: `wf-${Date.now()}` },
    });
    user = await prisma.user.create({
      data: { businessId: business.id, email: `workflow-${Date.now()}@test.com`, passwordHash: 'hash', role: 'ADMIN' },
    });
    token = await signAccessToken({ userId: user.id, businessId: business.id, role: 'ADMIN' });

    customer = await prisma.customer.create({
      data: { businessId: business.id, name: 'Test Workflow Customer' },
    });

    const cat = await prisma.category.create({
      data: { businessId: business.id, name: 'Workflow Category' },
    });

    item1 = await prisma.inventoryItem.create({
      data: {
        businessId: business.id,
        name: 'Workflow Item 1',
        totalQty: 10,
        categoryId: cat.id,
      },
    });

    item2 = await prisma.inventoryItem.create({
      data: {
        businessId: business.id,
        name: 'Workflow Item 2',
        totalQty: 20,
        categoryId: cat.id,
      },
    });

    const pkg = await prisma.package.create({
      data: {
        businessId: business.id,
        name: 'Workflow Package',
      },
    });

    packageVersion = await prisma.packageVersion.create({
      data: {
        packageId: pkg.id,
        businessId: business.id,
        versionNumber: 1,
        status: 'ACTIVE',
      },
    });

    await prisma.packageComponent.create({
      data: {
        packageVersionId: packageVersion.id,
        inventoryItemId: item1.id,
        quantity: 2,
        businessId: business.id,
      },
    });

    await prisma.packageComponent.create({
      data: {
        packageVersionId: packageVersion.id,
        inventoryItemId: item2.id,
        quantity: 5,
        businessId: business.id,
      },
    });
  });

  afterAll(async () => {
    // Teardown
    await prisma.idempotencyRecord.deleteMany({ where: { businessId: business.id } });
    await prisma.inventoryReservation.deleteMany({ where: { businessId: business.id } });
    await prisma.bookingLine.deleteMany({});
    await prisma.booking.deleteMany({ where: { businessId: business.id } });
    await prisma.packageComponent.deleteMany({});
    await prisma.packageVersion.deleteMany({ where: { businessId: business.id } });
    await prisma.package.deleteMany({ where: { businessId: business.id } });
    await prisma.inventoryItem.deleteMany({ where: { businessId: business.id } });
    await prisma.category.deleteMany({ where: { businessId: business.id } });
    await prisma.customer.deleteMany({ where: { businessId: business.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.business.deleteMany({ where: { id: business.id } });
  });

  let bookingId: string;

  it('1. Fetches customers list successfully', async () => {
    const res = await request(app)
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toBe('Test Workflow Customer');
  });

  it('2. Fails to create draft with invalid dates (start > end)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer.id,
        eventName: 'Invalid Date Event',
        eventStart: '2026-10-10T10:00:00Z',
        eventEnd: '2026-10-09T10:00:00Z',
        lines: [
          {
            type: 'PACKAGE',
            packageVersionId: packageVersion.id,
            quantity: 1,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('3. Creates a Draft booking successfully', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer.id,
        eventName: 'Workflow Test Event',
        eventStart: '2026-12-01T10:00:00Z',
        eventEnd: '2026-12-05T10:00:00Z',
        lines: [
          {
            type: 'PACKAGE',
            packageVersionId: packageVersion.id,
            quantity: 2,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    bookingId = res.body.data.id;
  });

  it('4. Checks availability (expands package and shows availability)', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/check-availability`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    console.log('AVAILABILITY ITEMS', JSON.stringify(res.body.items, null, 2));
    console.log('LOOKING FOR', item1.id, item2.id);
    expect(res.body.items).toHaveLength(2);

    const item1Result = res.body.items.find((i: any) => i.inventoryItemId === item1.id);
    expect(item1Result).toBeDefined();
    expect(item1Result.required).toBe(4); // 2 package qty * 2 component qty
    expect(item1Result.available).toBe(10);
    expect(item1Result.shortage).toBe(0);

    const item2Result = res.body.items.find((i: any) => i.inventoryItemId === item2.id);
    expect(item2Result.requested).toBe(10); // 2 package qty * 5 component qty
    expect(item2Result.available).toBe(20);
  });

  it('5. Transitions to QUOTED state', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/quote`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('QUOTED');
  });

  const idempotencyKey = randomUUID();

  it('6. Confirms the booking successfully using Idempotency-Key', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');

    // Check reservations were created
    const reservations = await prisma.inventoryReservation.findMany({
      where: { bookingId },
    });
    expect(reservations).toHaveLength(2);
    expect(reservations.map(r => r.quantity).sort((a,b) => a - b)).toEqual([4, 10]);
  });

  it('7. Idempotent double-click returns the exact same result without error', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey); // Same key

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');

    // Make sure we didn't duplicate reservations
    const reservations = await prisma.inventoryReservation.findMany({
      where: { bookingId },
    });
    expect(reservations).toHaveLength(2); // Still just 2
  });

  it('8. Cannot confirm if status is already confirmed without idempotency key match', async () => {
    const newKey = randomUUID();
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', newKey); // Different key

    expect(res.status).toBe(409); // INVALID_STATUS_TRANSITION
  });
});
