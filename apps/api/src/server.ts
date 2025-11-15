import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';

import { pool } from './db.js';
import { env } from './env.js';
import { errorHandler } from './middleware/error-handler.js';
import { PnodeRepository, NetworkRepository } from './repositories/index.js';
import { PnodeService, NetworkService } from './services/index.js';
import { registerHealthRoutes, registerPnodeRoutes, registerNetworkRoutes } from './routes/index.js';

export function buildServer() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined
    }
  });

  app.register(cors, { origin: env.CORS_ORIGIN });
  app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  app.setErrorHandler(errorHandler);

  const pnodeRepository = new PnodeRepository(pool);
  const networkRepository = new NetworkRepository(pool);

  const pnodeService = new PnodeService(pnodeRepository);
  const networkService = new NetworkService(networkRepository, env.ONLINE_WINDOW_SECONDS);

  registerHealthRoutes(app, pool);
  registerPnodeRoutes(app, pnodeService, env.ONLINE_WINDOW_SECONDS);
  registerNetworkRoutes(app, networkService);

  return app;
}
