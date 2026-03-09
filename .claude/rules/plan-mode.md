# Plan Mode Rules

Applies when Claude Code is in Plan mode.

## Agent Awareness

Before planning, read `.claude/agents/*.md` to understand available agents and their capabilities. Use agents as Explore subagents during the planning phase to get domain-specific insights:

- For backend questions → spawn Explore agent with context from `rust-backend-engineer.md`
- For frontend questions → spawn Explore agent with context from `react-frontend-engineer.md`
- For infrastructure questions → spawn Explore agent with context from `devops-engineer.md`

## Plan Output Format

Every non-trivial plan must include an **Agent Assignment** section that maps tasks to agents:

### Task Decomposition

Structure tasks in waves for parallel execution:

- **Wave 1** (foundations): Backend types, DB migrations, core logic
  - Assigned to: `rust-backend-engineer`
- **Wave 2** (consumers): Frontend pages, API integration
  - Assigned to: `react-frontend-engineer`
- **Wave 3** (verification): Unit tests, E2E tests
  - Assigned to: `backend-qa`, `frontend-qa`

### Team Preset Recommendation

Based on affected services, recommend a team preset:
- Backend only → `backend-feature`
- Frontend only → `frontend-feature`
- Both → `fullstack`
- Infrastructure → `infra`

### File Ownership

Assign each file to exactly one agent. No overlaps.

## Rules Reference

Read `.claude/rules/*.md` to ensure plans follow project conventions:
- `backend.md` — Rust/Axum patterns, error handling, testing
- `web-ui.md` — React 19, TypeScript, CRT aesthetic, API patterns
