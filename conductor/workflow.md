# Workflow - rkgw

## TDD Policy

**Level: Moderate** - Tests are encouraged but not blocking.

- Backend: Write unit tests for new logic. The existing suite has 395+ tests.
- Frontend: E2E tests via Playwright for critical user flows.
- Tests should follow existing patterns: `test_<function>_<scenario>` naming, `#[tokio::test]` for async.
- Don't block PRs on test coverage, but aim to maintain or increase coverage.

## Commit Strategy

**Conventional Commits** - All commits follow the conventional format:

```
feat: add new feature
fix: resolve bug in module
refactor: restructure code without behavior change
test: add or update tests
docs: update documentation
chore: maintenance, dependencies, CI
```

- Keep commits atomic: one logical change per commit
- Write clear commit messages explaining "why" not "what"
- Reference issue/track IDs when applicable

## Code Review Policy

**Optional / Self-review OK** - Solo developer workflow.

- Self-review changes before merging to main
- Use `cargo clippy` and `npm run lint` before committing
- Fix ALL warnings before committing (per CLAUDE.md)
- For significant changes, use `/agent-teams:team-review` for automated multi-dimensional review (see Agent Teams Integration below)

## Verification Checkpoints

**After each task completion** - Verify each task before moving on.

### Verification Steps

1. **Backend changes:**
   - `cargo clippy` passes with no warnings
   - `cargo test --lib` passes (all 395+ tests)
   - `cargo fmt` applied
   - Manual smoke test via Docker Compose if endpoint behavior changed

2. **Frontend changes:**
   - `npm run lint` passes
   - `npm run build` succeeds
   - Playwright E2E tests pass for affected areas
   - Visual verification in browser for UI changes

3. **Infrastructure changes:**
   - `docker compose build` succeeds
   - `docker compose up -d` starts all services
   - Health check passes (`/health` endpoint)

## Task Lifecycle

```
pending → in_progress → completed
                     → blocked (needs dependency resolved)
```

- Tasks are created via `/conductor:new-track`
- Mark `in_progress` before starting work
- Run verification checklist before marking `completed`
- If blocked, document the blocker and notify

## Agent Teams Integration

Conductor tracks define the work; Agent Teams execute it in parallel. Both plugins are enabled in this project.

### When to use Agent Teams

| Scenario | Command | Team Preset |
|----------|---------|-------------|
| Parallel tasks within a track phase | `/agent-teams:team-spawn feature` | 1 lead + 2 implementers |
| Full-stack track (frontend + backend + tests) | `/agent-teams:team-spawn fullstack` | 1 lead + 3 implementers |
| Multi-dimensional code review after track completion | `/agent-teams:team-spawn review` | 3 reviewers |
| Debugging a complex issue | `/agent-teams:team-spawn debug` | 3 investigators |
| Documentation or research across many files | `/agent-teams:team-spawn research` | 3 researchers |

### Integration patterns

**Pattern A: Parallel tasks within a track**

1. Create a track: `/conductor:new-track "feature description"`
2. Review the generated `plan.md` — identify independent tasks in the same phase
3. Spawn a team: `/agent-teams:team-spawn feature`
4. Assign each independent task to a teammate with clear file ownership boundaries
5. All teammates read `conductor/` context for consistent coding standards
6. Mark tasks `[x]` in `plan.md` as teammates complete them

**Pattern B: Multi-track parallel execution**

1. Create multiple independent tracks via `/conductor:new-track`
2. Spawn one teammate per track — each owns their full track lifecycle
3. Teammates follow the same verification checkpoints defined above

**Pattern C: Review after track completion**

1. Complete a track's implementation tasks
2. Run `/agent-teams:team-spawn review` to spawn reviewers
3. Each reviewer checks a different dimension (security, performance, architecture)
4. Feed findings back as follow-up tasks in the track or a new bugfix track

### Rules for parallel execution

- **Independence only** — only parallelize tasks with no data dependencies. Conductor's phased plan structure helps: tasks within the same phase are candidates; tasks in later phases depend on earlier ones.
- **File ownership** — each teammate owns specific files. No two teammates edit the same file.
- **Conductor context is shared** — all teammates read from `conductor/` (product.md, tech-stack.md, style guides) for consistent standards.
- **Lead coordinates** — the team lead (or main agent) owns `plan.md` status updates and task assignment.
- **Verify before marking complete** — teammates follow the same verification checkpoints (clippy, tests, lint) before marking tasks done.

## Build Commands Reference

```bash
# Backend
cd backend && cargo build                     # Debug build
cd backend && cargo clippy                    # Lint
cd backend && cargo fmt                       # Format
cd backend && cargo test --lib                # Unit tests

# Frontend
cd frontend && npm run build                  # Production build
cd frontend && npm run lint                   # ESLint

# E2E Tests
cd e2e-tests && npm test                      # All tests (API + browser)
cd e2e-tests && npm run test:api              # Backend API tests only
cd e2e-tests && npm run test:ui               # Frontend browser tests only
cd e2e-tests && npm run test:setup            # Capture auth session

# Docker
docker compose build                          # Build all images
docker compose up -d                          # Start all services
```
