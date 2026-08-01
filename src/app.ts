import { Hono } from 'hono';
import { requestId } from './lib/request-id.js';
import { logger } from './lib/logger.js';
import { AppError } from './lib/errors.js';
import { healthRouter } from './routes/health.js';
import { julesRouter } from './routes/jules.js';
import { jobsRouter } from './routes/jobs.js';
import { capabilitiesRouter } from './routes/capabilities.js';

export const app = new Hono();

app.use('*', requestId());

app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info({
    requestId: c.get('requestId'),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: ms,
  });
});

app.route('/health', healthRouter);
app.route('/jules', julesRouter);
app.route('/jobs', jobsRouter);
app.route('/capabilities', capabilitiesRouter);

app.onError((err, c) => {
  const reqId = c.get('requestId');
  if (err instanceof AppError) {
    return c.json(
      { error: err.message, code: err.code, requestId: reqId },
      err.statusCode as 400 | 404 | 409 | 500
    );
  }
  logger.error({ err }, 'Unhandled error');
  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR', requestId: reqId }, 500);
});
