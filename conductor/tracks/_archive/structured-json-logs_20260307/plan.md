# structured-json-logs_20260307: Implementation Plan

**Status**: completed
**Branch**: main

## Phase 1: Backend
Agent: rust-backend-engineer

- [x] 1.1 — Add `dd.trace_id` and `dd.span_id` fields to JSON log output
  - Added `otel_trace_id_to_dd()` and `otel_span_id_to_dd()` conversion functions
  - Created `dd_context_middleware` that records DD fields on the http_request span
  - Fixed: DdJsonFormat approach deadlocked due to re-entrancy; middleware approach is correct
  - Fixed: `opentelemetry-datadog` needed `reqwest-client` feature to connect to agent
  - Fixed: OTel layer must be innermost to avoid filtering events from fmt layer

- [x] 1.2 — Enrich `http_request` span with `user_id` after auth resolution
  - Added `usr.id = tracing::field::Empty`, `dd.trace_id`, `dd.span_id`, and `request_id` to `http_request` spans
  - Added `Span::current().record("usr.id", ...)` in auth middleware for both proxy and multi-user modes

- [x] 1.3 — Add `usr.id` field to JSON log output
  - Propagates automatically via span fields in the JSON formatter

- [x] 1.4 — Add structured fields to key log points across the codebase
  - Converted format-string logs to structured fields in `routes/mod.rs` (model, stream, messages, internal_id, source, verified)
  - Converted auth failure log in `middleware/mod.rs` to structured fields

- [x] 1.5 — Unit tests for log field enrichment
  - Added 8 tests for trace/span ID conversion (zero, max, known values, lower-64-bit extraction)

## Phase 2: QA
Agents: backend-qa

- [x] 2.1 — Verify Datadog log-trace correlation in deployed environment
  - Deployed with DD_AGENT_HOST=datadog-agent and datadog-agent dependency in docker-compose
  - JSON logs confirmed with dd.trace_id, dd.span_id, usr.id, request_id fields
  - Datadog Agent received 7 traces / 8 spans from rkgw-backend service

- [x] 2.2 — Performance smoke test
  - 10 health endpoint requests: avg ~2ms, no measurable latency increase
  - 407/407 unit tests pass
