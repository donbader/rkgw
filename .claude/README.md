# .claude/ — Full Documentation

This directory is the AI workflow infrastructure for Harbangan. It provides a fully self-contained multi-agent system optimized for the Harbangan Rust/React architecture.

## Directory Layout

```
.claude/
├── CLAUDE.md                    # Quick reference (structure + skill table)
├── README.md                    # This file (full documentation)
├── settings.json                # Claude Code configuration
├── agents/                      # 7 agent definitions
├── skills/                      # 9 invocable skills
├── agent-memory/                # Persistent per-agent memory
├── rules/                       # Coding standards + plan mode rules
└── plans/                       # Implementation plans
```

---

## Agents (7 total)

Each agent is a `.md` file with YAML frontmatter defining its name, description, tools, model, and memory scope. The body contains domain-specific context.

### Implementation Agents (4)

| Agent | Service | Stack | Model |
|-------|---------|-------|-------|
| `rust-backend-engineer` | Backend (`backend/`) | Rust, Axum 0.7, Tokio, sqlx, PostgreSQL | inherit |
| `react-frontend-engineer` | Frontend (`frontend/`) | React 19, TypeScript 5.9, Vite 7 | inherit |
| `devops-engineer` | Infrastructure | Docker, nginx, Let's Encrypt | inherit |
| `document-writer` | Documentation | Notion API, Slack API, Markdown | inherit |

### Quality Agents (2)

| Agent | Scope | Focus |
|-------|-------|-------|
| `backend-qa` | `backend/src/` tests | cargo test, 395+ unit tests, tokio::test |
| `frontend-qa` | `frontend/` | Playwright E2E tests, browser testing |

### Orchestration Agent (1)

| Agent | Role | Model |
|-------|------|-------|
| `scrum-master` | Workflow coordinator — decomposes tasks, spawns teams, monitors progress | opus |

---

## Skills (9 total)

Skills are invocable via `/skill-name [arguments]`.

### Team Skills (7) — Multi-Agent Orchestration

| Skill | Purpose | Key Arguments |
|-------|---------|---------------|
| `/team-spawn` | Spawn team from presets | `[preset] [--delegate]` |
| `/team-feature` | Full feature orchestration | `"description" [--preset name] [--plan-first]` |
| `/team-delegate` | Task assignment dashboard | `team-name [--assign\|--message\|--broadcast]` |
| `/team-status` | Show team status | `[team-name] [--tasks] [--members] [--json]` |
| `/team-review` | Multi-dimensional code review | `[target] [--preset name] [--base branch]` |
| `/team-debug` | Hypothesis-driven debugging | `"error" [--scope path] [--hypotheses N]` |
| `/team-shutdown` | Graceful team termination | `team-name [--force] [--keep-config]` |

**Team presets:**

| Preset | Members | Use Case |
|--------|---------|----------|
| `fullstack` | scrum-master + rust-backend + react-frontend + frontend-qa | Full-stack feature |
| `backend-feature` | scrum-master + rust-backend + backend-qa | Backend-only feature |
| `frontend-feature` | scrum-master + react-frontend + frontend-qa | Frontend-only feature |
| `review` | rust-backend + react-frontend + backend-qa | Code review |
| `debug` | rust-backend + react-frontend + devops | Debugging |
| `infra` | scrum-master + devops + rust-backend | Infrastructure changes |
| `docs` | scrum-master + document-writer | Documentation |

### Other Skills (2)

| Skill | Purpose |
|-------|---------|
| `team-coordination` | Reference: file ownership rules, communication protocols, team sizing |
| `humanizer` | Remove signs of AI-generated writing from text |

---

## How Plan Mode and Team Skills Connect

**Plan mode owns the plan, team skills own the people.**

### Planning to Execution Flow

```
Plan mode (explore + design)  →  /team-spawn {preset}
                              →  or /team-feature {title}
TaskList (task decomposition)  →  /team-delegate (assign to agents)
/team-status                   →  monitor progress
Quality Gates (from CLAUDE.md) →  verify completion
/team-shutdown                 →  clean up
```

### Scrum Master Workflow

```
1. Read CLAUDE.md Service Map     — identify affected services
2. Read .claude/agents/*.md       — match services to agents
3. Decompose into TaskList items  — wave-based ordering
4. /team-spawn {preset}           — spawn the right team
5. /team-delegate                 — assign tasks with dependencies
6. /team-status                   — monitor progress
7. Verify against Quality Gates   — from CLAUDE.md
```

---

## Settings

`settings.json` configures:

- **Plugins**: playwright (browser automation), Notion (workspace), slack (messaging), commit-commands, rust-analyzer-lsp, context7, frontend-design, agent-teams
- **Environment**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` for multi-agent support
- **Teammate mode**: `iterm2` (agents spawn as iTerm2 tabs with distinct colors)
- **MCP servers**: deepwiki enabled
