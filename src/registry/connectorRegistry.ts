/**
 * Hot-Reload Connector Registry — Benni OS Operator Gateway
 *
 * Manages all ConnectorModule instances.
 * Supports dynamic register/unregister without server restart.
 */

import type { ConnectorModule, ToolDefinition } from '../types/connector.js'

class ConnectorRegistry {
  private connectors = new Map<string, ConnectorModule>()

  register(connector: ConnectorModule): void {
    this.connectors.set(connector.name, connector)
    console.log(`[Registry] Connector registered: ${connector.name}@${connector.version}`)
  }

  unregister(name: string): void {
    this.connectors.delete(name)
    console.log(`[Registry] Connector unregistered: ${name}`)
  }

  get(name: string): ConnectorModule | undefined {
    return this.connectors.get(name)
  }

  list(): ConnectorModule[] {
    return Array.from(this.connectors.values())
  }

  /** Returns all tools across all connectors, namespaced as connector__tool */
  allTools(): Array<ToolDefinition & { connector: string; fullName: string }> {
    const result: Array<ToolDefinition & { connector: string; fullName: string }> = []
    for (const connector of this.connectors.values()) {
      for (const tool of connector.tools) {
        result.push({
          ...tool,
          connector: connector.name,
          fullName: `${connector.name}__${tool.name}`,
        })
      }
    }
    return result
  }

  /** Parse a fullName (connector__tool) and execute the tool */
  async dispatch(
    fullName: string,
    params: Record<string, unknown>,
  ) {
    const sep = fullName.indexOf('__')
    if (sep === -1) throw new Error(`Invalid tool name format: ${fullName}. Expected connector__tool`)

    const connectorName = fullName.slice(0, sep)
    const toolName = fullName.slice(sep + 2)
    const connector = this.connectors.get(connectorName)

    if (!connector) throw new Error(`Connector not found: ${connectorName}`)

    return connector.execute(toolName, params)
  }
}

export const registry = new ConnectorRegistry()
