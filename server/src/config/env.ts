import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters'),
  MONGO_URI: z.string().url('MONGO_URI must be a valid URL'),
  CLIENT_ORIGIN: z.string().url().optional(),
  BCRYPT_COST: z.coerce.number().int().min(4).max(20).default(12),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error('Invalid environment variables:\n' + issues);
  process.exit(1);
}

export const env = result.data;
