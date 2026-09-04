import { MovementType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  CreateInventoryInput,
  UpdateInventoryMetadataInput,
  AdjustInventoryInput,
  RecordDamageInput,
  RecordMissingInput,
  RecordMaintenanceInput,
  RestoreMaintenanceInput,
} from './inventory.schemas';

export class InventoryService {
  private formatItem<T extends { totalQty: number; damagedQty: number; missingQty: number; maintenanceQty: number }>(
    item: T
  ) {
    const usableQty = item.totalQty - (item.damagedQty + item.missingQty + item.maintenanceQty);
    return {
      ...item,
      usableQty,
    };
  }

  async listItems(businessId: string) {
    const items = await prisma.inventoryItem.findMany({
      where: {
        businessId,
        deletedAt: null,
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => this.formatItem(item));
  }

  async getItemById(businessId: string, id: string) {
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
      include: {
        category: true,
      },
    });

    return item ? this.formatItem(item) : null;
  }

  async createItem(businessId: string, data: CreateInventoryInput, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          businessId,
          name: data.name,
          sku: data.sku,
          categoryId: data.categoryId,
          totalQty: data.totalQty ?? 0,
          damagedQty: 0,
          missingQty: 0,
          maintenanceQty: 0,
        },
        include: {
          category: true,
        },
      });

      if ((data.totalQty ?? 0) > 0) {
        await tx.inventoryMovement.create({
          data: {
            businessId,
            inventoryItemId: item.id,
            movementType: MovementType.ADJUSTMENT,
            quantityDelta: data.totalQty ?? 0,
            notes: 'Initial inventory creation',
            createdByUserId: userId,
          },
        });
      }

      return this.formatItem(item);
    });
  }

  async updateMetadata(businessId: string, id: string, data: UpdateInventoryMetadataInput) {
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
      },
    });

    return this.formatItem(updated);
  }

  async softDeleteItem(businessId: string, id: string) {
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const deleted = await prisma.inventoryItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      include: {
        category: true,
      },
    });

    return this.formatItem(deleted);
  }

  async adjustQuantity(businessId: string, id: string, data: AdjustInventoryInput, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: {
          id,
          businessId,
          deletedAt: null,
        },
      });

      if (!item) {
        return null;
      }

      const newTotal = item.totalQty + data.quantityDelta;
      const allocated = item.damagedQty + item.missingQty + item.maintenanceQty;

      if (newTotal < allocated) {
        throw new Error('INVARIANT_VIOLATION');
      }

      if (newTotal < 0) {
        throw new Error('INVARIANT_VIOLATION');
      }

      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          totalQty: newTotal,
        },
        include: {
          category: true,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          businessId,
          inventoryItemId: id,
          movementType: MovementType.ADJUSTMENT,
          quantityDelta: data.quantityDelta,
          notes: data.notes,
          createdByUserId: userId,
        },
      });

      return this.formatItem(updated);
    });
  }

  async recordDamage(businessId: string, id: string, data: RecordDamageInput, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: {
          id,
          businessId,
          deletedAt: null,
        },
      });

      if (!item) {
        return null;
      }

      const usableQty = item.totalQty - (item.damagedQty + item.missingQty + item.maintenanceQty);
      if (usableQty < data.quantity) {
        throw new Error('INSUFFICIENT_USABLE_STOCK');
      }

      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          damagedQty: item.damagedQty + data.quantity,
        },
        include: {
          category: true,
        },
      });

      await tx.damageReport.create({
        data: {
          businessId,
          inventoryItemId: id,
          bookingId: data.bookingId,
          quantityDamaged: data.quantity,
          description: data.description,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          businessId,
          inventoryItemId: id,
          bookingId: data.bookingId,
          movementType: MovementType.DAMAGE,
          quantityDelta: 0,
          notes: data.description,
          createdByUserId: userId,
        },
      });

      return this.formatItem(updated);
    });
  }

  async recordMissing(businessId: string, id: string, data: RecordMissingInput, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: {
          id,
          businessId,
          deletedAt: null,
        },
      });

      if (!item) {
        return null;
      }

      const usableQty = item.totalQty - (item.damagedQty + item.missingQty + item.maintenanceQty);
      if (usableQty < data.quantity) {
        throw new Error('INSUFFICIENT_USABLE_STOCK');
      }

      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          missingQty: item.missingQty + data.quantity,
        },
        include: {
          category: true,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          businessId,
          inventoryItemId: id,
          bookingId: data.bookingId,
          movementType: MovementType.MISSING,
          quantityDelta: 0,
          notes: data.notes,
          createdByUserId: userId,
        },
      });

      return this.formatItem(updated);
    });
  }

  async recordMaintenance(businessId: string, id: string, data: RecordMaintenanceInput, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: {
          id,
          businessId,
          deletedAt: null,
        },
      });

      if (!item) {
        return null;
      }

      const usableQty = item.totalQty - (item.damagedQty + item.missingQty + item.maintenanceQty);
      if (usableQty < data.quantity) {
        throw new Error('INSUFFICIENT_USABLE_STOCK');
      }

      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          maintenanceQty: item.maintenanceQty + data.quantity,
        },
        include: {
          category: true,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          businessId,
          inventoryItemId: id,
          movementType: MovementType.MAINTENANCE,
          quantityDelta: 0,
          notes: data.notes,
          createdByUserId: userId,
        },
      });

      return this.formatItem(updated);
    });
  }

  async restoreMaintenance(businessId: string, id: string, data: RestoreMaintenanceInput, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: {
          id,
          businessId,
          deletedAt: null,
        },
      });

      if (!item) {
        return null;
      }

      if (item.maintenanceQty < data.quantity) {
        throw new Error('INSUFFICIENT_MAINTENANCE_STOCK');
      }

      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          maintenanceQty: item.maintenanceQty - data.quantity,
        },
        include: {
          category: true,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          businessId,
          inventoryItemId: id,
          movementType: MovementType.MAINTENANCE_RESTORE,
          quantityDelta: 0,
          notes: data.notes,
          createdByUserId: userId,
        },
      });

      return this.formatItem(updated);
    });
  }

  async getMovements(businessId: string, id: string) {
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
    });

    if (!item) {
      return null;
    }

    return prisma.inventoryMovement.findMany({
      where: {
        businessId,
        inventoryItemId: id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const inventoryService = new InventoryService();
