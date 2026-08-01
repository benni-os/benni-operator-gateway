import { describe, it, expect } from 'vitest';
import { app } from '../src/app.js';
import { getCapability, listCapabilities, isCapabilityAllowed } from '../src/registry/index.js';

describe('Capability Registry', () => {
  describe('Registry functions', () => {
    it('listCapabilities returns all registered capabilities', () => {
      const caps = listCapabilities();
      expect(caps.length).toBeGreaterThanOrEqual(2);
      const ids = caps.map((c) => c.id);
      expect(ids).toContain('repository_summary_preview');
      expect(ids).toContain('generic_execute_draft');
    });

    it('getCapability returns the correct capability by id', () => {
      const cap = getCapability('repository_summary_preview');
      expect(cap).toBeDefined();
      expect(cap!.name).toBe('Repository Summary Preview');
      expect(cap!.kind).toBe('read');
      expect(cap!.riskProfile.riskLevel).toBe('read');
      expect(cap!.riskProfile.approvalPolicyRef).toBe('auto_approve');
      expect(cap!.riskProfile.sandbox.required).toBe(false);
      expect(cap!.version).toBe('1.0.0');
    });

    it('getCapability returns undefined for unknown id', () => {
      expect(getCapability('does_not_exist')).toBeUndefined();
    });

    it('isCapabilityAllowed returns true for registered non-external capability', () => {
      expect(isCapabilityAllowed('repository_summary_preview')).toBe(true);
      expect(isCapabilityAllowed('generic_execute_draft')).toBe(true);
    });

    it('isCapabilityAllowed returns false for unknown capability', () => {
      expect(isCapabilityAllowed('totally_unknown_type')).toBe(false);
    });
  });

  describe('GET /capabilities', () => {
    it('returns 200 with capabilities array and total', async () => {
      const res = await app.request('/capabilities');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.capabilities).toBeDefined();
      expect(Array.isArray(body.capabilities)).toBe(true);
      expect(body.total).toBeGreaterThanOrEqual(2);
    });

    it('each capability view has required fields', async () => {
      const res = await app.request('/capabilities');
      const body = await res.json();
      for (const cap of body.capabilities) {
        expect(cap.id).toBeDefined();
        expect(cap.name).toBeDefined();
        expect(cap.kind).toBeDefined();
        expect(cap.riskProfile).toBeDefined();
        expect(cap.riskProfile.riskLevel).toBeDefined();
        expect(cap.riskProfile.approvalPolicyRef).toBeDefined();
        expect(cap.timeoutPolicy.ms).toBeGreaterThan(0);
        expect(cap.retryPolicy.maxAttempts).toBeGreaterThanOrEqual(1);
        expect(cap.version).toMatch(/^\d+\.\d+\.\d+$/);
      }
    });
  });

  describe('GET /capabilities/:id', () => {
    it('returns 200 for a known capability', async () => {
      const res = await app.request('/capabilities/repository_summary_preview');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe('repository_summary_preview');
    });

    it('returns 404 for an unknown capability', async () => {
      const res = await app.request('/capabilities/no_such_thing');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.code).toBe('CAPABILITY_NOT_FOUND');
    });
  });

  describe('Job creation registry gate', () => {
    it('POST /jobs rejects an unregistered capability type with 400', async () => {
      const res = await app.request('/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'totally_unregistered_type',
          input: { data: 'test' },
          riskLevel: 'read',
        }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('CAPABILITY_NOT_FOUND');
    });
  });
});
