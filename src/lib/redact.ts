const SENSITIVE_KEYS = ['key', 'token', 'secret', 'password', 'authorization', 'cookie'];

export function redact(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const redactedObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEYS.some((sk) => k.toLowerCase().includes(sk));
    redactedObj[k] = isSensitive ? '[REDACTED]' : (typeof v === 'object' && v !== null ? redact(v) : v);
  }
  return redactedObj;
}
