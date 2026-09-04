import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'temporalrent-super-secret-key-that-is-at-least-32-chars!';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  businessId: string;
  role: UserRole;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({
    businessId: payload.businessId,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secretKey);
  return {
    userId: payload.sub as string,
    businessId: payload.businessId as string,
    role: payload.role as UserRole,
  };
}
