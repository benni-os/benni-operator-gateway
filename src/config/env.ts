import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  JULES_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_ANON_KEY: z.string().optional(),
  INTERNAL_GATEWAY_TOKEN: z.string().optional(),
  DB_PATH: z.string().default('benni.db'),
  JARVAS2_BASE_URL: z.string().url().optional().or(z.literal('')),
  JARVAS2_API_KEY: z.string().optional(),
  APPROVAL_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),
  APPROVAL_TIMEOUT_MS: z.string().default('300000'),
  GATEWAY_API_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Invalid environment configuration', error);
    process.exit(1);
  }
}
