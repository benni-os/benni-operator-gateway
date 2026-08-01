import { v4 as uuidv4 } from 'uuid';
import type { Job, CreateJobInput, ApproveJobInput, RejectJobInput, ApprovalActionDetails } from '../types/jobs.js';
import { requiresApproval } from './approval-policy.js';
import { recordAuditEvent } from './audit-log.js';
import { NotFoundError, InvalidTransitionError, CapabilityNotFoundError } from '../lib/errors.js';
import { redact } from '../lib/redact.js';
import { db } from '../lib/db.js';
import { isCapabilityAllowed } from '../registry/index.js';

interface JobRow {
  id: string; type: string; status: string; riskLevel: string;
  createdAt: string; updatedAt: string; input: string; result: string | null; auditEvents: string;
}

function mapRowToJob(row: JobRow): Job {
  return {
    id: row.id, type: row.type, status: row.status as Job['status'], riskLevel: row.riskLevel as Job['riskLevel'],
    createdAt: row.createdAt, updatedAt: row.updatedAt,
    input: JSON.parse(row.input), result: row.result ? JSON.parse(row.result) : null, auditEvents: JSON.parse(row.auditEvents),
  };
}

export class JobService {
  static createJob(input: CreateJobInput): Job {
    if (!isCapabilityAllowed(input.type)) throw new CapabilityNotFoundError(input.type);
    const id = uuidv4();
    const now = new Date().toISOString();
    const initialStatus = requiresApproval(input) ? 'pending_approval' : 'draft';
    const newJob: Job = {
      id, type: input.type, status: initialStatus, riskLevel: input.riskLevel,
      createdAt: now, updatedAt: now,
      input: redact(input.input) as Record<string, unknown>,
      result: null,
      auditEvents: [recordAuditEvent('job_created', { id, type: input.type, status: initialStatus })],
    };
    db.prepare(`INSERT INTO jobs (id,type,status,riskLevel,createdAt,updatedAt,input,result,auditEvents) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(newJob.id, newJob.type, newJob.status, newJob.riskLevel, newJob.createdAt, newJob.updatedAt, JSON.stringify(newJob.input), null, JSON.stringify(newJob.auditEvents));
    return newJob;
  }

  static getJob(id: string): Job {
    const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as JobRow | undefined;
    if (!row) throw new NotFoundError(`Job with ID ${id} not found`);
    return mapRowToJob(row);
  }

  static approveJob(id: string, input?: ApproveJobInput): Job {
    return db.transaction(() => {
      const job = this.getJob(id);
      if (job.status !== 'pending_approval') throw new InvalidTransitionError(`Cannot approve job ${id} from status ${job.status}`);
      const details: ApprovalActionDetails = { previousStatus: job.status, nextStatus: 'approved', reason: input?.reason, actor: input?.actor };
      job.status = 'approved'; job.updatedAt = new Date().toISOString();
      job.auditEvents.push(recordAuditEvent('job_approved', { id, ...details }));
      db.prepare(`UPDATE jobs SET status=?,updatedAt=?,auditEvents=? WHERE id=?`).run(job.status, job.updatedAt, JSON.stringify(job.auditEvents), job.id);
      return job;
    })();
  }

  static rejectJob(id: string, input?: RejectJobInput): Job {
    return db.transaction(() => {
      const job = this.getJob(id);
      if (job.status !== 'pending_approval') throw new InvalidTransitionError(`Cannot reject job ${id} from status ${job.status}`);
      const details: ApprovalActionDetails = { previousStatus: job.status, nextStatus: 'rejected', reason: input?.reason, actor: input?.actor };
      job.status = 'rejected'; job.updatedAt = new Date().toISOString();
      job.auditEvents.push(recordAuditEvent('job_rejected', { id, ...details }));
      db.prepare(`UPDATE jobs SET status=?,updatedAt=?,auditEvents=? WHERE id=?`).run(job.status, job.updatedAt, JSON.stringify(job.auditEvents), job.id);
      return job;
    })();
  }
}
