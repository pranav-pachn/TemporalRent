import { z } from 'zod';

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const workspaceSetupSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  timezone: z.string().optional().refine((val) => !val || isValidTimeZone(val), {
    message: "Invalid IANA timezone"
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  timezone: z.string().optional().refine((val) => !val || isValidTimeZone(val), {
    message: "Invalid IANA timezone"
  }),
});

export type WorkspaceSetupInput = z.infer<typeof workspaceSetupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
