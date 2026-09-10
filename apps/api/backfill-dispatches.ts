import { PrismaClient } from '@prisma/client';
import { DispatchService } from './src/modules/dispatch/dispatch.service';

const prisma = new PrismaClient();
const dispatchService = new DispatchService();

async function backfill() {
  console.log('Starting backfill for confirmed bookings without dispatches...');
  
  // Find all CONFIRMED bookings that don't have a corresponding dispatch record
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      dispatch: null 
    },
    include: {
      createdByUser: true // we need a userId
    }
  });

  if (bookings.length === 0) {
    console.log('No CONFIRMED bookings found without a dispatch. Everything is up to date.');
    return;
  }

  console.log(`Found ${bookings.length} confirmed bookings without a dispatch. Fixing...`);

  for (const booking of bookings) {
    try {
      await dispatchService.prepareDispatch(booking.businessId, booking.id, booking.createdByUser?.id || 'system');
      console.log(`✅ Successfully generated dispatch for booking: ${booking.id}`);
    } catch (e: any) {
      console.error(`❌ Failed to generate dispatch for booking: ${booking.id}`, e.message);
    }
  }

  console.log('Backfill complete!');
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
