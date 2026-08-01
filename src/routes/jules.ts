import { Hono } from 'hono';
import { getEnv } from '../config/env.js';
import { AppError, ValidationError } from '../lib/errors.js';
import { fetchJulesSources, fetchJulesSessions, fetchJulesSessionById, fetchJulesSessionActivities } from '../services/jules-client.js';

export const julesRouter = new Hono<{ Variables: { requestId: string } }>();

function checkConfig() {
  const env = getEnv();
  if (!env.JULES_API_KEY || env.JULES_API_KEY.trim() === '') {
    throw new AppError('Jules API is not configured', 503, 'JULES_NOT_CONFIGURED');
  }
}

julesRouter.get('/sources', async (c) => { checkConfig(); return c.json(await fetchJulesSources(c.get('requestId'))); });
julesRouter.get('/sessions', async (c) => { checkConfig(); return c.json(await fetchJulesSessions(c.get('requestId'))); });
julesRouter.get('/sessions/:sessionId', async (c) => {
  checkConfig();
  const sessionId = c.req.param('sessionId');
  if (!sessionId || !/^[a-zA-Z0-9\-_]+$/.test(sessionId)) throw new ValidationError('Invalid Session ID format');
  return c.json(await fetchJulesSessionById(sessionId, c.get('requestId')));
});
julesRouter.get('/sessions/:sessionId/activities', async (c) => {
  checkConfig();
  const sessionId = c.req.param('sessionId');
  if (!sessionId || !/^[a-zA-Z0-9\-_]+$/.test(sessionId)) throw new ValidationError('Invalid Session ID format');
  return c.json(await fetchJulesSessionActivities(sessionId, c.get('requestId')));
});
