import { z } from 'zod';

// Profile update: name and/or email may be changed.
// If email is changing, currentPassword is required to confirm identity.
export const profileUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Must be a valid email address')
      .max(254, 'Email must be at most 254 characters')
      .optional(),
    currentPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.email !== undefined && data.email !== '' && !data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Current password is required when changing email',
        path: ['currentPassword'],
      });
    }
  });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Password change: verify current, set new with confirmation
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
