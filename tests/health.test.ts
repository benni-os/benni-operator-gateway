import { describe, it, expect } from 'vitest';
import { app } from '../src/app.js';

describe('GET /health', () => {
  it('should return expected fields and request ID', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body = await res.json();

    expect(body.status).toBe('ok');
    expect(body.service).toBe('benni-operator-gateway');
    expect(body.version).toBe('0.1.0');
    expect(body.timestamp).toBeDefined();
    expect(body.requestId).toBeDefined();

    expect(res.headers.get('X-Request-Id')).toBeDefined();
    expect(res.headers.get('X-Request-Id')).toBe(body.requestId);
  });
});
