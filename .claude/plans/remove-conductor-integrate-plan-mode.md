# Plan: Remove Conductor, Integrate Plan Mode with Agent Teams

## Context

The project currently uses a custom "Conductor" system (tracks, specs, plans, metadata) for project management, alongside Claude Code's built-in Plan mode. The user wants to drop Conductor entirely and rely on Plan mode as the planning layer, while keeping the multi-agent team system. The goal is to make Plan mode agent-aware by default — so every plan it produces is structured for parallel agent execution.

Two key integrations needed:
1. Plan mode should know about `.claude/agents/` and `.claude/rules/` so it can use the right subagents during exploration and planning
2. Plan mode output should default to wave-based task decomposition that maps to agent teams

---

## Phase 1: Delete Conductor Skills and Related Artifacts

### 1.1 Delete 6 conductor skill directories
```
rm -rf .claude/skills/conductor-implement/
rm -rf .claude/skills/conductor-manage/
rm -rf .claude/skills/conductor-new-track/
rm -rf .claude/skills/conductor-revert/
rm -rf .claude/skills/conductor-setup/
rm -rf .claude/skills/conductor-status/
```

### 1.2 Delete 2 reference skill directories
```
rm -rf .claude/skills/track-management/
rm -rf .claude/skills/workflow-patterns/
```

### 1.3 Delete conductor-validator agent
```
rm .claude/agents/conductor-validator.md
```

### 1.4 Delete conductor-validator agent memory (if exists)
```
rm -rf .claude/agent-memory/conductor-validator/
```

---

## Phase 2: Inline Tech Stack into CLAUDE.md

The `team-feature` and `team-spawn` skills currently read `conductor/tech-stack.md` for service detection, keyword matching, and verification commands. Move this into the project's root `CLAUDE.md` under a new section.

### 2.1 Add "Service Map" section to `/CLAUDE.md`

Add after the "Architecture" section. Content derived from `conductor/tech-stack.md`:

```markdown
## Service Map

Used by agent teams for scope detection, agent assignment, and verification.

| Service | Path | Technologies | Agent Role Keywords | Verification |
|---------|------|-------------|--------------------|----|
| Backend | `backend/` | Rust, Axum 0.7, Tokio, sqlx 0.8, PostgreSQL 16 | backend, rust, axum | `cargo clippy --all-targets && cargo test --lib` |
| Frontend | `frontend/` | React 19, TypeScript 5.9, Vite 7, react-router-dom v7 | frontend, react, typescript | `npm run build && npm run lint` |
| Infrastructure | `docker-compose*.yml`, `frontend/Dockerfile` | Docker, nginx, Let's Encrypt | infrastructure, docker, nginx, deploy | `docker compose config --quiet` |
| Backend QA | `backend/src/` (test modules) | cargo test, tokio::test | test, backend | `cargo test --lib` |
| Frontend QA | `e2e-tests/` | Playwright | test, E2E, browser, playwright | `npm test` |
| Documentation | — | Markdown, Notion API, Slack API | documentation, docs, writing | — |
```

### 2.2 Add "Quality Gates" section to `/CLAUDE.md`

Preserve the useful quality gate info from workflow-patterns (this is project-specific, not conductor-specific):

```markdown
## Quality Gates

### Backend
| Gate | Command | Must Pass |
|------|---------|-----------|
| Lint | `cd backend && cargo clippy --all-targets` | Zero warnings |
| Format | `cd backend && cargo fmt --check` | No diffs |
| Tests | `cd backend && cargo test --lib` | Zero failures |

### Frontend
| Gate | Command | Must Pass |
|------|---------|-----------|
| Build | `cd frontend && npm run build` | Zero errors |
| Lint | `cd frontend && npm run lint` | Zero errors |
```

### 2.3 Add "TDD Policy" section to `/CLAUDE.md`

Preserve the Harbangan-specific TDD policy from workflow-patterns:

```markdown
## TDD Policy

### Required TDD (test BEFORE implementation)
- Streaming parser, auth token refresh, converter bidirectional, middleware auth chain, guardrails engine

### Recommended TDD (test alongside)
- Route handlers, HTTP client, model cache, resolver

### Skip TDD (test after)
- Docker config, static UI components, CSS-only, env vars, docs
```

---

## Phase 3: Update Team Skills to Read CLAUDE.md Instead of conductor/

### 3.1 Update `team-feature/SKILL.md`

**File:** `.claude/skills/team-feature/SKILL.md`

Changes:
- Step 1: Replace "Read `conductor/tech-stack.md`" with "Read the Service Map section from `CLAUDE.md`"
- Remove all references to `conductor/tech-stack.md`
- Remove the description's reference to "conductor context" — change to "project context"
- Remove the "Do NOT use for executing tasks from an existing track plan (use conductor-implement)" from description

### 3.2 Update `team-spawn/SKILL.md`

**File:** `.claude/skills/team-spawn/SKILL.md`

Changes:
- Step 1.2: Replace "Read `conductor/tech-stack.md`" with "Read the Service Map section from `CLAUDE.md`"
- Step 5: Remove "Note track association if `conductor/tracks.md` exists"

---

## Phase 4: Rewrite Scrum Master Agent

**File:** `.claude/agents/scrum-master.md`

Replace the entire "Conductor Integration" section (lines 35-91) with a Plan Mode + TaskList workflow:

```markdown
## Workflow Integration — Plan Mode + Agent Teams

You coordinate work through Claude Code's built-in Plan mode and TaskList system.

### Workflow: New Feature Request

1. **Analyze scope** — read CLAUDE.md Service Map to identify affected services
2. **Identify agents** — read `.claude/agents/*.md` to match services to agents
3. **Decompose into tasks** — create TaskList items with wave-based ordering:
   - Wave 1: Core/backend (foundations)
   - Wave 2: Consumer (frontend, integration)
   - Wave 3: Verification (QA, testing)
   - Wave 4: Documentation
4. **Spawn team** via `/team-spawn` with the right preset
5. **Delegate** via `/team-delegate` — assign tasks with dependencies
6. **Monitor** via `/team-status`
7. **Verify** against Quality Gates in CLAUDE.md

### Definition of Done (enforce for every task)

- [ ] Implementation matches requirements
- [ ] Lint passes (`cargo clippy`, `npm run lint`)
- [ ] Tests pass (existing + new if applicable)
- [ ] No regressions introduced

### Team Skills Reference

| Skill | When to Use |
|-------|-------------|
| `/team-spawn [preset]` | Initialize a team |
| `/team-status [team]` | Check member and task status |
| `/team-delegate [team]` | Assign tasks, send messages |
| `/team-feature [desc]` | Full orchestration: scope → plan → spawn → assign → verify |
| `/team-review [target]` | Multi-dimensional code review |
| `/team-debug [error]` | Hypothesis-driven debugging |
| `/team-shutdown [team]` | Graceful team termination |
```

Remove all references to:
- `conductor/product.md`, `conductor/tech-stack.md`, `conductor/workflow.md`, `conductor/tracks.md`
- `/conductor-new-track`, `/conductor-status`, `/conductor-implement`
- "Conductor lifecycle" task states

---

## Phase 5: Update .claude/CLAUDE.md

**File:** `.claude/CLAUDE.md`

Rewrite to reflect the new structure:

- Remove "Two Skill Families" section (no more conductor family)
- Remove conductor entries from Quick Reference table
- Remove `conductor-validator.md` from the agents tree
- Update skills tree to show only team-* and humanizer
- Update the structure tree to remove `conductor-*/`, `track-management/`, `workflow-patterns/`
- Change "Agents using `/team-feature` or `/conductor-implement`" to just "Agents using `/team-feature`"
- Update agent count from 8 to 7
- Update skill count from 16 to 9 (7 team + humanizer + team-coordination ref)

---

## Phase 6: Make Plan Mode Agent-Team Aware

This is the core integration. We need Plan mode to:
1. Know about available agents and their capabilities
2. Default to producing plans structured for parallel agent execution

### 6.1 Create `.claude/rules/plan-mode.md`

New rule file that activates when Plan mode is used. Content:

```markdown
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
```

---

## Verification

After all changes:

1. Confirm deleted: 6 conductor skills, 2 reference skills, conductor-validator agent
2. Confirm `CLAUDE.md` has Service Map, Quality Gates, TDD Policy sections
3. Confirm `team-feature/SKILL.md` and `team-spawn/SKILL.md` no longer reference `conductor/`
4. Confirm `scrum-master.md` no longer references conductor
5. Confirm `.claude/CLAUDE.md` structure tree is accurate
6. Confirm `.claude/rules/plan-mode.md` exists
7. Run: `grep -r "conductor" .claude/` — should return zero hits (except possibly in plans/ history)

---

## Files Modified

| File | Action |
|------|--------|
| `.claude/skills/conductor-*` (6 dirs) | DELETE |
| `.claude/skills/track-management/` | DELETE |
| `.claude/skills/workflow-patterns/` | DELETE |
| `.claude/agents/conductor-validator.md` | DELETE |
| `.claude/agent-memory/conductor-validator/` | DELETE (if exists) |
| `CLAUDE.md` (root) | ADD Service Map, Quality Gates, TDD Policy sections |
| `.claude/skills/team-feature/SKILL.md` | EDIT — replace conductor refs with CLAUDE.md |
| `.claude/skills/team-spawn/SKILL.md` | EDIT — replace conductor refs with CLAUDE.md |
| `.claude/agents/scrum-master.md` | REWRITE — replace conductor workflow with Plan mode + TaskList |
| `.claude/CLAUDE.md` | EDIT — remove conductor refs, update structure tree |
| `.claude/rules/plan-mode.md` | CREATE — plan mode agent-awareness rules |

## Not Touched

- `conductor/` directory at repo root — left as-is (separate cleanup if desired)
- All team-* skills except team-feature and team-spawn — no conductor refs
- All other agents — no conductor refs
- `.claude/settings.json` — no changes needed
