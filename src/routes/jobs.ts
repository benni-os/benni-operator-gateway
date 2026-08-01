import { Hono } from 'hono';
import { z } from 'zod';
import { JobService } from '../services/job-service.js';
import { ValidationError } from '../lib/errors.js';
import type { RiskLevel } from '../types/jobs.js';

export const jobsRouter = new Hono<{ Variables: { requestId: string } }>();

const createJobSchema = z.object({
  type: z.string().min(1),
  input: z.record(z.string(), z.unknown()),
  riskLevel: z.enum(['read', 'draft', 'execute', 'approval_required']),
});

const transitionJobSchema = z.object({ reason: z.string().optional(), actor: z.string().optional() });

jobsRouter.post('/', async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
  const result = createJobSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.message);
  return c.json(JobService.createJob({ type: result.data.type, input: result.data.input as Record<string, unknown>, riskLevel: result.data.riskLevel as RiskLevel }), 201);
});

jobsRouter.get('/:id', (c) => c.json(JobService.getJob(c.req.param('id'))));

jobsRouter.post('/:id/approve', async (c) => {
  let body: unknown = {};
  if (c.req.header('content-type')?.includes('application/json')) { try { body = await c.req.json(); } catch { throw new ValidationError('Invalid JSON body'); } }
  const result = transitionJobSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.message);
  return c.json(JobService.approveJob(c.req.param('id'), result.data));
});

jobsRouter.post('/:id/reject', async (c) => {
  let body: unknown = {};
  if (c.req.header('content-type')?.includes('application/json')) { try { body = await c.req.json(); } catch { throw new ValidationError('Invalid JSON body'); } }
  const result = transitionJobSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.message);
  return c.json(JobService.rejectJob(c.req.param('id'), result.data));
});
