import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { UserRole } from '@prisma/client';
import { hashPassword } from '../src/lib/password';
import { signAccessToken } from '../src/lib/jwt';

describe('Phase 2 & 3: Tenant Isolation, RBAC, and Invariants', () => {
  let businessA: { id: string; slug: string };
  let businessB: { id: string; slug: string };

  let tokenOwnerA: string;
  let tokenSalesA: string;
  let tokenWarehouseA: string;
  let tokenOwnerB: string;

  let itemAId: string;
  let itemBId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const pwdHash = await hashPassword('password123');

    // Create Business A
    businessA = await prisma.business.create({
      data: {
        name: `Business A ${timestamp}`,
        slug: `biz-a-${timestamp}`,
      },
    });

    // Create Owner A
    const ownerA = await prisma.user.create({
      data: {
        businessId: businessA.id,
        email: `owner-a-${timestamp}@test.com`,
        passwordHash: pwdHash,
        role: UserRole.OWNER,
      },
    });
    tokenOwnerA = await signAccessToken({
      userId: ownerA.id,
      businessId: businessA.id,
      role: UserRole.OWNER,
    });

    // Create Sales A
    const salesA = await prisma.user.create({
      data: {
        businessId: businessA.id,
        email: `sales-a-${timestamp}@test.com`,
        passwordHash: pwdHash,
        role: UserRole.SALES,
      },
    });
    tokenSalesA = await signAccessToken({
      userId: salesA.id,
      businessId: businessA.id,
      role: UserRole.SALES,
    });

    // Create Warehouse A
    const warehouseA = await prisma.user.create({
      data: {
        businessId: businessA.id,
        email: `wh-a-${timestamp}@test.com`,
        passwordHash: pwdHash,
        role: UserRole.WAREHOUSE,
      },
    });
    tokenWarehouseA = await signAccessToken({
      userId: warehouseA.id,
      businessId: businessA.id,
      role: UserRole.WAREHOUSE,
    });

    // Create Business B
    businessB = await prisma.business.create({
      data: {
        name: `Business B ${timestamp}`,
        slug: `biz-b-${timestamp}`,
      },
    });

    // Create Owner B
    const ownerB = await prisma.user.create({
      data: {
        businessId: businessB.id,
        email: `owner-b-${timestamp}@test.com`,
        passwordHash: pwdHash,
        role: UserRole.OWNER,
      },
    });
    tokenOwnerB = await signAccessToken({
      userId: ownerB.id,
      businessId: businessB.id,
      role: UserRole.OWNER,
    });
  });

  afterAll(async () => {
    // Cleanup created businesses (cascades to users and inventory)
    if (businessA?.id) {
      await prisma.business.delete({ where: { id: businessA.id } }).catch(() => {});
    }
    if (businessB?.id) {
      await prisma.business.delete({ where: { id: businessB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('Authentication Middleware', () => {
    it('rejects unauthenticated requests to protected endpoints with 401', async () => {
      const res = await request(app).get('/inventory');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('rejects requests with invalid JWT tokens with 401', async () => {
      const res = await request(app)
        .get('/inventory')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('Tenant Creation & Inventory Seeding', () => {
    it('creates an inventory item under Business A', async () => {
      const res = await request(app)
        .post('/inventory')
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          name: 'VIP Sofa',
          sku: 'SOFA-VIP-01',
          totalQty: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('VIP Sofa');
      expect(res.body.data.businessId).toBe(businessA.id);
      itemAId = res.body.data.id;
    });

    it('creates an inventory item under Business B', async () => {
      const res = await request(app)
        .post('/inventory')
        .set('Authorization', `Bearer ${tokenOwnerB}`)
        .send({
          name: 'Royal Canopy',
          sku: 'CANOPY-01',
          totalQty: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Royal Canopy');
      expect(res.body.data.businessId).toBe(businessB.id);
      itemBId = res.body.data.id;
    });
  });

  describe('Tenant Isolation Verification', () => {
    it('Business A list does not leak items from Business B', async () => {
      const res = await request(app)
        .get('/inventory')
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(res.status).toBe(200);
      const items = res.body.data;
      const ids = items.map((i: any) => i.id);

      expect(ids).toContain(itemAId);
      expect(ids).not.toContain(itemBId);
    });

    it('Business B list does not leak items from Business A', async () => {
      const res = await request(app)
        .get('/inventory')
        .set('Authorization', `Bearer ${tokenOwnerB}`);

      expect(res.status).toBe(200);
      const items = res.body.data;
      const ids = items.map((i: any) => i.id);

      expect(ids).toContain(itemBId);
      expect(ids).not.toContain(itemAId);
    });

    it('User A fetching Business B item by ID returns 404 (not 403, preserving privacy)', async () => {
      const res = await request(app)
        .get(`/inventory/${itemBId}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('User A updating Business B item returns 404 and leaves item untouched', async () => {
      const res = await request(app)
        .patch(`/inventory/${itemBId}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ name: 'Hacked Canopy' });

      expect(res.status).toBe(404);

      // Verify Business B item remains untouched
      const untouched = await prisma.inventoryItem.findUnique({
        where: { id: itemBId },
      });
      expect(untouched?.name).toBe('Royal Canopy');
    });
  });

  describe('RBAC Authorization', () => {
    it('SALES role is forbidden (403) from creating inventory items', async () => {
      const res = await request(app)
        .post('/inventory')
        .set('Authorization', `Bearer ${tokenSalesA}`)
        .send({
          name: 'Stage Truss',
          totalQty: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('SALES role is forbidden (403) from patching inventory items', async () => {
      const res = await request(app)
        .patch(`/inventory/${itemAId}`)
        .set('Authorization', `Bearer ${tokenSalesA}`)
        .send({ totalQty: 100 });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('SALES role can read inventory', async () => {
      const res = await request(app)
        .get('/inventory')
        .set('Authorization', `Bearer ${tokenSalesA}`);

      expect(res.status).toBe(200);
    });

    it('WAREHOUSE role can create inventory items', async () => {
      const res = await request(app)
        .post('/inventory')
        .set('Authorization', `Bearer ${tokenWarehouseA}`)
        .send({
          name: 'Haldi Urli',
          sku: 'URLI-01',
          totalQty: 15,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Haldi Urli');
    });
  });

  describe('Database Capacity Invariant & Mutation Guards', () => {
    it('rejects direct quantity mutation via PATCH /inventory/:id', async () => {
      const res = await request(app)
        .patch(`/inventory/${itemAId}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          damagedQty: 12,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('QUANTITY_MUTATION_NOT_ALLOWED');
    });

    it('rejects downward adjustment that violates state capacity', async () => {
      const res = await request(app)
        .post(`/inventory/${itemAId}/adjust`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          quantityDelta: -100, // totalQty is 20, cannot reduce below 0
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVARIANT_VIOLATION');
    });
  });
});
