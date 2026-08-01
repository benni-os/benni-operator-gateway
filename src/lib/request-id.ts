import { v4 as uuidv4 } from 'uuid';
import type { MiddlewareHandler } from 'hono';

type RequestIdEnv = { Variables: { requestId: string } };

export function requestId(): MiddlewareHandler<RequestIdEnv> {
  return async (c, next) => {
    const reqId = c.req.header('X-Request-Id') || uuidv4();
    c.set('requestId', reqId);
    await next();
    c.res.headers.set('X-Request-Id', reqId);
  };
}
