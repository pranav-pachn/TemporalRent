import { PrismaClient } from '@prisma/client';
import { addDays, subDays, startOfDay, addHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with realistic dashboard data...');

  // Clean up previous seed in correct foreign-key dependency order
  await prisma.auditEvent.deleteMany({});
  await prisma.damageReport.deleteMany({});
  await prisma.returnLine.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.dispatchLine.deleteMany({});
  await prisma.dispatch.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.inventoryReservation.deleteMany({});
  await prisma.bookingItemDemand.deleteMany({});
  await prisma.bookingLine.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.packageComponent.deleteMany({});
  await prisma.packageVersion.deleteMany({});
  await prisma.package.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.business.deleteMany({});

  // 1. Create Business
  const business = await prisma.business.create({
    data: {
      name: 'Acme Event Rentals',
      slug: 'acme-events',
      timezone: 'America/New_York',
      defaultBufferBeforeMinutes: 120,
      defaultBufferAfterMinutes: 720,
    },
  });

  // 2. Create User
  const user = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'admin@acme.com',
      passwordHash: 'hashed-password',
      role: 'OWNER',
    },
  });

  // 3. Create Customers
  const customer1 = await prisma.customer.create({ data: { businessId: business.id, name: 'Stark Industries' } });
  const customer2 = await prisma.customer.create({ data: { businessId: business.id, name: 'Wayne Enterprises' } });

  // 4. Create Categories & Inventory
  const catAudio = await prisma.category.create({ data: { businessId: business.id, name: 'Audio Equipment' } });
  const catLighting = await prisma.category.create({ data: { businessId: business.id, name: 'Lighting' } });

  const speakers = await prisma.inventoryItem.create({
    data: { businessId: business.id, categoryId: catAudio.id, name: 'QSC K12.2 Speakers', totalQty: 10, sku: 'QSC-K12' }
  });
  const mics = await prisma.inventoryItem.create({
    data: { businessId: business.id, categoryId: catAudio.id, name: 'Shure SM58 Microphones', totalQty: 20, sku: 'SHR-SM58' }
  });
  const lights = await prisma.inventoryItem.create({
    data: { businessId: business.id, categoryId: catLighting.id, name: 'Chauvet Wash Lights', totalQty: 8, sku: 'CHV-WASH', damagedQty: 2 }
  });

  // 5. Create Bookings & Reservations
  const today = new Date();
  const todayEnd = addDays(today, 2);
  const b1Id = crypto.randomUUID();
  
  // Booking 1: Dispatching today
  await prisma.$executeRaw`
    INSERT INTO "bookings" ("id", "businessId", "customerId", "createdByUserId", "eventName", "status", "eventStart", "eventEnd", "period", "createdAt", "updatedAt")
    VALUES (${b1Id}, ${business.id}, ${customer1.id}, ${user.id}, 'Stark Gala', 'CONFIRMED', ${today}, ${todayEnd}, tstzrange(${today.toISOString()}::timestamptz, ${todayEnd.toISOString()}::timestamptz, '[)'), NOW(), NOW())
  `;

  await prisma.bookingLine.create({
    data: { bookingId: b1Id, type: 'INVENTORY_ITEM', inventoryItemId: speakers.id, quantity: 4 }
  });
  
  const b1ResStart = new Date(today.getTime() - 120 * 60000);
  const b1ResEnd = new Date(todayEnd.getTime() + 720 * 60000);
  
  await prisma.$executeRaw`
    INSERT INTO "inventory_reservations" ("id", "businessId", "inventoryItemId", "bookingId", "quantity", "period", "status", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${business.id}, ${speakers.id}, ${b1Id}, 4, tstzrange(${b1ResStart.toISOString()}::timestamptz, ${b1ResEnd.toISOString()}::timestamptz, '[)'), 'ACTIVE', NOW(), NOW())
  `;

  // Booking 2: Returning today
  const b2Start = subDays(today, 3);
  const b2Id = crypto.randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "bookings" ("id", "businessId", "customerId", "createdByUserId", "eventName", "status", "eventStart", "eventEnd", "period", "createdAt", "updatedAt")
    VALUES (${b2Id}, ${business.id}, ${customer2.id}, ${user.id}, 'Wayne Charity', 'CONFIRMED', ${b2Start}, ${today}, tstzrange(${b2Start.toISOString()}::timestamptz, ${today.toISOString()}::timestamptz, '[)'), NOW(), NOW())
  `;

  await prisma.bookingLine.create({
    data: { bookingId: b2Id, type: 'INVENTORY_ITEM', inventoryItemId: lights.id, quantity: 6 }
  });

  const b2ResStart = new Date(b2Start.getTime() - 120 * 60000);
  const b2ResEnd = new Date(today.getTime() + 720 * 60000);

  await prisma.$executeRaw`
    INSERT INTO "inventory_reservations" ("id", "businessId", "inventoryItemId", "bookingId", "quantity", "period", "status", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${business.id}, ${lights.id}, ${b2Id}, 6, tstzrange(${b2ResStart.toISOString()}::timestamptz, ${b2ResEnd.toISOString()}::timestamptz, '[)'), 'ACTIVE', NOW(), NOW())
  `;

  // Booking 3: Upcoming (Tomorrow)
  const b3Start = addDays(today, 1);
  const b3End = addHours(b3Start, 4);
  const b3Id = crypto.randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "bookings" ("id", "businessId", "customerId", "createdByUserId", "eventName", "status", "eventStart", "eventEnd", "period", "createdAt", "updatedAt")
    VALUES (${b3Id}, ${business.id}, ${customer1.id}, ${user.id}, 'Stark Press Conference', 'CONFIRMED', ${b3Start}, ${b3End}, tstzrange(${b3Start.toISOString()}::timestamptz, ${b3End.toISOString()}::timestamptz, '[)'), NOW(), NOW())
  `;

  const b3ResStart = new Date(b3Start.getTime() - 120 * 60000);
  const b3ResEnd = new Date(b3End.getTime() + 720 * 60000);

  const { createSession } = await import('../src/lib/session');
  const session = await createSession(user.id, business.id);

  console.log('--- SEED SUCCESS ---');
  console.log(`\n\n=== DEV SESSION TOKEN (HTTP-only cookie / Bearer) ===`);
  console.log(session.token);
  console.log(`\n======================================================\n\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
