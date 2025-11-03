import 'dotenv/config';

import { z } from 'zod';

export const env = z
  .object({
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/xandeum'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    ONLINE_WINDOW_SECONDS: z.coerce.number().default(600),
    CACHE_TTL_MS: z.coerce.number().default(5000),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
  })
  .parse(process.env);
