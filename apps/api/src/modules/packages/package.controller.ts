import { Request, Response } from 'express';
import { packageService } from './package.service';
import { createPackageSchema, updatePackageSchema, createVersionSchema } from './package.schemas';

export class PackageController {
  async list(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const packages = await packageService.listPackages(businessId);
    return res.status(200).json({ data: packages });
  }

  async getById(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { id } = req.params;

    const pkg = await packageService.getPackageById(businessId, id);
    if (!pkg) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Package not found',
      });
    }

    return res.status(200).json({ data: pkg });
  }

  async create(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const parseResult = createPackageSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const pkg = await packageService.createPackage(businessId, parseResult.data);
      return res.status(201).json({ data: pkg });
    } catch (error) {
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to create package',
      });
    }
  }

  async update(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { id } = req.params;
    const parseResult = updatePackageSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const pkg = await packageService.updatePackage(businessId, id, parseResult.data);
      if (!pkg) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Package not found',
        });
      }
      return res.status(200).json({ data: pkg });
    } catch (error) {
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to update package',
      });
    }
  }

  async delete(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { id } = req.params;

    const pkg = await packageService.softDeletePackage(businessId, id);
    if (!pkg) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Package not found',
      });
    }

    return res.status(200).json({
      message: 'Package soft deleted successfully',
      data: pkg,
    });
  }

  async createVersion(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { packageId } = req.params;
    const parseResult = createVersionSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const version = await packageService.createVersion(businessId, packageId, parseResult.data);
      if (!version) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Package not found',
        });
      }
      return res.status(201).json({ data: version });
    } catch (error) {
      if (error instanceof Error && error.message === 'INVENTORY_ITEM_NOT_FOUND') {
        // Strict multi-tenancy requirement: return 404 if item does not belong to tenant
        return res.status(404).json({
          code: 'INVENTORY_ITEM_NOT_FOUND',
          message: 'One or more inventory items were not found in this business',
        });
      }
      if (error instanceof Error && error.message === 'DUPLICATE_COMPONENTS') {
        return res.status(400).json({
          code: 'DUPLICATE_COMPONENTS',
          message: 'Duplicate inventory items in package components are not allowed',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to create package version',
      });
    }
  }

  async activateVersion(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { id } = req.params;

    try {
      const version = await packageService.activateVersion(businessId, id);
      if (!version) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Package version not found',
        });
      }
      return res.status(200).json({ data: version });
    } catch (error) {
      if (error instanceof Error && error.message === 'PACKAGE_VERSION_LOCKED') {
        return res.status(400).json({
          code: 'PACKAGE_VERSION_LOCKED',
          message: 'Only DRAFT package versions can be activated',
        });
      }
      if (error instanceof Error && error.message === 'EMPTY_PACKAGE_VERSION') {
        return res.status(400).json({
          code: 'EMPTY_PACKAGE_VERSION',
          message: 'Cannot activate a package version without components',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to activate package version',
      });
    }
  }

  async listVersions(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { id, packageId } = req.params;
    const targetPackageId = packageId || id;

    const versions = await packageService.getPackageVersions(businessId, targetPackageId);
    if (!versions) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Package not found',
      });
    }

    return res.status(200).json({ data: versions });
  }

  async getVersionById(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    const { id } = req.params;

    const version = await packageService.getVersionById(businessId, id);
    if (!version) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Package version not found',
      });
    }

    return res.status(200).json({ data: version });
  }
}

export const packageController = new PackageController();
