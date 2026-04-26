import { z } from 'zod';

export const subjectCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Subject name is required')
    .max(50, 'Subject name must be at most 50 characters'),
});

export type SubjectCreateInput = z.infer<typeof subjectCreateSchema>;
