import { describe, it, expect, beforeAll } from 'vitest';
import { PackageExpansionService } from '../src/modules/package-expansion/package-expansion.service';
import { prisma } from '../src/lib/prisma';
import { PackageVersionStatus } from '@prisma/client';

describe('Phase 6: Package Expansion Engine', () => {
  const service = new PackageExpansionService();
  
  let businessAId: string;
  let businessBId: string;
  let itemA1Id: string; // Urli
  let itemA2Id: string; // Sofa
  let itemB1Id: string;
  let activeVersionId: string;
  let draftVersionId: string;

  beforeAll(async () => {
    // 1. Setup Businesses
    const bizA = await prisma.business.create({
      data: { name: 'Biz A', slug: `biz-a-exp-${Date.now()}`, plan: 'FREE' },
    });
    businessAId = bizA.id;

    const bizB = await prisma.business.create({
      data: { name: 'Biz B', slug: `biz-b-exp-${Date.now()}`, plan: 'FREE' },
    });
    businessBId = bizB.id;

    // 2. Setup Inventory Items
    const itemA1 = await prisma.inventoryItem.create({
      data: { businessId: businessAId, name: 'Urli', totalQty: 10 },
    });
    itemA1Id = itemA1.id;

    const itemA2 = await prisma.inventoryItem.create({
      data: { businessId: businessAId, name: 'Sofa', totalQty: 5 },
    });
    itemA2Id = itemA2.id;

    const itemB1 = await prisma.inventoryItem.create({
      data: { businessId: businessBId, name: 'Biz B Item', totalQty: 5 },
    });
    itemB1Id = itemB1.id;

    // 3. Setup Packages
    const pkg = await prisma.package.create({
      data: { businessId: businessAId, name: 'Premium Setup' },
    });

    const activeVersion = await prisma.packageVersion.create({
      data: {
        packageId: pkg.id,
        businessId: businessAId,
        versionNumber: 1,
        status: PackageVersionStatus.ACTIVE,
        packageComponents: {
          create: [
            { businessId: businessAId, inventoryItemId: itemA1Id, quantity: 4 }, // 4 Urlis
            { businessId: businessAId, inventoryItemId: itemA2Id, quantity: 1 }, // 1 Sofa
          ]
        }
      }
    });
    activeVersionId = activeVersion.id;

    const draftVersion = await prisma.packageVersion.create({
      data: {
        packageId: pkg.id,
        businessId: businessAId,
        versionNumber: 2,
        status: PackageVersionStatus.DRAFT,
        packageComponents: {
          create: [
            { businessId: businessAId, inventoryItemId: itemA1Id, quantity: 2 },
          ]
        }
      }
    });
    draftVersionId = draftVersion.id;
  });

  it('multiplies BOM components correctly (Package with 4 Urlis * 2 = 8 Urlis)', async () => {
    const demand = await service.expandPackage(activeVersionId, 2, businessAId);
    
    expect(demand).toHaveLength(2);
    
    const urliDemand = demand.find(d => d.inventoryItemId === itemA1Id);
    expect(urliDemand?.quantity).toBe(8); // 4 * 2
    
    const sofaDemand = demand.find(d => d.inventoryItemId === itemA2Id);
    expect(sofaDemand?.quantity).toBe(2); // 1 * 2
  });

  it('aggregates multi-package overlap + direct items correctly', async () => {
    // Booking: 2x Premium Setup (8 Urlis, 2 Sofas) + 2x Extra Urlis + 1x Extra Sofa
    const demand = await service.aggregateDemand([
      { packageVersionId: activeVersionId, quantity: 2 },
      { inventoryItemId: itemA1Id, quantity: 2 },
      { inventoryItemId: itemA2Id, quantity: 1 }
    ], businessAId);

    expect(demand).toHaveLength(2);
    
    // Total Urli = 8 (from package) + 2 (direct) = 10
    const urliDemand = demand.find(d => d.inventoryItemId === itemA1Id);
    expect(urliDemand?.quantity).toBe(10);

    // Total Sofa = 2 (from package) + 1 (direct) = 3
    const sofaDemand = demand.find(d => d.inventoryItemId === itemA2Id);
    expect(sofaDemand?.quantity).toBe(3);
  });

  it('rejects cross-tenant package expansion', async () => {
    await expect(service.expandPackage(activeVersionId, 1, businessBId))
      .rejects.toThrow(/not found/i);
  });

  it('rejects cross-tenant direct inventory item aggregation', async () => {
    await expect(service.aggregateDemand([
      { inventoryItemId: itemB1Id, quantity: 1 } // Biz B item requested by Biz A
    ], businessAId)).rejects.toThrow(/not found/i);
  });

  it('rejects non-positive quantities in expansion', async () => {
    await expect(service.expandPackage(activeVersionId, 0, businessAId))
      .rejects.toThrow(/greater than 0/);
  });

  it('rejects DRAFT package version', async () => {
    await expect(service.expandPackage(draftVersionId, 1, businessAId))
      .rejects.toThrow(/cannot be booked/i);
  });
});
