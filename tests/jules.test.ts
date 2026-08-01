import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from '../src/app.js';

describe('GET /jules/sources', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should return 503 JULES_NOT_CONFIGURED when JULES_API_KEY is missing', async () => {
    delete process.env.JULES_API_KEY;
    const res = await app.request('/jules/sources');
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('JULES_NOT_CONFIGURED');
    expect(body.error).toBeDefined();
    expect(body.requestId).toBeDefined();
    expect(JSON.stringify(body)).not.toContain('API_KEY');
  });

  it('should return 503 JULES_NOT_CONFIGURED when JULES_API_KEY is blank', async () => {
    process.env.JULES_API_KEY = '   ';
    const res = await app.request('/jules/sources');
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('JULES_NOT_CONFIGURED');
  });

  it('should return 200 and sanitised sources successfully', async () => {
    process.env.JULES_API_KEY = 'test_key';
    const mockUpstreamResponse = {
      sources: [
        { name: 'repo1', displayName: 'Repo 1', extraField: 'secret' },
        { name: 'repo2' },
      ],
    };
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockUpstreamResponse } as unknown as Response);
    const res = await app.request('/jules/sources');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(2);
    expect(body.requestId).toBeDefined();
    expect(body.sources).toHaveLength(2);
    expect(body.sources[0]).toEqual({ name: 'repo1', displayName: 'Repo 1' });
    expect(body.sources[0].extraField).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://jules.googleapis.com/v1alpha/sources', expect.objectContaining({ method: 'GET', headers: { 'x-goog-api-key': 'test_key' } }));
  });

  it('should limit sources to 100 max', async () => {
    process.env.JULES_API_KEY = 'test_key';
    const mockUpstreamResponse = { sources: Array.from({ length: 150 }, (_, i) => ({ name: `repo${i}` })) };
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockUpstreamResponse } as unknown as Response);
    const res = await app.request('/jules/sources');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(100);
    expect(body.sources).toHaveLength(100);
  });

  it('should return 502 JULES_UPSTREAM_AUTH_FAILED on 401/403', async () => {
    process.env.JULES_API_KEY = 'bad_key';
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 403 } as unknown as Response);
    const res = await app.request('/jules/sources');
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.code).toBe('JULES_UPSTREAM_AUTH_FAILED');
  });

  it('should return 502 JULES_UPSTREAM_ERROR on other errors', async () => {
    process.env.JULES_API_KEY = 'test_key';
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as unknown as Response);
    const res = await app.request('/jules/sources');
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.code).toBe('JULES_UPSTREAM_ERROR');
  });

  it('should return 504 JULES_UPSTREAM_TIMEOUT on AbortError', async () => {
    process.env.JULES_API_KEY = 'test_key';
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    vi.mocked(fetch).mockRejectedValueOnce(abortError);
    const res = await app.request('/jules/sources');
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.code).toBe('JULES_UPSTREAM_TIMEOUT');
  });

  describe('Sessions Read-Only Endpoints', () => {
    beforeEach(() => { process.env.JULES_API_KEY = 'test_key'; });

    it('should return 200 and sanitise/limit sessions', async () => {
      const mockResponse = { sessions: [{ name: 'session1', token: 'secret-token', apiKey: 'secret-key' }, { name: 'session2', otherField: 'safe' }] };
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockResponse } as unknown as Response);
      const res = await app.request('/jules/sessions');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(2);
      expect(body.sessions[0]).toEqual({ name: 'session1' });
      expect(body.sessions[1]).toEqual({ name: 'session2', otherField: 'safe' });
    });

    it('should return 200 and sanitise session details by ID', async () => {
      const mockResponse = { name: 'session-id-123', state: 'active', githubToken: 'gh-secret-token' };
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockResponse } as unknown as Response);
      const res = await app.request('/jules/sessions/session-id-123');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.session).toEqual({ name: 'session-id-123', state: 'active' });
    });

    it('should return 200 and sanitise/limit activities', async () => {
      const mockResponse = { activities: [{ id: 'activity1', privateKey: 'secret' }, { id: 'activity2', info: 'safe' }] };
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockResponse } as unknown as Response);
      const res = await app.request('/jules/sessions/session-id-123/activities');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(2);
      expect(body.activities[0]).toEqual({ id: 'activity1' });
    });

    it('should reject invalid sessionId format with 400', async () => {
      for (const id of ['session.id', 'session@id', 'session!id']) {
        const res1 = await app.request(`/jules/sessions/${id}`);
        expect(res1.status).toBe(400);
        const res2 = await app.request(`/jules/sessions/${id}/activities`);
        expect(res2.status).toBe(400);
      }
    });

    it('should forward upstream error codes properly for sessions', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 502 } as unknown as Response);
      const res = await app.request('/jules/sessions');
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.code).toBe('JULES_UPSTREAM_ERROR');
    });

    it('should return 404 for unsupported write methods', async () => {
      const postRes = await app.request('/jules/sessions', { method: 'POST', body: JSON.stringify({}) });
      expect(postRes.status).toBe(404);
      const deleteRes = await app.request('/jules/sessions/session-id-123', { method: 'DELETE' });
      expect(deleteRes.status).toBe(404);
    });
  });
});
