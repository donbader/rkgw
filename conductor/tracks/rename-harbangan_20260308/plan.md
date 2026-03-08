# rename-harbangan_20260308: Implementation Plan

**Status**: planned
**Branch**: chore/rename-harbangan

## Phase 1: Parallel Rename (4 agents, independent file ownership)

All 4 tasks run simultaneously. No file overlap between agents.

### 1A — Backend Rename
Agent: rust-backend-engineer

- [ ] 1A.1 — Rename crate and binary in `backend/Cargo.toml` (`kiro-gateway` → `harbangan`)
- [ ] 1A.2 — Update `backend/Dockerfile` (binary build target, COPY path, entrypoint binary)
- [ ] 1A.3 — Update `backend/entrypoint.sh` (comment, OIDC clientName `rkgw-proxy` → `harbangan-proxy`, binary exec path)
- [ ] 1A.4 — Update `backend/src/providers/qwen.rs` (`x-dashscope-client` header)
- [ ] 1A.5 — Update `backend/src/web_ui/provider_oauth.rs` (shell script comment text)
- [ ] 1A.6 — Verify: `cargo build --release`, `cargo test --lib`, `cargo clippy`, `cargo fmt`

### 1B — Frontend Rename
Agent: react-frontend-engineer

- [ ] 1B.1 — Update `frontend/src/lib/theme.tsx` (localStorage key `rkgw-theme` → `harbangan-theme`)
- [ ] 1B.2 — Update `frontend/src/lib/datadog.ts` (fallback service name `rkgw-frontend` → `harbangan-frontend`)
- [ ] 1B.3 — Verify: `npm run build`, `npm run lint`

### 1C — Infrastructure Rename
Agent: devops-engineer

- [ ] 1C.1 — Update `docker-compose.yml` (image names `kiro-gateway-*` → `harbangan-*`, Datadog labels `rkgw-*` → `harbangan-*`, VITE_DD_SERVICE)
- [ ] 1C.2 — Update `docker-compose.gateway.yml` (image name, Datadog labels)
- [ ] 1C.3 — Update `frontend/nginx.conf` (SSL cert paths `/etc/letsencrypt/live/rkgw/` → `/etc/letsencrypt/live/harbangan/`)
- [ ] 1C.4 — Update `.env.example` (DD_SERVICE, VITE_DD_SERVICE)
- [ ] 1C.5 — Update `.github/workflows/release.yml` (artifact names `kiro-gateway-*` → `harbangan-*`, Homebrew formula class `KiroGateway` → `Harbangan`, homepage/download URLs `rkgw` → `harbangan`)
- [ ] 1C.6 — Verify: `docker compose config`, `docker compose -f docker-compose.gateway.yml config`

### 1D — Documentation Rename
Agent: document-writer

- [ ] 1D.1 — Update `README.md` (title, clone URL, doc links, anchor links)
- [ ] 1D.2 — Update `CLAUDE.md` (root — project structure references)
- [ ] 1D.3 — Update `gh-pages/_config.yml` (baseurl `/rkgw` → `/harbangan`, GitHub URLs)
- [ ] 1D.4 — Update `gh-pages/index.md` and all gh-pages markdown files (all `rkgw` and `kiro-gateway` references)
- [ ] 1D.5 — Update `.claude/CLAUDE.md` and `.claude/README.md`
- [ ] 1D.6 — Update all `.claude/agents/*.md` (8 files — replace "rkgw Gateway" → "Harbangan")
- [ ] 1D.7 — Update `conductor/product.md`, `conductor/tech-stack.md`, `conductor/workflow.md` (project name references)
- [ ] 1D.8 — Update `.claude/agent-memory/` files (any rkgw references)

## Phase 2: Final Verification
Agent: lead (after all Phase 1 agents complete)

- [ ] 2.1 — Run comprehensive grep: `grep -ri "rkgw\|kiro-gateway" --include="*.rs" --include="*.ts" --include="*.tsx" --include="*.yml" --include="*.yaml" --include="*.toml" --include="*.json" --include="*.md" --include="*.html" --include="*.sh" --include="*.conf" .` — expect zero matches (excluding target/, node_modules/, .git/)
- [ ] 2.2 — Run `cargo build --release` (full build with new binary name)
- [ ] 2.3 — Run `cargo test --lib` (all 395+ tests pass)
- [ ] 2.4 — Run `cd frontend && npm run build`
- [ ] 2.5 — Commit all changes and open PR
