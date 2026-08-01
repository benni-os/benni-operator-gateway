# Contributing to Benni Operator Gateway

Thank you for your interest in contributing! This project is part of the **Benni OS** open source ecosystem — a production-grade autonomous AI operator stack.

## How to Contribute

### 1. Reporting Issues
- Use [GitHub Issues](https://github.com/benni-os/benni-operator-gateway/issues)
- Include OS, Node version, and minimal reproduction steps
- Label as `bug`, `enhancement`, or `question`

### 2. Proposing Features
- Open a [Discussion](https://github.com/benni-os/benni-operator-gateway/discussions) first for major changes
- Small improvements can go straight to a PR

### 3. Submitting a Pull Request

```bash
# 1. Fork the repo
git clone https://github.com/YOUR_USERNAME/benni-operator-gateway
cd benni-operator-gateway

# 2. Create a feature branch
git checkout -b feat/your-feature-name

# 3. Install dependencies
npm install

# 4. Make your changes and run tests
npm test

# 5. Commit with conventional commits
git commit -m "feat: add XYZ connector"

# 6. Push and open a PR against main
git push origin feat/your-feature-name
```

### 4. Connector Contributions

The fastest way to contribute is building a new **MCP Connector** under `src/connectors/`. Each connector exports:

```typescript
export interface ConnectorModule {
  name: string
  version: string
  tools: ToolDefinition[]
  execute(tool: string, params: Record<string, unknown>): Promise<unknown>
}
```

See `src/connectors/jarvas2/` as the reference implementation.

## Code Style

- TypeScript strict mode — no `any`
- ESLint + Prettier (run `npm run lint` before PR)
- Tests required for all new connectors

## Code of Conduct

Be respectful. We operate under the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Questions?

Open a [Discussion](https://github.com/benni-os/benni-operator-gateway/discussions) or reach out via the Benni OS community.
