/**
 * JARVAS-2 MCP Connector
 * Benni OS — Open Source Operator Gateway
 *
 * Maps all JARVAS-2 MCP tools to the ConnectorModule interface.
 * Self-hosted: set JARVAS2_BASE_URL + JARVAS2_API_KEY in .env
 */

import type { ConnectorModule, ToolDefinition, ToolResult } from '../../types/connector.js'

const JARVAS2_BASE_URL = process.env.JARVAS2_BASE_URL ?? 'http://localhost:8000'
const JARVAS2_API_KEY = process.env.JARVAS2_API_KEY ?? ''

async function call(path: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${JARVAS2_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JARVAS2_API_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`JARVAS-2 error ${res.status}: ${await res.text()}`)
  return res.json()
}

export const tools: ToolDefinition[] = [
  {
    name: 'run_task',
    description: 'Execute a task immediately in JARVAS-2.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'integer', default: 2 },
        requires_approval: { type: 'boolean', default: false },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'queue_task',
    description: 'Queue a task for later batch processing in JARVAS-2.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'integer', default: 2 },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'get_run',
    description: 'Get status and details of a run by run_id.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: { run_id: { type: 'string' } },
      required: ['run_id'],
    },
  },
  {
    name: 'cancel_run',
    description: 'Cancel/terminate a running execution.',
    requires_approval: true,
    inputSchema: {
      type: 'object',
      properties: {
        run_id: { type: 'string' },
        reason: { type: 'string', default: 'Cancelled via gateway' },
      },
      required: ['run_id'],
    },
  },
  {
    name: 'list_runs',
    description: 'List recent task executions.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'integer', default: 10 } },
      required: [],
    },
  },
  {
    name: 'set_objective',
    description: 'Create and activate a new strategic objective.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'run_cycle',
    description: 'Trigger a full autonomous orchestration cycle.',
    requires_approval: true,
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_opportunities',
    description: 'List monetization and automation opportunities.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'integer', default: 10 } },
      required: [],
    },
  },
  {
    name: 'create_opportunity',
    description: 'Create a new monetization opportunity.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', default: 'digital_product' },
        source: { type: 'string', default: 'gateway' },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'read_memory',
    description: 'Query Cognitive & Operational memory entries.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        type: { type: 'string' },
        namespace: { type: 'string', default: 'default' },
        limit: { type: 'integer', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'save_memory',
    description: 'Write an operational, episodic, or semantic memory entry.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        type: { type: 'string', default: 'operational' },
        namespace: { type: 'string', default: 'default' },
        tags: { type: 'string' },
      },
      required: ['content'],
    },
  },
  {
    name: 'get_snapshot',
    description: 'Get a full system snapshot of JARVAS-2.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: { include_history: { type: 'boolean', default: true } },
      required: [],
    },
  },
  {
    name: 'save_snapshot',
    description: 'Save the current system snapshot for state recovery.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: { label: { type: 'string', default: 'checkpoint' } },
      required: [],
    },
  },
  {
    name: 'request_approval',
    description: 'Request human approval for a sensitive action.',
    requires_approval: false,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string' },
        reason: { type: 'string' },
        payload: { type: 'object' },
      },
      required: ['action', 'reason'],
    },
  },
  {
    name: 'get_status',
    description: 'Get operational status of JARVAS-2.',
    requires_approval: false,
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'ping',
    description: 'Sub-millisecond health check ping.',
    requires_approval: false,
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
]

export async function execute(tool: string, params: Record<string, unknown>): Promise<ToolResult> {
  try {
    const data = await call(`/mcp/${tool}`, params)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

const jarvas2Connector: ConnectorModule = {
  name: 'jarvas2',
  version: '1.0.0',
  description: 'JARVAS-2 autonomous agent connector — run tasks, queue jobs, manage memory and objectives.',
  tools,
  execute,
}

export default jarvas2Connector
