import { prisma } from '../../lib/prisma';
import { PackageExpansionService } from '../package-expansion/package-expansion.service';
import { BookingLineInput } from '../package-expansion/package-expansion.types';
import { AvailabilityResult, AvailabilityItemResult } from './availability.types';
import { ApiError } from '../../lib/errors';
import { AvailabilityRepository, CandidateItemWindow } from './availability.repository';

export class AvailabilityService {
  private expansionService: PackageExpansionService;
  private availabilityRepository: AvailabilityRepository;

  constructor() {
    this.expansionService = new PackageExpansionService();
    this.availabilityRepository = new AvailabilityRepository();
  }

  async checkAvailability(
    businessId: string,
    lines: BookingLineInput[],
    eventStart: string,
    eventEnd: string
  ): Promise<AvailabilityResult> {
    // 1. Aggregate Demand
    const demands = await this.expansionService.aggregateDemand(lines, businessId);

    if (demands.length === 0) {
      return { available: true, items: [] };
    }

    const itemIds = demands.map((d) => d.inventoryItemId);

    // 2. Load Items with Buffers
    const items = await prisma.inventoryItem.findMany({
      where: {
        id: { in: itemIds },
        businessId,
      },
      include: {
        category: true,
        business: true,
      },
    });

    if (items.length !== itemIds.length) {
      throw new ApiError(404, 'INVENTORY_ITEM_NOT_FOUND', 'Some inventory items could not be found');
    }

    // 3. Resolve buffers and build effective periods
    const baseStart = new Date(eventStart);
    const baseEnd = new Date(eventEnd);

    const itemWindows = items.map((item) => {
      const bufferBefore =
        item.bufferBeforeMinutes ??
        item.category?.bufferBeforeMinutes ??
        item.business.defaultBufferBeforeMinutes;

      const bufferAfter =
        item.bufferAfterMinutes ??
        item.category?.bufferAfterMinutes ??
        item.business.defaultBufferAfterMinutes;

      const effectiveStart = new Date(baseStart.getTime() - bufferBefore * 60000);
      const effectiveEnd = new Date(baseEnd.getTime() + bufferAfter * 60000);

      const usable = item.totalQty - (item.damagedQty + item.missingQty + item.maintenanceQty);

      return {
        item,
        effectiveStart,
        effectiveEnd,
        usable,
      };
    });

    // 4. Batch overlap query via Repository
    const candidates: CandidateItemWindow[] = itemWindows.map(w => ({
      inventoryItemId: w.item.id,
      effectiveStart: w.effectiveStart,
      effectiveEnd: w.effectiveEnd,
    }));

    const reservations = await this.availabilityRepository.findOverlappingReservations(
      businessId,
      candidates
    );

    const reservedMap = new Map<string, number>();
    for (const res of reservations) {
      reservedMap.set(res.inventoryItemId, res.reservedQuantity);
    }

    // 5. Calculate capacity per item
    let allAvailable = true;
    const resultItems: AvailabilityItemResult[] = [];

    for (const w of itemWindows) {
      const demand = demands.find((d) => d.inventoryItemId === w.item.id)!;
      const reserved = reservedMap.get(w.item.id) || 0;
      const available = Math.max(0, w.usable - reserved);
      const shortage = Math.max(0, demand.quantity - available);

      if (shortage > 0) {
        allAvailable = false;
      }

      resultItems.push({
        inventoryItemId: w.item.id,
        required: demand.quantity,
        usable: w.usable,
        reserved,
        available,
        shortage,
        period: {
          start: w.effectiveStart.toISOString(),
          end: w.effectiveEnd.toISOString(),
        },
      });
    }

    // 6. Phase 10: Fetch Conflict Explanations for Shortage Items ONLY
    const conflicts: any[] = [];
    const shortageItems = resultItems.filter(i => i.shortage > 0);

    if (shortageItems.length > 0) {
      const shortageCandidates = candidates.filter(c => 
        shortageItems.some(si => si.inventoryItemId === c.inventoryItemId)
      );

      const overlapDetails = await this.availabilityRepository.findOverlappingReservationDetails(
        businessId,
        shortageCandidates
      );

      for (const detail of overlapDetails) {
        conflicts.push({
          reservationId: detail.id,
          bookingId: detail.bookingId,
          inventoryItemId: detail.inventoryItemId,
          inventoryItemName: detail.inventoryItemName,
          eventName: detail.eventName,
          quantity: detail.quantity,
          effectiveStart: detail.effectiveStart.toISOString(),
          effectiveEnd: detail.effectiveEnd.toISOString(),
        });
      }
    }

    return {
      available: allAvailable,
      items: resultItems,
      conflicts,
      warnings: [],
    };
  }
}
