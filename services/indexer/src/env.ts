import 'dotenv/config';

import { z } from 'zod';

export const env = z
  .object({
    DATABASE_URL: z
      .string()
      .default('postgres://postgres:postgres@localhost:5432/xandeum'),
    POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15000),
    REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    GOSSIP_SOURCES: z.string().optional()
  })
  .parse(process.env);

export function getSources(): string[] {
  if (!env.GOSSIP_SOURCES) return [];
  return env.GOSSIP_SOURCES.split(',').map((s) => s.trim()).filter(Boolean);
}
