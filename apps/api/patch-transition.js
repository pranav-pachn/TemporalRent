const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/modules/bookings/bookings.service.ts');
let code = fs.readFileSync(filePath, 'utf-8');

const injectionPoint = `      // 2. Update booking status
      await tx.$executeRaw\`
        UPDATE "bookings"
        SET "status" = \${targetStatus}::"BookingStatus", "updatedAt" = NOW()
        WHERE "id" = \${bookingId}
      \`;`;

const newCode = `      // If transitioning to CONFIRMED, create reservations
      if (targetStatus === 'CONFIRMED' && (currentStatus === 'DRAFT' || currentStatus === 'QUOTED')) {
        const reservationsRepo = new ReservationsRepository();
        const availabilityRepo = new AvailabilityRepository();
        const expansionService = new PackageExpansionService();
        
        // Expand demand
        const bookingLines = await tx.bookingLine.findMany({ where: { bookingId } });
        const mappedLines = bookingLines.map((line) => ({
          type: line.type as any,
          packageVersionId: line.packageVersionId || undefined,
          inventoryItemId: line.inventoryItemId || undefined,
          quantity: line.quantity,
        }));
        
        const demands = await expansionService.aggregateDemand(mappedLines, businessId);
        const newDemandItems = demands.map(d => ({ inventoryItemId: d.inventoryItemId, quantity: d.quantity }));
        
        const affectedItemIds = Array.from(new Set(newDemandItems.map(d => d.inventoryItemId))).sort();
        const lockedRows = await reservationsRepo.lockInventoryItems(tx, businessId, affectedItemIds);
        const lockedMap = new Map(lockedRows.map(r => [r.id, r]));
        
        const baseStart = new Date(booking.eventStart);
        const baseEnd = new Date(booking.eventEnd);
        const candidates = [];
        
        if (affectedItemIds.length > 0) {
          const itemsData = await tx.inventoryItem.findMany({
            where: { id: { in: affectedItemIds }, businessId },
            include: { category: true, business: true },
          });

          for (const item of itemsData) {
            const bufferBefore = item.bufferBeforeMinutes ?? item.category?.bufferBeforeMinutes ?? item.business.defaultBufferBeforeMinutes;
            const bufferAfter = item.bufferAfterMinutes ?? item.category?.bufferAfterMinutes ?? item.business.defaultBufferAfterMinutes;

            candidates.push({
              inventoryItemId: item.id,
              effectiveStart: new Date(baseStart.getTime() - bufferBefore * 60000),
              effectiveEnd: new Date(baseEnd.getTime() + bufferAfter * 60000),
            });
          }
        }
        
        const reservedResults = await reservationsRepo.findOverlappingReservationsTx(tx, businessId, candidates, bookingId);
        const reservedMap = new Map(reservedResults.map(r => [r.inventoryItemId, r.reservedQuantity]));
        
        let shortageCandidates = [];
        let inventoryConflictItems = [];

        for (const candidate of candidates) {
          const demand = demands.find(d => d.inventoryItemId === candidate.inventoryItemId);
          const lockedItem = lockedMap.get(candidate.inventoryItemId);
          
          const usable = lockedItem.totalQty - (lockedItem.damagedQty + lockedItem.missingQty + lockedItem.maintenanceQty);
          const reserved = reservedMap.get(candidate.inventoryItemId) || 0;
          const available = Math.max(0, usable - reserved);

          if (available < demand.quantity) {
            shortageCandidates.push(candidate);
            inventoryConflictItems.push({
              inventoryItemId: candidate.inventoryItemId,
              inventoryItemName: lockedItem.name,
              requiredQty: demand.quantity,
              usableQty: usable,
              reservedQty: reserved,
              availableQty: usable - reserved,
              shortageQty: Math.max(0, demand.quantity - Math.max(0, usable - reserved)),
              period: {
                start: candidate.effectiveStart.toISOString(),
                end: candidate.effectiveEnd.toISOString(),
              },
              required: demand.quantity,
              usable,
              reserved,
              available: Math.max(0, usable - reserved),
              shortage: Math.max(0, demand.quantity - Math.max(0, usable - reserved)),
            });
          }
        }
        
        if (inventoryConflictItems.length > 0) {
          const apiError: any = new ApiError(409, 'INVENTORY_CONFLICT', 'Booking cannot be confirmed due to inventory shortages.');
          const conflictDetails = await availabilityRepo.findOverlappingReservationDetails(businessId, shortageCandidates, bookingId);
          
          const conflictsList = inventoryConflictItems.map(item => {
            const itemConflicts = conflictDetails
              .filter(d => d.inventoryItemId === item.inventoryItemId)
              .map(detail => ({
                reservationId: detail.id,
                bookingId: detail.bookingId,
                bookingName: detail.eventName || 'Untitled Booking',
                eventName: detail.eventName,
                start: detail.effectiveStart.toISOString(),
                end: detail.effectiveEnd.toISOString(),
                quantity: detail.quantity,
              }));
            return {
              ...item,
              conflictingReservations: itemConflicts,
            };
          });

          apiError.items = inventoryConflictItems;
          apiError.conflicts = conflictsList;
          throw apiError;
        }
        
        // Delete old demands just in case
        await tx.bookingItemDemand.deleteMany({ where: { bookingId } });

        for (const candidate of candidates) {
          const demand = demands.find(d => d.inventoryItemId === candidate.inventoryItemId);
          
          const newDemand = await tx.bookingItemDemand.create({
            data: {
              businessId,
              bookingId,
              inventoryItemId: candidate.inventoryItemId,
              quantityDemanded: demand.quantity,
              quantity: demand.quantity,
            }
          });

          await tx.$executeRaw\`
            INSERT INTO "inventory_reservations" (
              "id", "businessId", "inventoryItemId", "bookingId", "bookingItemDemandId", "quantity", "period", "status", "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid()::text,
              \${businessId},
              \${candidate.inventoryItemId},
              \${bookingId},
              \${newDemand.id},
              \${demand.quantity},
              tstzrange(
                \${candidate.effectiveStart.toISOString()}::timestamptz,
                \${candidate.effectiveEnd.toISOString()}::timestamptz,
                '[)'
              ),
              'ACTIVE',
              NOW(),
              NOW()
            )
          \`;
        }
      }

      // 2. Update booking status
      await tx.$executeRaw\`
        UPDATE "bookings"
        SET "status" = \${targetStatus}::"BookingStatus", "updatedAt" = NOW()
        WHERE "id" = \${bookingId}
      \`;`;

code = code.replace(injectionPoint, newCode);
fs.writeFileSync(filePath, code);
console.log('Patched transitionBooking');
