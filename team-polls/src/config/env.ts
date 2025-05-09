import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Define environment schema with zod for type safety and validation
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('team_polls'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string(),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().default('supersecretkey'),
  JWT_EXPIRY: z.string().default('1h'),
  
  // Rate limiting
  RATE_LIMIT_POINTS: z.coerce.number().default(5), // 5 req/sec per user
  RATE_LIMIT_DURATION: z.coerce.number().default(1), // per second
});

// Extract and validate environment variables
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;