import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

// More schemas can be added here as needed for DTO validation.
