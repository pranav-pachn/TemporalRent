import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { UserRole } from '@prisma/client';
import { hashPassword } from '../src/lib/password';
import { signAccessToken } from '../src/lib/jwt';

describe('Phase 5: Packages & Versioned BOM Components', () => {
  let businessA: { id: string; slug: string };
  let businessB: { id: string; slug: string };

  let tokenOwnerA: string;
  let tokenOwnerB: string;

  let itemA1Id: string;
  let itemA2Id: string;
  let itemB1Id: string;

  let packageId: string;
  let version1Id: string;
  let version2Id: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const pwdHash = await hashPassword('password123');

    // Create Business A
    businessA = await prisma.business.create({
      data: {
        name: `Pkg Biz A ${timestamp}`,
        slug: `pkg-biz-a-${timestamp}`,
      },
    });

    const ownerA = await prisma.user.create({
      data: {
        businessId: businessA.id,
        email: `pkg-owner-a-${timestamp}@test.com`,
        passwordHash: pwdHash,
        role: UserRole.OWNER,
      },
    });
    tokenOwnerA = await signAccessToken({
      userId: ownerA.id,
      businessId: businessA.id,
      role: UserRole.OWNER,
    });

    // Create items for Business A
    const itemA1 = await prisma.inventoryItem.create({
      data: {
        businessId: businessA.id,
        name: 'Urli Brass Pot',
        totalQty: 10,
      },
    });
    itemA1Id = itemA1.id;

    const itemA2 = await prisma.inventoryItem.create({
      data: {
        businessId: businessA.id,
        name: 'Yellow Carpet',
        totalQty: 20,
      },
    });
    itemA2Id = itemA2.id;

    // Create Business B and item for cross-tenant check
    businessB = await prisma.business.create({
      data: {
        name: `Pkg Biz B ${timestamp}`,
        slug: `pkg-biz-b-${timestamp}`,
      },
    });

    const ownerB = await prisma.user.create({
      data: {
        businessId: businessB.id,
        email: `pkg-owner-b-${timestamp}@test.com`,
        passwordHash: pwdHash,
        role: UserRole.OWNER,
      },
    });
    tokenOwnerB = await signAccessToken({
      userId: ownerB.id,
      businessId: businessB.id,
      role: UserRole.OWNER,
    });

    const itemB1 = await prisma.inventoryItem.create({
      data: {
        businessId: businessB.id,
        name: 'Foreign Canopy',
        totalQty: 5,
      },
    });
    itemB1Id = itemB1.id;
  });

  afterAll(async () => {
    if (businessA?.id) {
      await prisma.business.delete({ where: { id: businessA.id } }).catch(() => {});
    }
    if (businessB?.id) {
      await prisma.business.delete({ where: { id: businessB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('Package Creation', () => {
    it('creates a new package with no components', async () => {
      const res = await request(app)
        .post('/api/packages')
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          name: 'Haldi Stage Package',
          description: 'Traditional yellow wedding stage decor',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Haldi Stage Package');
      expect(res.body.data.businessId).toBe(businessA.id);
      packageId = res.body.data.id;
    });
  });

  describe('BOM Versioning & Multi-Tenancy Guards', () => {
    it('rejects adding an inventory item from another business with 404', async () => {
      const res = await request(app)
        .post(`/api/packages/${packageId}/versions`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          components: [
            { inventoryItemId: itemA1Id, quantity: 2 },
            { inventoryItemId: itemB1Id, quantity: 1 }, // Foreign item belonging to Business B
          ],
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('INVENTORY_ITEM_NOT_FOUND');
    });

    it('rejects duplicate inventory items in the same package version', async () => {
      const res = await request(app)
        .post(`/api/packages/${packageId}/versions`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          components: [
            { inventoryItemId: itemA1Id, quantity: 2 },
            { inventoryItemId: itemA1Id, quantity: 4 }, // Duplicate
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('DUPLICATE_COMPONENTS');
    });

    it('creates version 1 as DRAFT with BOM components', async () => {
      const res = await request(app)
        .post(`/api/packages/${packageId}/versions`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          components: [
            { inventoryItemId: itemA1Id, quantity: 4 },
            { inventoryItemId: itemA2Id, quantity: 2 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.versionNumber).toBe(1);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.packageComponents.length).toBe(2);
      version1Id = res.body.data.id;
    });
  });

  describe('Version Lifecycle (DRAFT -> ACTIVE -> ARCHIVED)', () => {
    it('activates version 1', async () => {
      const res = await request(app)
        .post(`/api/package-versions/${version1Id}/activate`)
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('rejects reactivating an already ACTIVE version', async () => {
      const res = await request(app)
        .post(`/api/package-versions/${version1Id}/activate`)
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PACKAGE_VERSION_LOCKED');
    });

    it('creates version 2 with updated components', async () => {
      const res = await request(app)
        .post(`/api/packages/${packageId}/versions`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          components: [
            { inventoryItemId: itemA1Id, quantity: 6 },
            { inventoryItemId: itemA2Id, quantity: 4 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.versionNumber).toBe(2);
      expect(res.body.data.status).toBe('DRAFT');
      version2Id = res.body.data.id;
    });

    it('activating version 2 archives version 1', async () => {
      const res = await request(app)
        .post(`/api/package-versions/${version2Id}/activate`)
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');

      // Verify version 1 is now ARCHIVED
      const v1 = await prisma.packageVersion.findUnique({
        where: { id: version1Id },
      });
      expect(v1?.status).toBe('ARCHIVED');
    });

    it('rejects activating an ARCHIVED version', async () => {
      const res = await request(app)
        .post(`/api/package-versions/${version1Id}/activate`)
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PACKAGE_VERSION_LOCKED');
    });
  });

  describe('Package History & Soft Deletion', () => {
    it('fetches full package details with all versions and BOM hierarchy', async () => {
      const res = await request(app)
        .get(`/api/packages/${packageId}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.packageVersions.length).toBe(2);
      expect(res.body.data.packageVersions[0].versionNumber).toBe(2);
    });

    it('soft deletes package while preserving version and component records', async () => {
      const res = await request(app)
        .delete(`/api/packages/${packageId}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(res.status).toBe(200);

      // Verify versions and components still exist in database for historical booking reference
      const versions = await prisma.packageVersion.findMany({
        where: { packageId },
        include: { packageComponents: true },
      });
      expect(versions.length).toBe(2);
      expect(versions[0].packageComponents.length).toBeGreaterThan(0);
    });
  });
});
