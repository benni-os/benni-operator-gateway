import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { JulesUpstreamError, JulesUpstreamAuthFailedError, JulesUpstreamTimeoutError } from '../lib/errors.js';
import { getEnv } from '../config/env.js';

const JULES_BASE_URL = 'https://jules.googleapis.com/v1alpha';

const julesSourcesResponseSchema = z.object({
  sources: z.array(z.object({ name: z.string(), displayName: z.string().nullable().optional() })).default([]),
});

function sanitizePayload(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayload);
  if (typeof obj === 'object') {
    const s: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const lk = k.toLowerCase();
      if (['key','token','secret','auth','password','credential','env'].some(x => lk.includes(x))) continue;
      s[k] = sanitizePayload(v);
    }
    return s;
  }
  return obj;
}

async function makeJulesGetRequest(url: string, requestId: string) {
  const { JULES_API_KEY } = getEnv();
  if (!JULES_API_KEY) throw new Error('JULES_API_KEY is not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { method: 'GET', headers: { 'x-goog-api-key': JULES_API_KEY }, signal: controller.signal, redirect: 'manual' });
    if (response.status === 401 || response.status === 403) { logger.warn(`Jules auth failed`, { requestId, statusCode: response.status }); throw new JulesUpstreamAuthFailedError(); }
    if (!response.ok) { logger.warn(`Jules error`, { requestId, statusCode: response.status }); throw new JulesUpstreamError(); }
    return { data: await response.json(), statusCode: response.status };
  } catch (error) {
    if (error instanceof JulesUpstreamAuthFailedError || error instanceof JulesUpstreamError) throw error;
    if (error instanceof Error && error.name === 'AbortError') { logger.warn(`Jules timeout`, { requestId }); throw new JulesUpstreamTimeoutError(); }
    logger.error(`Unexpected Jules error`, error); throw new JulesUpstreamError('Unexpected upstream error');
  } finally { clearTimeout(timeout); }
}

export async function fetchJulesSources(requestId: string) {
  const { data, statusCode } = await makeJulesGetRequest(`${JULES_BASE_URL}/sources`, requestId);
  const sources = julesSourcesResponseSchema.parse(data).sources.slice(0, 100);
  logger.info(`Fetched Jules sources`, { requestId, statusCode, sourceCount: sources.length });
  return { sources, count: sources.length, requestId };
}

export async function fetchJulesSessions(requestId: string) {
  const { data, statusCode } = await makeJulesGetRequest(`${JULES_BASE_URL}/sessions`, requestId);
  const raw = (data && typeof data === 'object' && 'sessions' in data && Array.isArray(data.sessions)) ? data.sessions : [];
  const sessions = sanitizePayload(raw.slice(0, 100)) as unknown[];
  logger.info(`Fetched Jules sessions`, { requestId, statusCode, sessionCount: sessions.length });
  return { sessions, count: sessions.length, requestId };
}

export async function fetchJulesSessionById(sessionId: string, requestId: string) {
  const { data, statusCode } = await makeJulesGetRequest(`${JULES_BASE_URL}/sessions/${sessionId}`, requestId);
  logger.info(`Fetched Jules session by ID`, { requestId, sessionId, statusCode });
  return { session: sanitizePayload(data), requestId };
}

export async function fetchJulesSessionActivities(sessionId: string, requestId: string) {
  const { data, statusCode } = await makeJulesGetRequest(`${JULES_BASE_URL}/sessions/${sessionId}/activities`, requestId);
  const raw = (data && typeof data === 'object' && 'activities' in data && Array.isArray(data.activities)) ? data.activities : [];
  const activities = sanitizePayload(raw.slice(0, 100)) as unknown[];
  logger.info(`Fetched Jules session activities`, { requestId, sessionId, statusCode, activityCount: activities.length });
  return { activities, count: activities.length, requestId };
}
