import { redact } from './redact.js';

export const logger = {
  info: (message: unknown, meta?: unknown) => {
    console.log(JSON.stringify({ level: 'info', message, meta: redact(meta) }));
  },
  error: (message: unknown, error?: unknown) => {
    console.error(JSON.stringify({ level: 'error', message, error: redact(error) }));
  },
  warn: (message: unknown, meta?: unknown) => {
    console.warn(JSON.stringify({ level: 'warn', message, meta: redact(meta) }));
  },
};
