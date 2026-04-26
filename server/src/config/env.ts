import 'dotenv/config';
import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

const LOCAL_DEFAULTS = {
  MONGO_URI: 'mongodb://127.0.0.1:27017/studypartner',
  SESSION_SECRET: 'dev-only-session-secret-change-in-production-32b',
  CLIENT_ORIGIN: 'http://localhost:5173',
} as const;

const baseSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  BCRYPT_COST: z.coerce.number().int().min(4).max(20).default(12),
});

const productionSchema = baseSchema.extend({
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters'),
  MONGO_URI: z.string().url('MONGO_URI must be a valid URL'),
  CLIENT_ORIGIN: z.string().url().optional(),
});

const localSchema = baseSchema.extend({
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters')
    .default(LOCAL_DEFAULTS.SESSION_SECRET),
  MONGO_URI: z
    .string()
    .url('MONGO_URI must be a valid URL')
    .default(LOCAL_DEFAULTS.MONGO_URI),
  CLIENT_ORIGIN: z.string().url().default(LOCAL_DEFAULTS.CLIENT_ORIGIN),
});

const schema = isProduction ? productionSchema : localSchema;
const result = schema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error('Invalid environment variables:\n' + issues);
  process.exit(1);
}

export const env = result.data;
