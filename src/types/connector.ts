/**
 * Connector Module Interface — Benni OS Operator Gateway
 * All connectors must implement ConnectorModule.
 */

export interface ToolDefinition {
  /** Unique tool name within this connector */
  name: string
  /** Human-readable description for the LLM */
  description: string
  /** JSON Schema for input validation */
  inputSchema: Record<string, unknown>
  /** If true, the Approval Gate middleware intercepts before execution */
  requires_approval?: boolean
}

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
}

export interface ConnectorModule {
  /** Connector identifier used in registry and MCP tool names */
  name: string
  /** Semver version string */
  version: string
  /** Optional human-readable description */
  description?: string
  /** All tools exposed by this connector */
  tools: ToolDefinition[]
  /**
   * Execute a tool by name with validated params.
   * Called by the gateway router after approval gate check.
   */
  execute(tool: string, params: Record<string, unknown>): Promise<ToolResult>
}
