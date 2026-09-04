import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signAccessToken } from '../../lib/jwt';
import { RegisterInput, LoginInput } from './auth.schemas';

export class AuthService {
  async register(input: RegisterInput) {
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: input.businessSlug },
    });

    if (existingBusiness) {
      throw new Error('BUSINESS_SLUG_TAKEN');
    }

    const passwordHash = await hashPassword(input.password);

    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: input.businessName,
          slug: input.businessSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          businessId: business.id,
          email: input.email.toLowerCase(),
          passwordHash,
          role: UserRole.OWNER,
        },
      });

      return { business, user };
    });

    const accessToken = await signAccessToken({
      userId: result.user.id,
      businessId: result.business.id,
      role: result.user.role,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        businessId: result.user.businessId,
      },
      business: {
        id: result.business.id,
        name: result.business.name,
        slug: result.business.slug,
      },
      accessToken,
    };
  }

  async login(input: LoginInput) {
    let user;

    if (input.businessSlug) {
      const business = await prisma.business.findUnique({
        where: { slug: input.businessSlug },
      });

      if (!business) {
        throw new Error('INVALID_CREDENTIALS');
      }

      user = await prisma.user.findUnique({
        where: {
          businessId_email: {
            businessId: business.id,
            email: input.email.toLowerCase(),
          },
        },
        include: { business: true },
      });
    } else {
      const users = await prisma.user.findMany({
        where: { email: input.email.toLowerCase() },
        include: { business: true },
      });

      if (users.length === 0) {
        throw new Error('INVALID_CREDENTIALS');
      }

      if (users.length > 1) {
        throw new Error('AMBIGUOUS_TENANT');
      }

      user = users[0];
    }

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const accessToken = await signAccessToken({
      userId: user.id,
      businessId: user.businessId,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
      business: {
        id: user.business.id,
        name: user.business.name,
        slug: user.business.slug,
      },
      accessToken,
    };
  }
}

export const authService = new AuthService();
