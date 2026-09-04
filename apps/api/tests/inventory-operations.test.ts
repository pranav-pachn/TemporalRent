import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { UserRole } from '@prisma/client';
import { hashPassword } from '../src/lib/password';
import { signAccessToken } from '../src/lib/jwt';

describe('Phase 4: Inventory Operations & Movements Ledger', () => {
  let business: { id: string; slug: string };
  let tokenOwner: string;
  let tokenSales: string;
  let itemId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const pwdHash = await hashPassword('password123');

    business = await prisma.business.create({
      data: {
        name: `Inv Ops Biz ${timestamp}`,
        slug: `inv-ops-${timestamp}`,
      },
    });

    const owner = await prisma.user.create({
      data: {
        businessId: business.id,
        email: `owner-${timestamp}@test.com`,
        passwordHash: pwdHash,
        role: UserRole.OWNER,
      },
    });
    tokenOwner = await signAccessToken({
      userId: owner.id,
      businessId: business.id,
      role: UserRole.OWNER,
    });

    const sales = await prisma.user.create({
      data: {
        businessId: business.id,
        email: `sales-${timestamp}@test.com`,
        passwordHash: pwdHash,
        role: UserRole.SALES,
      },
    });
    tokenSales = await signAccessToken({
      userId: sales.id,
      businessId: business.id,
      role: UserRole.SALES,
    });
  });

  afterAll(async () => {
    if (business?.id) {
      await prisma.business.delete({ where: { id: business.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('Creation with Ledger & Usable Quantity', () => {
    it('creates an inventory item with initial totalQty and movement ledger entry', async () => {
      const res = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Banquet Chair',
          sku: 'CHAIR-BANQ-01',
          totalQty: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Banquet Chair');
      expect(res.body.data.totalQty).toBe(50);
      expect(res.body.data.damagedQty).toBe(0);
      expect(res.body.data.missingQty).toBe(0);
      expect(res.body.data.maintenanceQty).toBe(0);
      expect(res.body.data.usableQty).toBe(50);
      itemId = res.body.data.id;

      // Verify movement ledger entry was created
      const movements = await request(app)
        .get(`/api/inventory/${itemId}/movements`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(movements.status).toBe(200);
      expect(movements.body.data.length).toBe(1);
      expect(movements.body.data[0].movementType).toBe('ADJUSTMENT');
      expect(movements.body.data[0].quantityDelta).toBe(50);
    });

    it('returns dynamically computed usableQty on GET /api/inventory/:id', async () => {
      const res = await request(app)
        .get(`/api/inventory/${itemId}`)
        .set('Authorization', `Bearer ${tokenSales}`);

      expect(res.status).toBe(200);
      expect(res.body.data.usableQty).toBe(50);
    });
  });

  describe('Metadata Updates & Quantity Mutation Protection', () => {
    it('rejects direct quantity mutations via PATCH /api/inventory/:id', async () => {
      const res = await request(app)
        .patch(`/api/inventory/${itemId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          totalQty: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('QUANTITY_MUTATION_NOT_ALLOWED');
    });

    it('successfully updates metadata without touching quantities', async () => {
      const res = await request(app)
        .patch(`/api/inventory/${itemId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Deluxe Banquet Chair',
          sku: 'CHAIR-DELUXE-01',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Deluxe Banquet Chair');
      expect(res.body.data.sku).toBe('CHAIR-DELUXE-01');
      expect(res.body.data.totalQty).toBe(50);
      expect(res.body.data.usableQty).toBe(50);
    });
  });

  describe('Quantity Adjustments', () => {
    it('adjusts total quantity upward and logs movement', async () => {
      const res = await request(app)
        .post(`/api/inventory/${itemId}/adjust`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          quantityDelta: 10,
          notes: 'Received new stock shipment',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.totalQty).toBe(60);
      expect(res.body.data.usableQty).toBe(60);
    });

    it('adjusts total quantity downward', async () => {
      const res = await request(app)
        .post(`/api/inventory/${itemId}/adjust`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          quantityDelta: -5,
          notes: 'Sold off 5 old units',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.totalQty).toBe(55);
      expect(res.body.data.usableQty).toBe(55);
    });
  });

  describe('Damage, Missing, and Maintenance Lifecycle', () => {
    it('records damaged inventory, reducing usableQty', async () => {
      const res = await request(app)
        .post(`/api/inventory/${itemId}/damage`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          quantity: 5,
          description: 'Broken leg during transit',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.damagedQty).toBe(5);
      expect(res.body.data.totalQty).toBe(55);
      expect(res.body.data.usableQty).toBe(50); // 55 - 5
    });

    it('rejects damage recording when quantity exceeds usableQty', async () => {
      const res = await request(app)
        .post(`/api/inventory/${itemId}/damage`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          quantity: 100, // usable is only 50
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INSUFFICIENT_USABLE_STOCK');
    });

    it('records missing inventory, reducing usableQty', async () => {
      const res = await request(app)
        .post(`/api/inventory/${itemId}/missing`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          quantity: 3,
          notes: 'Not returned from wedding event',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.missingQty).toBe(3);
      expect(res.body.data.usableQty).toBe(47); // 55 - 5 - 3
    });

    it('moves inventory to maintenance and restores it', async () => {
      // Move 4 to maintenance
      const maintRes = await request(app)
        .post(`/api/inventory/${itemId}/maintenance`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          quantity: 4,
          notes: 'Polishing and fabric repair',
        });

      expect(maintRes.status).toBe(200);
      expect(maintRes.body.data.maintenanceQty).toBe(4);
      expect(maintRes.body.data.usableQty).toBe(43); // 55 - 5 - 3 - 4

      // Restore 2 from maintenance
      const restoreRes = await request(app)
        .post(`/api/inventory/${itemId}/maintenance/restore`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          quantity: 2,
          notes: '2 units polished and returned to pool',
        });

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.maintenanceQty).toBe(2);
      expect(restoreRes.body.data.usableQty).toBe(45); // 55 - 5 - 3 - 2
    });

    it('rejects restoring more than current maintenance quantity', async () => {
      const res = await request(app)
        .post(`/api/inventory/${itemId}/maintenance/restore`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          quantity: 10, // only 2 under maintenance
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INSUFFICIENT_MAINTENANCE_STOCK');
    });

    it('rejects downward adjustment that violates state capacity', async () => {
      // total = 55, allocated = 5 (damaged) + 3 (missing) + 2 (maintenance) = 10
      // adjusting by -50 would make total 5 < 10 allocated
      const res = await request(app)
        .post(`/api/inventory/${itemId}/adjust`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          quantityDelta: -50,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVARIANT_VIOLATION');
    });
  });

  describe('Audit Movement Ledger Verification', () => {
    it('returns complete movement ledger history in descending order', async () => {
      const res = await request(app)
        .get(`/api/inventory/${itemId}/movements`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.status).toBe(200);
      const movements = res.body.data;

      // Expected movements: INITIAL(+50), ADJUST(+10), ADJUST(-5), DAMAGE(0), MISSING(0), MAINT(0), MAINT_RESTORE(0)
      expect(movements.length).toBe(7);
      expect(movements[0].movementType).toBe('MAINTENANCE_RESTORE');
      expect(movements[0].createdByUser.email).toBeDefined();
    });
  });

  describe('Soft Deletion', () => {
    it('soft deletes inventory item', async () => {
      const res = await request(app)
        .delete(`/api/inventory/${itemId}`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.status).toBe(200);

      // Verify item no longer returned in active list
      const listRes = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${tokenOwner}`);

      const ids = listRes.body.data.map((i: any) => i.id);
      expect(ids).not.toContain(itemId);
    });
  });
});
