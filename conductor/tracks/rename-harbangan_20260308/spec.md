# rename-harbangan_20260308: Rename rkgw → Harbangan

**Type**: refactor
**Created**: 2026-03-08
**Preset**: custom (4 parallel rename agents)
**Services**: backend, frontend, infra, docs

## Problem Statement

The project is being rebranded from "rkgw" (Rust Kiro Gateway) to "Harbangan". This is a full rename affecting the Rust crate name (`kiro-gateway` → `harbangan`), binary name, Docker images, GitHub repo URL, documentation, and all display text. The GitHub repo will also be renamed from `if414013/rkgw` to `if414013/harbangan`.

## Naming Map

| Old | New |
|-----|-----|
| `rkgw` (project name) | `harbangan` |
| `kiro-gateway` (crate/binary) | `harbangan` |
| `rkgw — Rust Kiro Gateway` (display) | `Harbangan` |
| `kiro-gateway-backend` (Docker image) | `harbangan-backend` |
| `kiro-gateway-frontend` (Docker image) | `harbangan-frontend` |
| `rkgw-backend` (Datadog service) | `harbangan-backend` |
| `rkgw-frontend` (Datadog service) | `harbangan-frontend` |
| `rkgw-gateway` (Datadog service) | `harbangan-gateway` |
| `rkgw-proxy` (OIDC client) | `harbangan-proxy` |
| `rkgw-theme` (localStorage key) | `harbangan-theme` |
| `if414013/rkgw` (GitHub repo) | `if414013/harbangan` |
| `KiroGateway` (Homebrew class) | `Harbangan` |
| `kiro-gateway-{target}.tar.gz` (release) | `harbangan-{target}.tar.gz` |

## Acceptance Criteria

1. All occurrences of `rkgw` and `kiro-gateway` in tracked files are replaced with `harbangan`
2. `cargo build --release` succeeds with new binary name `harbangan`
3. `cargo test --lib` — all tests pass
4. `cargo clippy` — no warnings
5. `cd frontend && npm run build` — builds cleanly
6. `grep -ri "rkgw\|kiro-gateway"` returns zero matches in source files (excluding target/, node_modules/, .git/)
7. Docker compose configs parse correctly

## Scope Boundaries

**In scope:** All file content changes for the rename across backend, frontend, infra, docs, CI/CD, and agent definitions.

**Out of scope (manual user actions after merge):**
- Rename GitHub repo `if414013/rkgw` → `if414013/harbangan`
- Rename local directory
- Re-provision SSL certs under new name
- Update `.mcp.json` absolute paths
- Update Homebrew tap repo
- Conductor artifacts themselves (will be updated as part of docs phase)

## Dependencies

None — this is a standalone refactor.
