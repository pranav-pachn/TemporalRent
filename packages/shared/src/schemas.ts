import { z } from 'zod';

// Shared Zod schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER']),
});
