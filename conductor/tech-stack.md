# Tech Stack - rkgw

## Languages

| Language | Version | Scope |
|----------|---------|-------|
| Rust | stable (2021 edition) | Backend API server |
| TypeScript | 5.9 | Frontend SPA |
| SQL | PostgreSQL 16 dialect | Database schema/queries |

## Backend

| Component | Technology | Notes |
|-----------|-----------|-------|
| Web framework | Axum 0.7 | async, tower-based |
| Runtime | Tokio | async runtime |
| Database | sqlx 0.8 + PostgreSQL 16 | config persistence (Full Deployment only; Proxy-Only Mode runs without a database) |
| Auth | AWS SSO OIDC | per-user Kiro token refresh |
| Web auth | Google OAuth (PKCE + OIDC) | session cookies |
| HTTP client | reqwest | connection-pooled |
| Serialization | serde + serde_json | JSON throughout |
| Error handling | thiserror + anyhow | error enums + context propagation |
| Logging | tracing | structured, with web UI capture layer |
| Tokenizer | tiktoken (cl100k_base) | with 1.15x Claude correction |
| CEL engine | cel-interpreter | guardrail rule evaluation |
| Caching | DashMap | concurrent in-memory caches |

## Frontend

| Component | Technology | Notes |
|-----------|-----------|-------|
| Framework | React 19 | SPA |
| Build tool | Vite 7 | dev server + production build |
| Routing | react-router-dom v7 | base path `/_ui` |
| State | useState/useEffect | no state management library |
| Styling | Plain CSS + custom properties | CRT terminal aesthetic |
| Real-time | Server-Sent Events | via custom `useSSE` hook |
| E2E testing | Playwright | authenticated + public test suites |
| Linting | ESLint 9 + typescript-eslint | strict mode |

## Infrastructure

| Component | Technology | Notes |
|-----------|-----------|-------|
| Orchestration | Docker Compose | Two modes: Full (4 services) or Proxy-Only (1 service) |
| Reverse proxy | nginx | TLS termination, SPA fallback (Full Deployment only) |
| TLS | Let's Encrypt (certbot) | auto-renewal 12h cycle (Full Deployment only) |
| Database | PostgreSQL 16 | Docker service (Full Deployment only) |
| Target deployment | AWS (future) | Currently self-hosted Docker Compose |

## Docker Services

### Full Deployment (`docker-compose.yml`)

```
db        → PostgreSQL 16
backend   → Rust API server (plain HTTP, internal only, port 8000)
frontend  → nginx (serves React SPA + proxies to backend, ports 443/80)
certbot   → Let's Encrypt auto-renewal
```

### Proxy-Only Mode (`docker-compose.gateway.yml`)

```
gateway   → Rust API server (port 8000, device code auth via entrypoint.sh)
            No database, no nginx, no certbot
```

## Key Dependencies

### Backend (Cargo.toml)
- `axum` 0.7 - web framework
- `tokio` - async runtime
- `tower` 0.4 - middleware
- `reqwest` - HTTP client
- `serde` / `serde_json` - serialization
- `tracing` - structured logging
- `dashmap` - concurrent maps
- `uuid` - identifier generation
- `chrono` - timestamps

### Frontend (package.json)
- `react` ^19.2.0
- `react-dom` ^19.2.0
- `react-router-dom` ^7.13.1
- `@playwright/test` ^1.52.0 (dev)
- `typescript` ~5.9.3 (dev)
- `vite` ^7.3.1 (dev)
