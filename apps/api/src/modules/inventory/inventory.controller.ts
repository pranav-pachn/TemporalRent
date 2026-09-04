import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import {
  createInventorySchema,
  updateInventoryMetadataSchema,
  adjustInventorySchema,
  recordDamageSchema,
  recordMissingSchema,
  recordMaintenanceSchema,
  restoreMaintenanceSchema,
} from './inventory.schemas';

export class InventoryController {
  async list(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const items = await inventoryService.listItems(businessId);
    return res.status(200).json({ data: items });
  }

  async getById(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { id } = req.params;

    const item = await inventoryService.getItemById(businessId, id);
    if (!item) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Inventory item not found',
      });
    }

    return res.status(200).json({ data: item });
  }

  async create(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const userId = req.auth!.userId;
    const parseResult = createInventorySchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const item = await inventoryService.createItem(businessId, parseResult.data, userId);
      return res.status(201).json({ data: item });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        return res.status(409).json({
          code: 'SKU_ALREADY_EXISTS',
          message: 'An item with this SKU already exists in your inventory',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to create inventory item',
      });
    }
  }

  async update(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { id } = req.params;

    // Check if client attempted to send any quantity fields
    if (
      'totalQty' in req.body ||
      'damagedQty' in req.body ||
      'missingQty' in req.body ||
      'maintenanceQty' in req.body
    ) {
      return res.status(400).json({
        code: 'QUANTITY_MUTATION_NOT_ALLOWED',
        message: 'Direct quantity mutation is not allowed. Use the dedicated inventory operation endpoints.',
      });
    }

    const parseResult = updateInventoryMetadataSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const item = await inventoryService.updateMetadata(businessId, id, parseResult.data);
      if (!item) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Inventory item not found',
        });
      }
      return res.status(200).json({ data: item });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        return res.status(409).json({
          code: 'SKU_ALREADY_EXISTS',
          message: 'An item with this SKU already exists in your inventory',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to update inventory item',
      });
    }
  }

  async delete(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { id } = req.params;

    const item = await inventoryService.softDeleteItem(businessId, id);
    if (!item) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Inventory item not found',
      });
    }

    return res.status(200).json({
      message: 'Inventory item soft deleted successfully',
      data: item,
    });
  }

  async adjust(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const userId = req.auth!.userId;
    const { id } = req.params;

    const parseResult = adjustInventorySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const item = await inventoryService.adjustQuantity(businessId, id, parseResult.data, userId);
      if (!item) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Inventory item not found',
        });
      }
      return res.status(200).json({ data: item });
    } catch (error) {
      if (error instanceof Error && error.message === 'INVARIANT_VIOLATION') {
        return res.status(400).json({
          code: 'INVARIANT_VIOLATION',
          message: 'Adjustment would result in total quantity being lower than allocated damaged, missing, and maintenance quantities',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to adjust inventory quantity',
      });
    }
  }

  async damage(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const userId = req.auth!.userId;
    const { id } = req.params;

    const parseResult = recordDamageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const item = await inventoryService.recordDamage(businessId, id, parseResult.data, userId);
      if (!item) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Inventory item not found',
        });
      }
      return res.status(200).json({ data: item });
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_USABLE_STOCK') {
        return res.status(400).json({
          code: 'INSUFFICIENT_USABLE_STOCK',
          message: 'Damage quantity exceeds currently usable inventory',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to record damage',
      });
    }
  }

  async missing(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const userId = req.auth!.userId;
    const { id } = req.params;

    const parseResult = recordMissingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const item = await inventoryService.recordMissing(businessId, id, parseResult.data, userId);
      if (!item) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Inventory item not found',
        });
      }
      return res.status(200).json({ data: item });
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_USABLE_STOCK') {
        return res.status(400).json({
          code: 'INSUFFICIENT_USABLE_STOCK',
          message: 'Missing quantity exceeds currently usable inventory',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to record missing inventory',
      });
    }
  }

  async maintenance(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const userId = req.auth!.userId;
    const { id } = req.params;

    const parseResult = recordMaintenanceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const item = await inventoryService.recordMaintenance(businessId, id, parseResult.data, userId);
      if (!item) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Inventory item not found',
        });
      }
      return res.status(200).json({ data: item });
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_USABLE_STOCK') {
        return res.status(400).json({
          code: 'INSUFFICIENT_USABLE_STOCK',
          message: 'Maintenance quantity exceeds currently usable inventory',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to record maintenance',
      });
    }
  }

  async restoreMaintenance(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const userId = req.auth!.userId;
    const { id } = req.params;

    const parseResult = restoreMaintenanceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const item = await inventoryService.restoreMaintenance(businessId, id, parseResult.data, userId);
      if (!item) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Inventory item not found',
        });
      }
      return res.status(200).json({ data: item });
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_MAINTENANCE_STOCK') {
        return res.status(400).json({
          code: 'INSUFFICIENT_MAINTENANCE_STOCK',
          message: 'Restore quantity exceeds items currently under maintenance',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to restore maintenance inventory',
      });
    }
  }

  async movements(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { id } = req.params;

    const movements = await inventoryService.getMovements(businessId, id);
    if (!movements) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Inventory item not found',
      });
    }

    return res.status(200).json({ data: movements });
  }
}

export const inventoryController = new InventoryController();
