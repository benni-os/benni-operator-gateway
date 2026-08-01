import { Hono } from 'hono';
import { listCapabilities, getCapability, toCapabilityView } from '../registry/index.js';
import { AppError } from '../lib/errors.js';

const capabilities = new Hono();

capabilities.get('/', (c) => {
  const all = listCapabilities().map(toCapabilityView);
  return c.json({ capabilities: all, total: all.length });
});

capabilities.get('/:id', (c) => {
  const id = c.req.param('id');
  const cap = getCapability(id);
  if (!cap) throw new AppError(`Capability '${id}' not found in registry`, 404, 'CAPABILITY_NOT_FOUND');
  return c.json(toCapabilityView(cap));
});

export { capabilities as capabilitiesRouter };
