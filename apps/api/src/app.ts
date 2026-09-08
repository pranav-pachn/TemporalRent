import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { authRouter } from './modules/auth/auth.routes';
import { inventoryRouter } from './modules/inventory/inventory.routes';

import { packageRouter, packageVersionRouter } from './modules/packages/package.routes';
import { availabilityRouter } from './modules/availability/availability.routes';
import { bookingsRouter } from './modules/bookings/bookings.routes';
import { auditRouter } from './modules/audit/audit.routes';
import dispatchRouter from './modules/dispatch/dispatch.routes';
import dispatchesRouter from './modules/dispatch/dispatches.routes';
import returnRouter from './modules/returns/returns.routes';
import returnsListRouter from './modules/returns/returns.list.routes';
import { damageReportsRouter } from './modules/damage/damage-reports.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import { customersRouter } from './modules/customers/customers.routes';
import { calendarRouter } from './modules/calendar/calendar.routes';

export const app = express();

app.use(helmet());
const allowedOrigins = ['https://temporalrent.vercel.app', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Authentication routes
app.use('/auth', authRouter);
app.use('/api/auth', authRouter);
app.use('/api/v1/auth', authRouter);

// Inventory routes
app.use('/inventory', inventoryRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/v1/inventory', inventoryRouter);

// Package routes
app.use('/packages', packageRouter);
app.use('/api/packages', packageRouter);
app.use('/api/v1/packages', packageRouter);

// Package versions routes
app.use('/package-versions', packageVersionRouter);
app.use('/api/package-versions', packageVersionRouter);
app.use('/api/v1/package-versions', packageVersionRouter);

// Customers routes
app.use('/api/v1/customers', customersRouter);

// Availability routes
app.use('/availability', availabilityRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/v1/availability', availabilityRouter);

// Booking routes
app.use('/bookings', bookingsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/v1/bookings', bookingsRouter);

// Dispatch routes
app.use('/api/v1/bookings/:id/dispatch', dispatchRouter);
app.use('/api/v1/dispatches', dispatchesRouter);

// Return routes
app.use('/api/v1/bookings/:id/returns', returnRouter);
app.use('/api/v1/returns', returnsListRouter);

// Damage Reports routes
app.use('/api/v1/damage-reports', damageReportsRouter);

// Dashboard routes
app.use('/api/v1/dashboard', dashboardRouter);

// Audit routes
app.use('/api/v1/audit-events', auditRouter);

// Calendar routes
app.use('/api/v1/calendar', calendarRouter);
