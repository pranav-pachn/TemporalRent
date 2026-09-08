import { z } from 'zod';

export const workspaceSetupSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  timezone: z.string().default('UTC'),
});

export type WorkspaceSetupInput = z.infer<typeof workspaceSetupSchema>;
