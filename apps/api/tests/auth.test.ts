import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

describe('Auth Module: Registration & Login', () => {
  const timestamp = Date.now();
  const slug = `auth-test-${timestamp}`;
  const email = `test-${timestamp}@temporalrent.io`;
  const password = 'StrongPassword123!';

  afterAll(async () => {
    const biz = await prisma.business.findUnique({ where: { slug } });
    if (biz) {
      await prisma.business.delete({ where: { id: biz.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('registers a new business and creates an OWNER user', async () => {
    const res = await request(app).post('/auth/register').send({
      businessName: 'Auth Test Company',
      businessSlug: slug,
      email,
      password,
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('OWNER');
    expect(res.body.business.slug).toBe(slug);
    expect(res.body.accessToken).toBeDefined();
  });

  it('prevents registering with an existing business slug', async () => {
    const res = await request(app).post('/auth/register').send({
      businessName: 'Duplicate Slug Company',
      businessSlug: slug,
      email: `other-${timestamp}@temporalrent.io`,
      password,
    });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('BUSINESS_SLUG_TAKEN');
  });

  it('successfully logs in with valid credentials', async () => {
    const res = await request(app).post('/auth/login').send({
      email,
      password,
      businessSlug: slug,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects login with an invalid password', async () => {
    const res = await request(app).post('/auth/login').send({
      email,
      password: 'WrongPassword!',
      businessSlug: slug,
    });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});
