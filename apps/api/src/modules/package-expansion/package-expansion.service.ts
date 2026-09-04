import { prisma } from '../../lib/prisma';
import { BookingLineInput, ExpandedDemand } from './package-expansion.types';
import { ApiError } from '../../lib/errors';
import { PackageVersionStatus } from '@prisma/client';

export class PackageExpansionService {
  /**
   * Expands a single package version into its raw inventory item demand.
   * Ensures business boundary and valid package state.
   */
  async expandPackage(
    packageVersionId: string,
    packageQty: number,
    businessId: string
  ): Promise<ExpandedDemand[]> {
    if (packageQty <= 0) {
      throw new ApiError(400, 'INVALID_QUANTITY', 'Package quantity must be greater than 0');
    }

    const version = await prisma.packageVersion.findUnique({
      where: { id: packageVersionId },
      include: { packageComponents: true },
    });

    if (!version || version.businessId !== businessId) {
      throw new ApiError(404, 'PACKAGE_VERSION_NOT_FOUND', 'Package version not found');
    }

    if (version.status === PackageVersionStatus.DRAFT) {
      throw new ApiError(400, 'PACKAGE_VERSION_NOT_BOOKABLE', 'Draft packages cannot be booked');
    }

    return version.packageComponents.map((component) => ({
      inventoryItemId: component.inventoryItemId,
      quantity: component.quantity * packageQty,
    }));
  }

  /**
   * Aggregates demand from a mix of package version lines and direct inventory item lines.
   * Returns a flat list of total quantity demanded per inventory item.
   */
  async aggregateDemand(lines: BookingLineInput[], businessId: string): Promise<ExpandedDemand[]> {
    const itemDemands = new Map<string, number>();

    // Step 1: Pre-verify direct inventory items to ensure tenant isolation
    const directItemIds = lines
      .filter((line) => line.inventoryItemId)
      .map((line) => line.inventoryItemId!);

    if (directItemIds.length > 0) {
      const items = await prisma.inventoryItem.findMany({
        where: { id: { in: directItemIds } },
        select: { id: true, businessId: true },
      });

      const itemMap = new Map(items.map((i) => [i.id, i.businessId]));

      for (const itemId of directItemIds) {
        if (itemMap.get(itemId) !== businessId) {
          throw new ApiError(404, 'INVENTORY_ITEM_NOT_FOUND', `Inventory item ${itemId} not found`);
        }
      }
    }

    // Step 2: Expand and accumulate
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw new ApiError(400, 'INVALID_QUANTITY', 'Quantity must be greater than 0');
      }

      if (line.packageVersionId) {
        // It's a package
        const expanded = await this.expandPackage(line.packageVersionId, line.quantity, businessId);
        for (const demand of expanded) {
          itemDemands.set(
            demand.inventoryItemId,
            (itemDemands.get(demand.inventoryItemId) || 0) + demand.quantity
          );
        }
      } else if (line.inventoryItemId) {
        // It's a direct item
        itemDemands.set(
          line.inventoryItemId,
          (itemDemands.get(line.inventoryItemId) || 0) + line.quantity
        );
      } else {
        throw new ApiError(400, 'INVALID_BOOKING_LINE', 'Line must specify packageVersionId or inventoryItemId');
      }
    }

    // Step 3: Format into output contract
    const result: ExpandedDemand[] = [];
    for (const [inventoryItemId, quantity] of itemDemands.entries()) {
      result.push({ inventoryItemId, quantity });
    }

    return result;
  }
}
