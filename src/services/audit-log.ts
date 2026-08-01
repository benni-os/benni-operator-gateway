import { logger } from '../lib/logger.js';
import type { AuditEvent } from '../types/jobs.js';

export function recordAuditEvent(action: string, details?: Record<string, unknown>): AuditEvent {
  const event: AuditEvent = { timestamp: new Date().toISOString(), action, details };
  logger.info(`Audit Event: ${action}`, details);
  return event;
}
