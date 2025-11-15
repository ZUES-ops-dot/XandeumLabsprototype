import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NetworkService } from '../services/network.service.js';
import { cacheGet, cacheSet } from '../cache.js';

const historyQuerySchema = z.object({
  window: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  bucket: z.enum(['1m', '5m', '15m', '1h', '1d']).default('5m')
});

const ingestCyclesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20)
});

export function registerNetworkRoutes(app: FastifyInstance, service: NetworkService) {
  app.get('/network/overview', async () => {
    const cacheKey = 'network:overview';
    const cached = cacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const data = await service.getOverview();
    cacheSet(cacheKey, data);
    return data;
  });

  app.get('/network/history', async (request) => {
    const parsed = historyQuerySchema.parse(request.query);
    const cacheKey = `network:history:${parsed.window}:${parsed.bucket}`;

    const cached = cacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const data = await service.getHistory(parsed.window, parsed.bucket);
    cacheSet(cacheKey, data);
    return data;
  });

  app.get('/network/versions', async () => {
    const cacheKey = 'network:versions';
    const cached = cacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const data = await service.getVersionDistribution();
    cacheSet(cacheKey, data);
    return data;
  });

  app.get('/network/ingest/cycles', async (request) => {
    const parsed = ingestCyclesQuerySchema.parse(request.query);
    const cacheKey = `network:ingest:cycles:${parsed.limit}`;

    const cached = cacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const data = await service.getRecentIngestCycles(parsed.limit);
    cacheSet(cacheKey, data);
    return data;
  });

  app.get('/network/ingest/health', async () => {
    const cacheKey = 'network:ingest:health';
    const cached = cacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const data = await service.getIngestHealth();
    cacheSet(cacheKey, data);
    return data;
  });
}
