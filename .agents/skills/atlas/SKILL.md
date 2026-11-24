---
name: atlas
description: Connect, capture, and synchronize coding agent sessions and shared memory with Atlas (tryatlas.cc) for the organization workspace at https://app.tryatlas.cc/o/atlas.
---

# Atlas Platform Integration

This skill guides coding agents on how to interface with **Atlas** ([tryatlas.cc](https://tryatlas.cc)), the agent source control, shared memory, and session capture platform for the organization workspace at [https://app.tryatlas.cc/o/atlas](https://app.tryatlas.cc/o/atlas).

---

## 1. Overview & Architecture

Atlas operates as a unified control plane and source control system across multiple AI coding agents (Antigravity, Claude Code, Codex, Cursor, Copilot, OpenCode).

```
┌────────────────────────────────────────────────────────┐
│      Atlas Web Console: https://app.tryatlas.cc/o/atlas │
│   (Shared Timelines, Member Management, ROI Analytics) │
└───────────────────────────▲────────────────────────────┘
                            │ Cloud Sync
┌───────────────────────────┴────────────────────────────┐
│                       Atlas Daemon                     │
│               (~/.config/atlas/config.toml)            │
└─────────────▲────────────────────────────▲─────────────┘
              │                            │
   ┌──────────┴─────────┐       ┌──────────┴─────────┐
   │ atlas_memory MCP   │       │ Session Hook Agent │
   │ (Shared Knowledge) │       │ (Commit & Prompts) │
   └────────────────────┘       └────────────────────┘
```

---

## 2. Shared Memory Integration (`atlas_memory`)

When the `atlas_memory` MCP server is registered in your agent configuration, all agents in the project share the same durable memory pool.

### Available Tools

| Tool | Purpose | When to Use |
| :--- | :--- | :--- |
| `memory_briefing` | Retrieves active plan, recent changes, decisions, facts, and previous handoffs. | At session start or before beginning complex tasks. |
| `memory_search` | Semantically queries memories and indexed documentation (`AGENTS.md`, `CLAUDE.md`, notes). | When researching domain logic or looking up past solutions. |
| `memory_remember` | Stores durable decisions, facts, failures, or architecture notes. | Whenever an architectural decision or fix is finalized. |
| `memory_changes` | Returns memory mutations made by other sessions since last sync. | In multiplayer environments or long-running tasks. |
| `memory_get` | Retrieves a specific memory item by its unique key. | To inspect full history and provenance. |

### How to Record Memories (`memory_remember`)

When invoking `memory_remember`, classify the memory using one of four `kind` values:
1. `decision`: A significant technical choice that was made, and the underlying rationale.
2. `fact`: A durable convention, requirement, or platform truth (e.g. single source of truth rules).
3. `failure`: A dead end, anti-pattern, or bug not to be repeated.
4. `architecture`: How modules, layers, or services connect.

> [!TIP]
> Always check existing records with `memory_search` before storing to avoid duplicates. To update an existing memory, reuse its `key`.

---

## 3. Project Configuration & Workspace Setup

### Binding a Project to the Organization
To connect a local repository to the `atlas` organization:

```bash
# Initialize Atlas CLI and link to organization
atlas-cli init --org atlas
```

This establishes:
- Local `.atlas/` project configuration directory.
- Background session capture listener.
- Agent hook registrations across local IDEs and terminal CLIs.

### Multi-Repository Workspaces
If managing multiple sub-repositories under one monorepo or root directory:

```bash
atlas-cli init --workspace --org atlas
```

---

## 4. Configuration Guardrails

- User preferences are stored in `~/.config/atlas/config.toml`.
- Project-specific overrides reside in `.atlas/config.toml`.
- Never store API keys, tokens, or personal credentials inside `config.toml`.
- Never delete unrecognized keys from configuration files.
