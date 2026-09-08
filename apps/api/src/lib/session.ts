import { randomBytes, createHash } from 'crypto';
import { prisma } from './prisma';

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId: string, businessId: string | null) {
  // Generate random token
  const token = randomBytes(32).toString('hex');
  
  // Hash token for database storage
  const tokenHash = createHash('sha256').update(token).digest('hex');
  
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  
  await prisma.session.create({
    data: {
      userId,
      businessId,
      tokenHash,
      expiresAt,
    },
  });
  
  return { token, expiresAt };
}

export async function validateSession(token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  
  if (!session) {
    return null;
  }
  
  if (Date.now() >= session.expiresAt.getTime()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  
  return session;
}

export async function deleteSession(token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  
  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}
