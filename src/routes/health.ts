import { Hono } from 'hono';

type HealthEnv = { Variables: { requestId: string } };

export const healthRouter = new Hono<HealthEnv>();

healthRouter.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'benni-operator-gateway',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId') || 'unknown',
  });
});
