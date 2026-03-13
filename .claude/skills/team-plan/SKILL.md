---
name: team-plan
description: Analyze scope, explore codebase, and produce implementation plans. Spawns Explore agents for parallel investigation, consults domain expertise, and writes structured plans. Use when user says 'plan this feature', 'analyze scope', 'what would it take to build X', or 'explore before implementing'.
argument-hint: "[feature-description] [--scope path] [--output plan|review]"
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - AskUserQuestion
  - Agent
---

# Team Plan

Analyze scope, explore the codebase, and produce structured implementation plans.

## Phase 1: Load Project Context

1. Read `CLAUDE.md` Service Map to identify all services and their verification commands
2. Read `.claude/agents/*.md` to build agent registry (name, description, tools, ownership)
3. Parse the user's feature description and `--scope` path (if provided)

## Phase 2: Parallel Exploration

Spawn up to 3 Explore agents in parallel, each focused on a domain perspective:

### Agent 1: Affected Code Areas
- Search for files matching the feature scope
- Identify existing patterns to follow
- Map file dependencies

### Agent 2: Related Tests & Coverage
- Find existing test files for affected modules
- Identify coverage gaps
- Note test patterns to follow

### Agent 3: Integration Points & Dependencies
- Map cross-service dependencies (API contracts, shared types)
- Identify infrastructure implications
- Check for migration needs

Each agent searches from its domain perspective (backend patterns, frontend patterns, infra patterns).

## Phase 3: Scope Analysis

Using exploration results:

1. **Classify affected services** — map each change to a service from the Service Map
2. **Identify file ownership boundaries** — one agent per file, no overlaps
3. **Estimate complexity** — small/medium/large per service based on:
   - Number of files to create/modify
   - Cross-service dependencies
   - Test coverage needed

## Phase 4: Wave Decomposition

Break work into dependency-ordered waves:

- **Wave 1** (foundations): Types, schemas, core logic, migrations
- **Wave 2** (consumers): Handlers, UI components, API integration
- **Wave 3** (verification): Unit tests, E2E tests, integration tests
- **Wave 4** (documentation): API docs, architecture updates (if needed)

Each wave lists:
- Tasks with file assignments
- Dependencies on prior waves
- Agent assignments
- Verification commands

## Phase 5: Plan Output

Write plan to `.claude/plans/` with:

1. **Consultation Summary** — findings from each Explore agent
2. **File Manifest** — files to create/modify, one owner per file
3. **Wave Structure** — dependency graph with tasks per wave
4. **Interface Contracts** — API shapes, type definitions shared between services
5. **Verification Commands** — per-service quality gates from CLAUDE.md
6. **Recommended Team Preset** — for `/team-implement`

## Phase 6: Create Board Items

After writing the plan file, create GitHub Issues for each wave task and add them to the Harbangan Board:

```bash
gh issue create --title "[service]: task description" \
  --label "service:{service},priority:{p0|p1|p2}" \
  --project "Harbangan Board" \
  --body "From plan: {plan-file-name}\n\nDescription and acceptance criteria\n\nDepends on #N"
```

After creating each issue, set board fields:
- Status → Backlog
- Priority → based on task criticality (P0/P1/P2)
- Size → based on complexity estimate (XS/S/M/L/XL)

Include the issue numbers in the plan file for traceability (update the plan after issue creation).

### Plan File Format

```markdown
# Plan: {feature-name}

## Consultation Summary
- Backend: {findings}
- Frontend: {findings}
- Infrastructure: {findings}

## File Manifest
| File | Action | Owner | Wave |
|------|--------|-------|------|
| ... | create/modify | agent-name | 1 |

## Wave 1: {name}
- [ ] Task description (assigned: agent-name)
  - Files: ...
  - Depends on: none

## Wave 2: {name}
...

## Interface Contracts
...

## Verification
...

## Recommended Preset
`/team-implement --preset {name}`
```
