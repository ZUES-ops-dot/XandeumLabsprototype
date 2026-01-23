import 'dotenv/config';

import { z } from 'zod';

export const env = z
  .object({
    DATABASE_URL: z
      .string()
      .default('postgres://postgres:postgres@localhost:5432/xandeum'),
    COMPUTE_INTERVAL_MS: z.coerce.number().int().positive().default(10000),
    ONLINE_WINDOW_SECONDS: z.coerce.number().int().positive().default(120)
  })
  .parse(process.env);
