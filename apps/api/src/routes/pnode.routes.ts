import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PnodeService } from '../services/pnode.service.js';

const listQuerySchema = z.object({
  query: z.string().optional(),
  status: z.enum(['online', 'offline']).optional(),
  version: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  sort: z.enum(['last_seen_at', 'first_seen_at', 'pubkey']).default('last_seen_at'),
  order: z.enum(['asc', 'desc']).default('desc')
});

const detailParamsSchema = z.object({
  pubkey: z.string().min(1)
});

export function registerPnodeRoutes(
  app: FastifyInstance,
  service: PnodeService,
  onlineWindowSeconds: number
) {
  app.get('/pnodes', async (request) => {
    const parsed = listQuerySchema.parse(request.query);

    return service.list({
      query: parsed.query,
      status: parsed.status,
      version: parsed.version,
      page: parsed.page,
      pageSize: parsed.pageSize,
      sort: parsed.sort,
      order: parsed.order,
      onlineWindowSeconds
    });
  });

  app.get('/pnodes/:pubkey', async (request, reply) => {
    const params = detailParamsSchema.parse(request.params);
    const result = await service.getByPubkey(params.pubkey);

    if (!result) {
      reply.code(404);
      return { error: 'not_found', message: 'pNode not found' };
    }

    return result;
  });
}
