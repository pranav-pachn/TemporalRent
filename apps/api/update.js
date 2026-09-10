const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { await prisma.\\UPDATE \\
Business\\ SET \\defaultBufferBeforeMinutes\\ = 120, \\defaultBufferAfterMinutes\\ = 720 WHERE \\defaultBufferBeforeMinutes\\ = 0 AND \\defaultBufferAfterMinutes\\ = 0\; console.log('Updated'); } main().catch(console.error).finally(() => prisma.\());
