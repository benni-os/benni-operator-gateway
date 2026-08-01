import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { app } from '../src/app.js';
import { JobService } from '../src/services/job-service.js';

const REPO_SUMMARY_INPUT = {
  repository: 'nsfwbunny/benni-operator-gateway',
  purpose: 'Safe local test — no network access, no execution.',
};

const EXECUTE_DRAFT_INPUT = {
  payload: { task: 'test_draft' },
};

describe('Job Service & Routes', () => {
  it('POST /jobs should create a pending_approval job for execute-risk capability', async () => {
    const res = await app.request('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'generic_execute_draft', input: EXECUTE_DRAFT_INPUT, riskLevel: 'execute' }),
    });
    expect(res.status).toBe(201);
    const job = await res.json();
    expect(job.id).toBeDefined();
    expect(job.status).toBe('pending_approval');
    expect(job.type).toBe('generic_execute_draft');
    expect(job.auditEvents.length).toBe(1);
    expect(job.auditEvents[0].action).toBe('job_created');
  });

  it('POST /jobs should redact sensitive keys in input', async () => {
    const res = await app.request('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'generic_execute_draft',
        input: { payload: { username: 'test', password: 'supersecretpassword', github_token: 'gh_123' } },
        riskLevel: 'execute',
      }),
    });
    expect(res.status).toBe(201);
    const job = await res.json();
    expect(job.input.payload.password).toBe('[REDACTED]');
    expect(job.input.payload.github_token).toBe('[REDACTED]');
    expect(job.input.payload.username).toBe('test');
  });

  it('GET /jobs/:id should return 404 for unknown job', async () => {
    const res = await app.request('/jobs/unknown-id');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Job with ID unknown-id not found');
  });

  it('GET /jobs/:id should return existing job', async () => {
    const job = JobService.createJob({ type: 'generic_execute_draft', input: EXECUTE_DRAFT_INPUT, riskLevel: 'execute' });
    const res = await app.request(`/jobs/${job.id}`);
    expect(res.status).toBe(200);
    const fetchedJob = await res.json();
    expect(fetchedJob.id).toBe(job.id);
    expect(fetchedJob.status).toBe('pending_approval');
  });

  it('POST /jobs should create a draft job for repository_summary_preview (auto_approve)', async () => {
    const res = await app.request('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'repository_summary_preview', riskLevel: 'read', input: REPO_SUMMARY_INPUT }),
    });
    expect(res.status).toBe(201);
    const job = await res.json();
    expect(job.id).toBeDefined();
    expect(job.status).toBe('draft');
  });

  it('POST /jobs should reject an unregistered capability type with 400', async () => {
    const res = await app.request('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'totally_unregistered_legacy_type', input: { data: 'test' }, riskLevel: 'read' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('CAPABILITY_NOT_FOUND');
  });

  describe('Persistence Tests', () => {
    const tmpDbPath = path.join(os.tmpdir(), `benni-test-restart-${process.pid}.db`);

    afterAll(() => {
      for (const suffix of ['', '-wal', '-shm']) {
        const filePath = `${tmpDbPath}${suffix}`;
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    it('should persist job state across DB close and reopen (restart durability)', async () => {
      const { closeDatabaseForTesting, recreateDatabaseForTesting } = await import('../src/lib/db.js');
      process.env['DB_PATH'] = tmpDbPath;
      recreateDatabaseForTesting();

      const createdJob = JobService.createJob({ type: 'generic_execute_draft', input: { payload: { data: 'survive_me' } }, riskLevel: 'execute' });
      const approvedJob = JobService.approveJob(createdJob.id, { reason: 'durability check' });

      expect(approvedJob.status).toBe('approved');
      expect(approvedJob.auditEvents.length).toBeGreaterThan(1);

      closeDatabaseForTesting();
      recreateDatabaseForTesting();

      const retrievedJob = JobService.getJob(createdJob.id);
      expect(retrievedJob).toBeDefined();
      expect(retrievedJob.id).toBe(createdJob.id);
      expect(retrievedJob.status).toBe('approved');
      expect((retrievedJob.input as { payload: { data: string } }).payload.data).toBe('survive_me');
      expect(retrievedJob.auditEvents[0].action).toBe('job_created');
      expect(retrievedJob.auditEvents[1].action).toBe('job_approved');

      delete process.env['DB_PATH'];
      recreateDatabaseForTesting();
    });
  });

  describe('Approval Transitions', () => {
    let pendingApprovalJobId: string;
    let draftJobId: string;

    beforeEach(() => {
      const job1 = JobService.createJob({ type: 'generic_execute_draft', input: EXECUTE_DRAFT_INPUT, riskLevel: 'execute' });
      pendingApprovalJobId = job1.id;
      const job2 = JobService.createJob({ type: 'repository_summary_preview', riskLevel: 'read', input: REPO_SUMMARY_INPUT });
      draftJobId = job2.id;
    });

    it('POST /jobs/:id/approve should transition pending_approval → approved', async () => {
      const res = await app.request(`/jobs/${pendingApprovalJobId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'LGTM', actor: 'alice' }),
      });
      expect(res.status).toBe(200);
      const job = await res.json();
      expect(job.status).toBe('approved');
      const auditEvent = job.auditEvents.find((e: { action: string; details: Record<string, unknown> }) => e.action === 'job_approved');
      expect(auditEvent).toBeDefined();
      expect(auditEvent?.details.reason).toBe('LGTM');
      expect(auditEvent?.details.actor).toBe('alice');
      expect(auditEvent?.details.previousStatus).toBe('pending_approval');
      expect(auditEvent?.details.nextStatus).toBe('approved');
    });

    it('POST /jobs/:id/reject should transition pending_approval → rejected', async () => {
      const res = await app.request(`/jobs/${pendingApprovalJobId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'too risky' }),
      });
      expect(res.status).toBe(200);
      const job = await res.json();
      expect(job.status).toBe('rejected');
    });

    it('POST /jobs/:id/approve should fail (409) for a draft job', async () => {
      const res = await app.request(`/jobs/${draftJobId}/approve`, { method: 'POST' });
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe('INVALID_TRANSITION');
    });

    it('POST /jobs/:id/reject should fail (409) for a draft job', async () => {
      const res = await app.request(`/jobs/${draftJobId}/reject`, { method: 'POST' });
      expect(res.status).toBe(409);
    });

    it('POST /jobs/:id/approve should fail (404) for an unknown job', async () => {
      const res = await app.request('/jobs/unknown-id/approve', { method: 'POST' });
      expect(res.status).toBe(404);
    });

    it('POST /jobs/:id/approve should fail (409) for an already approved job', async () => {
      await app.request(`/jobs/${pendingApprovalJobId}/approve`, { method: 'POST' });
      const res2 = await app.request(`/jobs/${pendingApprovalJobId}/approve`, { method: 'POST' });
      expect(res2.status).toBe(409);
    });

    it('POST /jobs/:id/reject should fail (409) for an already rejected job', async () => {
      await app.request(`/jobs/${pendingApprovalJobId}/reject`, { method: 'POST' });
      const res2 = await app.request(`/jobs/${pendingApprovalJobId}/reject`, { method: 'POST' });
      expect(res2.status).toBe(409);
    });
  });
});
