import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

async function main() {
  console.log('Seeding database with realistic dashboard data...');

  // Clean up previous seed
  await prisma.auditEvent.deleteMany({});
  await prisma.inventoryReservation.deleteMany({});
  await prisma.bookingItemDemand.deleteMany({});
  await prisma.bookingLine.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.business.deleteMany({});

  // 1. Create Business
  const business = await prisma.business.create({
    data: {
      name: 'Acme Event Rentals',
      slug: 'acme-events',
      timezone: 'America/New_York',
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
    data: { businessId: business.id, categoryId: catLighting.id, name: 'Chauvet Wash Lights', totalQty: 8, sku: 'CHV-WASH', damagedQty: 2 } // Missing/damaged lights to trigger alerts!
  });

  // 5. Create Bookings & Reservations
  const today = new Date();
  
  // Booking 1: Dispatching today
  const b1 = await prisma.booking.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      createdByUserId: user.id,
      eventName: 'Stark Gala',
      status: 'CONFIRMED',
      eventStart: today, // Starts today
      eventEnd: addDays(today, 2),
      period: `[${today.toISOString()}, ${addDays(today, 2).toISOString()})` as any,
    }
  });

  await prisma.bookingLine.create({
    data: { bookingId: b1.id, type: 'ITEM', inventoryItemId: speakers.id, quantity: 4, name: 'Speakers' }
  });
  
  // Directly insert reservation for dashboard read projection
  await prisma.$executeRaw`
    INSERT INTO "inventory_reservations" ("id", "businessId", "inventoryItemId", "bookingId", "quantity", "period", "status", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${business.id}, ${speakers.id}, ${b1.id}, 4, tstzrange(${today.toISOString()}::timestamptz, ${addDays(today, 2).toISOString()}::timestamptz, '[)'), 'ACTIVE', NOW(), NOW())
  `;

  // Booking 2: Returning today
  const b2 = await prisma.booking.create({
    data: {
      businessId: business.id,
      customerId: customer2.id,
      createdByUserId: user.id,
      eventName: 'Wayne Charity',
      status: 'CONFIRMED', // Make it COMPLETED or DISPATCHED to show returns today if needed, let's keep CONFIRMED but ending today
      eventStart: subDays(today, 3), // Started 3 days ago
      eventEnd: today, // Ends today
      period: `[${subDays(today, 3).toISOString()}, ${today.toISOString()})` as any,
    }
  });

  await prisma.bookingLine.create({
    data: { bookingId: b2.id, type: 'ITEM', inventoryItemId: lights.id, quantity: 6, name: 'Lights' }
  });

  await prisma.$executeRaw`
    INSERT INTO "inventory_reservations" ("id", "businessId", "inventoryItemId", "bookingId", "quantity", "period", "status", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${business.id}, ${lights.id}, ${b2.id}, 6, tstzrange(${subDays(today, 3).toISOString()}::timestamptz, ${today.toISOString()}::timestamptz, '[)'), 'ACTIVE', NOW(), NOW())
  `;

  // Booking 3: Upcoming (Tomorrow)
  const b3 = await prisma.booking.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      createdByUserId: user.id,
      eventName: 'Stark Press Conference',
      status: 'CONFIRMED',
      eventStart: addDays(today, 1),
      eventEnd: addDays(today, 2),
      period: `[${addDays(today, 1).toISOString()}, ${addDays(today, 2).toISOString()})` as any,
    }
  });

  console.log('--- SEED SUCCESS ---');
  
  const token = jwt.sign(
    { userId: user.id, businessId: business.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  console.log(`\n\n=== DEV JWT TOKEN ===`);
  console.log(`\nPlease copy this token and use it in your frontend!\n`);
  console.log(token);
  console.log(`\n=====================\n\n`);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
