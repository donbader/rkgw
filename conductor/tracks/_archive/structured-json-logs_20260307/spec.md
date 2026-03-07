# structured-json-logs_20260307: Standardize Backend Logs into Structured JSON

**Type**: chore
**Created**: 2026-03-07
**Preset**: backend-feature
**Services**: backend

## Problem Statement

Backend logs currently output JSON when Datadog is configured but lack Datadog-standard correlation fields (`dd.trace_id`, `dd.span_id`) and user attribution (`usr.id`). The `http_request` span only captures `method` and `path` — no user context. This prevents end-to-end request tracing in Datadog APM and makes debugging user-reported issues difficult.

## Success Criteria

1. All backend JSON logs include `dd.trace_id` and `dd.span_id` fields that correlate with Datadog APM traces
2. Logs from authenticated requests include `usr.id` field with the user's UUID
3. Clicking a trace in Datadog APM shows correlated logs
4. No measurable performance degradation from the logging changes

## Scope Boundaries

**In scope:**
- Backend Rust tracing layer changes
- JSON log field enrichment (dd.trace_id, dd.span_id, usr.id)
- Span context propagation through request lifecycle

**Out of scope:**
- Frontend logging
- Datadog dashboard creation
- Log volume optimization
- Backwards compatibility with existing log format

## Dependencies

- Existing `datadog.rs` module (OpenTelemetry + Datadog APM pipeline)
- `tracing-subscriber` JSON formatter
- Auth middleware (`middleware/mod.rs`) where `user_id` is resolved
