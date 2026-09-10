import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

describe('Auth & Dashboard Integration Flow', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('verifies 401 without auth, dev-login sets HttpOnly cookie, and authenticated GET /dashboard returns 200 with real DB data', async () => {
    // 1. Calling /api/v1/dashboard without authentication MUST fail with 401 UNAUTHENTICATED
    const unauthRes = await request(app).get('/api/v1/dashboard');
    expect(unauthRes.status).toBe(401);
    expect(unauthRes.body.code).toBe('UNAUTHENTICATED');
    expect(unauthRes.body.message).toBe('Authentication token required');

    // 2. Perform dev-login
    const loginRes = await request(app).post('/api/v1/auth/dev-login').send();
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user).toBeDefined();
    expect(loginRes.body.user.email).toBe('admin@acme.com');
    expect(loginRes.body.business).toBeDefined();
    // Rule #2: Raw token should not be exposed in the response body
    expect(loginRes.body.token).toBeUndefined();

    // Verify tr_session cookie is set as HttpOnly
    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookieStr = (cookies as unknown as string[]).find((c: string) => c.startsWith('tr_session='));
    expect(sessionCookieStr).toBeDefined();
    expect(sessionCookieStr).toContain('HttpOnly');

    // Extract cookie value for request
    const cookieValue = sessionCookieStr!.split(';')[0];

    // 3. Request /api/v1/dashboard with the session cookie
    const dashboardRes = await request(app)
      .get('/api/v1/dashboard')
      .set('Cookie', cookieValue);

    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body).toHaveProperty('today');
    expect(dashboardRes.body).toHaveProperty('inventoryAlerts');
    expect(dashboardRes.body).toHaveProperty('todayDispatches');
    expect(dashboardRes.body).toHaveProperty('todayReturns');
    expect(dashboardRes.body).toHaveProperty('upcomingBookings');
    expect(dashboardRes.body).toHaveProperty('user');
    expect(Array.isArray(dashboardRes.body.inventoryAlerts)).toBe(true);
    expect(Array.isArray(dashboardRes.body.todayDispatches)).toBe(true);
    expect(Array.isArray(dashboardRes.body.todayReturns)).toBe(true);
    expect(Array.isArray(dashboardRes.body.upcomingBookings)).toBe(true);
  });

  it('verifies workspace setup updates workspace details and reflects on GET /dashboard', async () => {
    // 1. Dev login
    const loginRes = await request(app).post('/api/v1/auth/dev-login').send();
    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers['set-cookie'];
    const sessionCookieStr = (cookies as unknown as string[]).find((c: string) => c.startsWith('tr_session='));
    const cookieValue = sessionCookieStr!.split(';')[0];

    // 2. Perform workspace setup with "Royal Events & Decor", "Pranav", "Asia/Kolkata"
    const setupRes = await request(app)
      .post('/api/v1/auth/workspace-setup')
      .set('Cookie', cookieValue)
      .send({
        businessName: 'Royal Events & Decor',
        name: 'Pranav',
        timezone: 'Asia/Kolkata',
      });

    expect(setupRes.status).toBe(200);
    expect(setupRes.body.business.name).toBe('Royal Events & Decor');
    expect(setupRes.body.user.name).toBe('Pranav');

    // 3. Query /api/v1/dashboard and verify the workspace details are directly reflected
    const dashboardRes = await request(app)
      .get('/api/v1/dashboard')
      .set('Cookie', cookieValue);

    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body.user.name).toBe('Pranav');
    expect(dashboardRes.body.business.name).toBe('Royal Events & Decor');
    expect(dashboardRes.body.business.timezone).toBe('Asia/Kolkata');
  });

  it('creates and lists customers within the business', async () => {
    const loginRes = await request(app).post('/api/v1/auth/dev-login').send();
    const cookies = loginRes.headers['set-cookie'];
    const sessionCookieStr = (cookies as unknown as string[]).find((c: string) => c.startsWith('tr_session='));
    const cookieValue = sessionCookieStr!.split(';')[0];

    const createRes = await request(app)
      .post('/api/v1/customers')
      .set('Cookie', cookieValue)
      .send({
        name: 'Sharma Weddings',
        email: 'sharma@example.com',
        phone: '+91 98765 43210',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Sharma Weddings');
    expect(createRes.body.data.email).toBe('sharma@example.com');

    const listRes = await request(app)
      .get('/api/v1/customers')
      .set('Cookie', cookieValue);

    expect(listRes.status).toBe(200);
    const found = listRes.body.data.find((c: any) => c.id === createRes.body.data.id);
    expect(found).toBeDefined();
    expect(found.name).toBe('Sharma Weddings');
  });
});
