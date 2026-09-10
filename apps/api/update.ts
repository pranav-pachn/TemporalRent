import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`
    UPDATE "businesses"
    SET "defaultBufferBeforeMinutes" = 120, "defaultBufferAfterMinutes" = 720
    WHERE "defaultBufferBeforeMinutes" = 0 AND "defaultBufferAfterMinutes" = 0;
  `;
  console.log('Updated businesses');
}

main().catch(console.error).finally(() => prisma.$disconnect());
