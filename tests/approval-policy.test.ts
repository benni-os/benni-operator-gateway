import { describe, it, expect } from 'vitest';
import { requiresApproval } from '../src/services/approval-policy.js';
import type { CreateJobInput } from '../src/types/jobs.js';

describe('approval policy', () => {
  it('should require approval for explicit high risk levels', () => {
    const job1: CreateJobInput = { type: 'test', input: {}, riskLevel: 'approval_required' };
    const job2: CreateJobInput = { type: 'test', input: {}, riskLevel: 'execute' };
    expect(requiresApproval(job1)).toBe(true);
    expect(requiresApproval(job2)).toBe(true);
  });

  it('should require approval for high risk types', () => {
    const job: CreateJobInput = { type: 'send_email', input: {}, riskLevel: 'draft' };
    expect(requiresApproval(job)).toBe(true);
  });

  it('should require approval for high risk keywords in input', () => {
    const job: CreateJobInput = {
      type: 'generic_action',
      input: { text: 'force push to main' },
      riskLevel: 'draft',
    };
    expect(requiresApproval(job)).toBe(true);
  });

  it('should require approval for previously allowed generic read/draft actions', () => {
    const job1: CreateJobInput = { type: 'get_user', input: { id: 1 }, riskLevel: 'read' };
    const job2: CreateJobInput = { type: 'prepare_report', input: { date: '2023' }, riskLevel: 'draft' };
    const job3: CreateJobInput = { type: 'test', input: {}, riskLevel: 'read' };
    const job4: CreateJobInput = { type: 'fetch_data', input: {}, riskLevel: 'read' };
    const job5: CreateJobInput = { type: 'test_get', input: {}, riskLevel: 'read' };
    expect(requiresApproval(job1)).toBe(true);
    expect(requiresApproval(job2)).toBe(true);
    expect(requiresApproval(job3)).toBe(true);
    expect(requiresApproval(job4)).toBe(true);
    expect(requiresApproval(job5)).toBe(true);
  });

  it('should deny by default for unknown risk levels', () => {
    const job = { type: 'safe_action', input: {}, riskLevel: 'unknown_level' } as unknown as CreateJobInput;
    expect(requiresApproval(job)).toBe(true);
  });

  it('should allow explicit safe read job for repository summary preview', () => {
    const job: CreateJobInput = {
      type: 'repository_summary_preview',
      riskLevel: 'read',
      input: {
        repository: 'nsfwbunny/benni-operator-gateway',
        purpose: 'Safe local v0.1 job-state test only. Do not access GitHub or execute anything.',
      },
    };
    expect(requiresApproval(job)).toBe(false);
  });

  it('should deny by default for unknown read job', () => {
    const job: CreateJobInput = { type: 'some_unknown_action', riskLevel: 'read', input: {} };
    expect(requiresApproval(job)).toBe(true);
  });

  it('should require approval for read job mentioning GitHub write/merge/delete', () => {
    const job: CreateJobInput = {
      type: 'repository_summary_preview',
      riskLevel: 'read',
      input: {
        repository: 'nsfwbunny/benni-operator-gateway',
        purpose: 'Safe local v0.1 job-state test only. Do not access GitHub or execute anything.',
        extra: 'check if we should merge PR',
      },
    };
    expect(requiresApproval(job)).toBe(true);
  });
});
