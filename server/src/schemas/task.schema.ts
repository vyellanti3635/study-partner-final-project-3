import { z } from 'zod';

export const taskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  subjectId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Select a subject'),
  dueDate: z
    .string()
    .refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  priority: z.enum(['Low', 'Medium', 'High'], {
    errorMap: () => ({ message: 'Priority must be Low, Medium, or High' }),
  }),
  status: z
    .enum(['Not Started', 'In Progress', 'Completed'], {
      errorMap: () => ({ message: 'Status must be Not Started, In Progress, or Completed' }),
    })
    .default('Not Started'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

// PATCH semantics: every field is optional
export const taskUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  subjectId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Select a subject')
    .optional(),
  dueDate: z
    .string()
    .refine((s) => !isNaN(Date.parse(s)), 'Invalid date')
    .optional(),
  priority: z
    .enum(['Low', 'Medium', 'High'], {
      errorMap: () => ({ message: 'Priority must be Low, Medium, or High' }),
    })
    .optional(),
  status: z
    .enum(['Not Started', 'In Progress', 'Completed'], {
      errorMap: () => ({ message: 'Status must be Not Started, In Progress, or Completed' }),
    })
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional(),
  isComplete: z.boolean().optional(),
});

export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
