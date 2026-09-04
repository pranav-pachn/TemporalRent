import { PackageVersionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { CreatePackageInput, UpdatePackageInput, CreateVersionInput } from './package.schemas';

export class PackageService {
  async listPackages(businessId: string) {
    return prisma.package.findMany({
      where: {
        businessId,
        deletedAt: null,
      },
      include: {
        packageVersions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            packageComponents: {
              include: {
                inventoryItem: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    totalQty: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPackageById(businessId: string, id: string) {
    return prisma.package.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
      include: {
        packageVersions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            packageComponents: {
              include: {
                inventoryItem: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    totalQty: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createPackage(businessId: string, data: CreatePackageInput) {
    return prisma.package.create({
      data: {
        businessId,
        name: data.name,
        description: data.description,
      },
    });
  }

  async updatePackage(businessId: string, id: string, data: UpdatePackageInput) {
    const pkg = await prisma.package.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
    });

    if (!pkg) {
      return null;
    }

    return prisma.package.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async softDeletePackage(businessId: string, id: string) {
    const pkg = await prisma.package.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
    });

    if (!pkg) {
      return null;
    }

    // Soft delete package entity; versions and components remain preserved for audit/history
    return prisma.package.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async createVersion(businessId: string, packageId: string, data: CreateVersionInput) {
    return prisma.$transaction(async (tx) => {
      // Verify parent package exists in tenant and is not deleted
      const pkg = await tx.package.findFirst({
        where: {
          id: packageId,
          businessId,
          deletedAt: null,
        },
      });

      if (!pkg) {
        return null;
      }

      // Check for duplicate item IDs within the submitted components
      const itemIds = data.components.map((c) => c.inventoryItemId);
      const uniqueItemIds = new Set(itemIds);
      if (uniqueItemIds.size !== itemIds.length) {
        throw new Error('DUPLICATE_COMPONENTS');
      }

      // Verify that every inventory item belongs to this tenant and is not soft deleted
      const inventoryItems = await tx.inventoryItem.findMany({
        where: {
          id: { in: itemIds },
          businessId,
          deletedAt: null,
        },
      });

      if (inventoryItems.length !== itemIds.length) {
        // Multi-tenancy guard: If any item belongs to another tenant or doesn't exist, reject
        throw new Error('INVENTORY_ITEM_NOT_FOUND');
      }

      // Compute next version number atomically
      const latestVersion = await tx.packageVersion.findFirst({
        where: { packageId },
        orderBy: { versionNumber: 'desc' },
      });

      const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

      // Create new DRAFT version
      const version = await tx.packageVersion.create({
        data: {
          businessId,
          packageId,
          versionNumber: nextVersionNumber,
          status: PackageVersionStatus.DRAFT,
          packageComponents: {
            create: data.components.map((c) => ({
              businessId,
              inventoryItemId: c.inventoryItemId,
              quantity: c.quantity,
            })),
          },
        },
        include: {
          packageComponents: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  totalQty: true,
                },
              },
            },
          },
        },
      });

      return version;
    });
  }

  async activateVersion(businessId: string, versionId: string) {
    return prisma.$transaction(async (tx) => {
      const version = await tx.packageVersion.findFirst({
        where: {
          id: versionId,
          businessId,
        },
        include: {
          packageComponents: true,
        },
      });

      if (!version) {
        return null;
      }

      if (version.status !== PackageVersionStatus.DRAFT) {
        throw new Error('PACKAGE_VERSION_LOCKED');
      }

      if (version.packageComponents.length === 0) {
        throw new Error('EMPTY_PACKAGE_VERSION');
      }

      // Archive any currently active version for this package
      await tx.packageVersion.updateMany({
        where: {
          packageId: version.packageId,
          businessId,
          status: PackageVersionStatus.ACTIVE,
        },
        data: {
          status: PackageVersionStatus.ARCHIVED,
        },
      });

      // Activate target version
      const activated = await tx.packageVersion.update({
        where: { id: versionId },
        data: {
          status: PackageVersionStatus.ACTIVE,
        },
        include: {
          packageComponents: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      });

      return activated;
    });
  }

  async getPackageVersions(businessId: string, packageId: string) {
    const pkg = await prisma.package.findFirst({
      where: {
        id: packageId,
        businessId,
        deletedAt: null,
      },
    });

    if (!pkg) {
      return null;
    }

    return prisma.packageVersion.findMany({
      where: {
        packageId,
        businessId,
      },
      include: {
        packageComponents: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                totalQty: true,
              },
            },
          },
        },
      },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async getVersionById(businessId: string, versionId: string) {
    return prisma.packageVersion.findFirst({
      where: {
        id: versionId,
        businessId,
      },
      include: {
        package: true,
        packageComponents: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                totalQty: true,
              },
            },
          },
        },
      },
    });
  }
}

export const packageService = new PackageService();
