# centralize-e2e-tests_20260307: Implementation Plan

**Status**: completed
**Branch**: refactor/centralize-e2e-tests_20260307

## Phase 1: Project Setup
Agent: backend-qa

- [ ] 1.1 — Create `e2e-tests/` directory with `package.json`, `tsconfig.json`, and Playwright dependency
- [ ] 1.2 — Create `playwright.config.ts` with two projects: `api` (request-only, no browser) and `ui` (browser-based)
- [ ] 1.3 — Create `.env.example` with `GATEWAY_URL`, `API_KEY`, and `BASE_UI_URL` variables
- [ ] 1.4 — Add `e2e-tests/node_modules` to root `.gitignore`

## Phase 2: Backend API Tests
Agent: backend-qa

- [ ] 2.1 — Health & status tests: `GET /health`, `GET /`
- [ ] 2.2 — Models endpoint test: `GET /v1/models` (verify response shape, model list)
- [ ] 2.3 — OpenAI chat completions: `POST /v1/chat/completions` (non-streaming, verify response format)
- [ ] 2.4 — OpenAI streaming: `POST /v1/chat/completions` with `stream: true` (verify SSE chunks)
- [ ] 2.5 — Anthropic messages: `POST /v1/messages` (non-streaming, verify response format)
- [ ] 2.6 — Anthropic streaming: `POST /v1/messages` with `stream: true` (verify SSE events)
- [ ] 2.7 — Auth error tests: missing key, invalid key → 401/403

## Phase 3: Frontend E2E Migration
Agent: frontend-qa

- [ ] 3.1 — Move `frontend/e2e/specs/*.spec.ts` to `e2e-tests/specs/ui/`
- [ ] 3.2 — Move `frontend/e2e/helpers/`, `global-setup.ts` to `e2e-tests/`
- [ ] 3.3 — Update all import paths in migrated specs
- [ ] 3.4 — Update `frontend/package.json` test scripts to point to `../e2e-tests/`
- [ ] 3.5 — Remove `frontend/e2e/` directory and old Playwright configs

## Phase 4: Verification & Cleanup
Agent: backend-qa

- [ ] 4.1 — Verify `cd e2e-tests && npx playwright test --project=api` runs all API tests
- [ ] 4.2 — Verify `cd e2e-tests && npx playwright test --project=ui` runs all browser tests
- [ ] 4.3 — Verify `npx playwright test` runs both suites together
- [ ] 4.4 — Update `CLAUDE.md` and `conductor/workflow.md` with new test commands
