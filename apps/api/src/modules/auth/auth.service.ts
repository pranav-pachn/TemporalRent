import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { createSession, deleteSession } from '../../lib/session';
import { exchangeCodeForTokens, verifyGoogleIdToken } from '../../lib/google';
import { WorkspaceSetupInput } from './auth.schemas';
import crypto from 'crypto';

export class AuthService {
  async generateOAuthState() {
    return crypto.randomBytes(16).toString('hex');
  }

  async handleGoogleCallback(code: string) {
    // 1. Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.id_token) {
      throw new Error('No ID token returned from Google');
    }

    // 2. Verify Google ID token
    const profile = await verifyGoogleIdToken(tokens.id_token);

    // 3. Find OAuth Account
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'GOOGLE',
          providerAccountId: profile.sub,
        },
      },
      include: {
        user: true,
      },
    });

    let user = oauthAccount?.user;
    let isNewUser = false;

    // 4. Create User & OAuth Account if not found
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.picture,
          role: UserRole.SALES,
          // businessId remains null
        },
      });

      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'GOOGLE',
          providerAccountId: profile.sub,
        },
      });
    }

    // 5. Create Session
    const session = await createSession(user.id, user.businessId);

    // 6. Find Business (if any)
    const business = user.businessId 
      ? await prisma.business.findUnique({ where: { id: user.businessId } })
      : null;

    return {
      session,
      user,
      business,
      isNewUser,
    };
  }

  async setupWorkspace(userId: string, input: WorkspaceSetupInput) {
    let slug = input.businessName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) slug = 'workspace';

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!currentUser) {
      throw new Error('USER_NOT_FOUND');
    }

    // Check if slug exists
    const existingBusiness = await prisma.business.findUnique({
      where: { slug },
    });

    if (existingBusiness && currentUser.businessId === existingBusiness.id) {
      const result = await prisma.$transaction(async (tx) => {
        const business = await tx.business.update({
          where: { id: existingBusiness.id },
          data: {
            name: input.businessName,
            timezone: input.timezone,
          },
        });

        const user = await tx.user.update({
          where: { id: userId },
          data: {
            role: UserRole.OWNER,
            ...(input.name ? { name: input.name } : {}),
          },
        });

        await tx.session.updateMany({
          where: { userId },
          data: { businessId: business.id },
        });

        return { business, user };
      });

      return result;
    }

    if (existingBusiness) {
      // Slug taken by another business: generate a unique slug
      let suffix = 1;
      let candidateSlug = `${slug}-${suffix}`;
      while (await prisma.business.findUnique({ where: { slug: candidateSlug } })) {
        suffix++;
        candidateSlug = `${slug}-${suffix}`;
      }
      slug = candidateSlug;
    }

    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: input.businessName,
          slug,
          timezone: input.timezone,
        },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: {
          businessId: business.id,
          role: UserRole.OWNER,
          ...(input.name ? { name: input.name } : {}),
        },
      });

      // Update all user's sessions to include the businessId
      await tx.session.updateMany({
        where: { userId },
        data: { businessId: business.id },
      });

      return { business, user };
    });

    return result;
  }

  async logout(token: string) {
    await deleteSession(token);
  }
}

export const authService = new AuthService();
