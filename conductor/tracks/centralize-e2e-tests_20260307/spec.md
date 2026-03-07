# centralize-e2e-tests_20260307: Centralize Real Backend API Tests to e2e-tests

**Type**: refactor
**Created**: 2026-03-07
**Preset**: backend-feature
**Services**: backend-qa, frontend-qa

## Problem Statement
Real API tests are scattered and incomplete. Backend has no proper end-to-end API tests against a running gateway — only in-memory router tests and benchmarks. Frontend Playwright tests live in `frontend/e2e/`. There's no unified place to run release-gate validation that confirms all endpoints (`/v1/chat/completions`, `/v1/messages`, `/v1/models`, etc.) work against a live gateway with real provider connections.

## Success Criteria
- `e2e-tests/` directory at project root with a single Playwright project
- Backend API tests: Playwright `request` context hitting real gateway endpoints (OpenAI format, Anthropic format, models, health)
- Frontend browser tests: existing Playwright specs migrated from `frontend/e2e/`
- Single `npx playwright test` command runs both API and browser test suites
- Tests are parameterized by gateway URL and API key (env vars)
- Existing `frontend/e2e/` references updated or redirected

## Scope Boundaries
- OUT: Modifying the backend Rust code or benchmark tool
- OUT: Writing mock servers — these tests hit real providers
- OUT: CI/CD pipeline integration (future track)

## Risk Assessment
- Provider availability: tests depend on live Anthropic/OpenAI/Gemini APIs; flaky if providers are down. Mitigate with timeouts and clear skip annotations.
- Breaking existing setup: moving `frontend/e2e/` could break npm scripts and any existing references. Mitigate by updating all references and verifying `npm run` commands still work.

## Dependencies
- Running gateway instance with valid API keys for all providers
- Existing frontend Playwright tests in `frontend/e2e/`
