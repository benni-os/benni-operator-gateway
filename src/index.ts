import { serve } from '@hono/node-server';
import { app } from './app.js';
import { getEnv } from './config/env.js';
import { logger } from './lib/logger.js';

const env = getEnv();
const port = parseInt(env.PORT, 10) || 3000;

logger.info(`Starting Benni Operator Gateway on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
  hostname: '127.0.0.1',
}, (info) => {
  logger.info(`Server is running at http://127.0.0.1:${info.port}`);
});
