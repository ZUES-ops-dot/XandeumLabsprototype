import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';

export function registerHealthRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/health', async (_request, reply) => {
    const start = Date.now();
    try {
      await pool.query('SELECT 1');
      return {
        status: 'ok',
        database: 'connected',
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString()
      };
    } catch {
      reply.code(503);
      return {
        status: 'degraded',
        database: 'disconnected',
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString()
      };
    }
  });

  app.get('/ready', async (_request, reply) => {
    try {
      await pool.query('SELECT 1');
      return { ready: true };
    } catch {
      reply.code(503);
      return { ready: false };
    }
  });

  app.get('/live', async () => {
    return { alive: true };
  });
}
