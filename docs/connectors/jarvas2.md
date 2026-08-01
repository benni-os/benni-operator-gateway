# JARVAS-2 Connector

The JARVAS-2 connector gives any MCP-compatible AI client full access to a self-hosted [JARVAS-2](https://github.com/benni-os/jarvas2) autonomous agent instance.

## Configuration

```bash
JARVAS2_BASE_URL=http://localhost:8000  # URL of your JARVAS-2 instance
JARVAS2_API_KEY=your_api_key_here
```

## Available Tools

| Tool | Approval Required | Description |
|---|---|---|
| `jarvas2__run_task` | No | Execute a task immediately |
| `jarvas2__queue_task` | No | Queue task for batch processing |
| `jarvas2__get_run` | No | Get run status by ID |
| `jarvas2__cancel_run` | **Yes** | Cancel a running execution |
| `jarvas2__list_runs` | No | List recent executions |
| `jarvas2__set_objective` | No | Create a strategic objective |
| `jarvas2__run_cycle` | **Yes** | Trigger full orchestration cycle |
| `jarvas2__get_opportunities` | No | List monetization opportunities |
| `jarvas2__create_opportunity` | No | Create new opportunity |
| `jarvas2__read_memory` | No | Query memory entries |
| `jarvas2__save_memory` | No | Write memory entry |
| `jarvas2__get_snapshot` | No | Get system snapshot |
| `jarvas2__save_snapshot` | No | Save state checkpoint |
| `jarvas2__request_approval` | No | Request human approval |
| `jarvas2__get_status` | No | Get operational status |
| `jarvas2__ping` | No | Health check |

## Tool Naming Convention

All tools are namespaced as `connector__tool`. The gateway registry dispatches by splitting on `__`:

```
jarvas2__run_task  →  connector: jarvas2, tool: run_task
```

## Approval Gate

Tools marked **Yes** in the table above will be intercepted by the [Approval Gate middleware](../middleware/approval-gate.md) before execution. The agent pauses and a webhook fires to your configured `APPROVAL_WEBHOOK_URL`.

## Self-Hosting JARVAS-2

JARVAS-2 is a separate service. Point `JARVAS2_BASE_URL` to your instance. The connector expects REST endpoints at `/mcp/{tool_name}`.
