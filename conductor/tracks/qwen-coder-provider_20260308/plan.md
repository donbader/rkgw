# qwen-coder-provider_20260308: Implementation Plan

**Status**: completed
**Branch**: feature/qwen-coder-provider

---

## Phase 1: Backend Foundation
Agent: rust-backend-engineer

- [x] 1.1 — Add `Qwen` variant to `ProviderId` enum in `providers/types.rs` with `#[serde(rename = "qwen")]`, `as_str()`, `Display`, `FromStr` impls, and unit tests (update all existing exhaustive test functions: `test_provider_id_as_str`, `test_provider_id_display`, `test_provider_id_from_str`, `test_provider_id_serialize`, `test_provider_id_deserialize`, `test_provider_id_serde_round_trip`)
- [x] 1.2 — Add `"qwen"` to `VALID_PROVIDERS` allowlist in `provider_priority.rs:67` and update `test_valid_providers_list` test. Also add to any other provider name validation points
- [x] 1.3 — Create `providers/qwen.rs` with full `QwenProvider` implementation: `Provider` trait (all 5 methods: `id()`, `execute_openai`, `stream_openai`, `execute_anthropic`, `stream_anthropic`), shared `send_request()` helper with Qwen-specific headers (`X-Dashscope-*`, `User-Agent`), `resource_url` base URL override, `anthropic_to_openai_body()` conversion reusing CopilotProvider pattern, `has_vision_content()` for `qwen-vl-*` models, Qwen3 dummy tool injection for streaming when no tools defined, `stream_options.include_usage: true` for streaming usage tracking. Read client ID from `QWEN_OAUTH_CLIENT_ID` env var with hardcoded fallback `f0304373b74a44d2b584a3fb70ca9e56`
- [x] 1.4 — Register `pub mod qwen;` in `providers/mod.rs`
- [x] 1.5 — Add `qwen*`/`qwq*` prefix matching in `provider_for_model()` in `providers/registry.rs`. Patterns: `qwen-`, `qwen3-`, `qwq-`
- [x] 1.6 — Add `"qwen"` to `load_user_data()` provider loop in `registry.rs:296` so Qwen tokens are loaded from `user_provider_tokens` into the credential cache. Store `base_url` from DB (populated from `resource_url` during token storage)
- [x] 1.7 — Add `qwen_provider: Arc<QwenProvider>` to `AppState` in `routes/mod.rs`, initialize in `main.rs`. Add match arms: group `ProviderId::Qwen` with `OpenAI | Copilot` for response passthrough (no conversion) in both `handle_direct_openai()` and `handle_direct_anthropic()`

## Phase 2: Backend Auth — Device Flow
Agent: rust-backend-engineer

Note: This is a NEW device flow implementation following the same DashMap pending state pattern as Kiro, but with different endpoints, grant types, and response formats. No code is shared with Kiro's AWS OIDC device flow.

- [x] 2.1 — Implement Qwen device flow endpoints: `POST /_ui/api/providers/qwen/device-code` (initiate flow, generate PKCE S256, store pending state in DashMap with 10-min TTL) and `GET /_ui/api/providers/qwen/device-poll` (poll `chat.qwen.ai/api/v1/oauth2/token` with device_code + code_verifier, handle RFC 8628 responses: `authorization_pending` → pending, `slow_down` → pending with increased interval, `expired_token` → expired, `access_denied` → denied)
- [x] 2.2 — Implement token storage: on successful poll, store `access_token`, `refresh_token`, `resource_url` (as `base_url`) in `user_provider_tokens` table with provider = "qwen". Invalidate provider registry cache
- [x] 2.3 — Implement Qwen token refresh in `ensure_fresh_token()` path via `TokenExchanger`: call `chat.qwen.ai/api/v1/oauth2/token` with `grant_type=refresh_token`. Handle refresh failure (revoked token → delete + fallback to Kiro)
- [x] 2.4 — Register device flow routes in web_ui router

## Phase 3: Backend Rate Limiting
Agent: rust-backend-engineer

- [x] 3.1 — Implement per-credential rate limiting in `QwenProvider`: 60 req/min sliding window using `DashMap<String, VecDeque<Instant>>`. Check before `send_request()`, return 429 with `Retry-After` header when exceeded. Add TODO for periodic cleanup of stale entries to prevent unbounded memory growth
- [x] 3.2 — Implement quota error detection: map HTTP 403 with `insufficient_quota`/`quota_exceeded` error codes to 429 response. Pass through HTTP 403 with other error codes as-is

## Phase 4: Frontend — Device Flow UI
Agent: react-frontend-engineer

- [x] 4.1 — Add Qwen API types and functions to `frontend/src/lib/api.ts`: `QwenStatus` interface, `getQwenStatus()`, `startQwenDeviceFlow()`, `pollQwenDeviceCode()`, `disconnectQwen()`. Extend `DevicePollResponse` type with `'expired'` and `'denied'` status variants
- [x] 4.2 — Refactor `DeviceCodeDisplay` component to accept a `pollFn` prop (`(deviceCode: string) => Promise<DevicePollResponse>`) instead of importing `pollDeviceCode` directly, making it reusable for both Kiro and Qwen device flows. Add `aria-live="polite"` to polling status container
- [x] 4.3 — Add "QWEN CODER" section to `Profile.tsx` following KiroSetup/CopilotSetup pattern: `<h2 className="section-header">` + `<QwenSetup />` component. Include connect/disconnect buttons using existing `$ connect`/`$ disconnect` convention
- [x] 4.4 — Create `QwenSetup` component reusing `DeviceCodeDisplay` with Qwen-specific `pollFn`. Handle polling states: "Waiting for authorization..." spinner, success → "Connected" + status update, expiry → "Code expired, try again", denied → error message. Handle transient network errors during polling gracefully (retry, don't abort)
- [x] 4.5 — Add Qwen provider status indicator (connected/disconnected) using existing `tag-ok`/`tag-err` CSS classes. Add skeleton loader with `role="status"` and `aria-label` matching KiroSetup pattern

## Phase 5: Infrastructure
Agent: devops-engineer

- [x] 5.1 — Add `QWEN_OAUTH_CLIENT_ID` env var to `docker-compose.yml` only (NOT gateway yml — proxy-only Qwen is out of scope). No client secret needed — device flow uses public client ID. Pattern: `QWEN_OAUTH_CLIENT_ID: "${QWEN_OAUTH_CLIENT_ID:-}"`
- [x] 5.2 — Add Qwen env var to `.env.example` as commented-out entry with documentation: `# Qwen Coder OAuth (optional — device flow, no secret required)` with the default public client ID noted

## Phase 6: QA — Backend Tests
Agent: backend-qa

- [x] 6.1 — Unit tests for `QwenProvider` helpers: `completions_url()` with default/resource_url_override/none cases, `anthropic_to_openai_body()` conversion, `has_vision_content()` detection (qwen-vl-plus → true, qwen-coder → false, image_url content → true), `normalize_model_name()` if applicable
- [x] 6.2 — Unit tests for model routing: verify `qwen-*`, `qwen3-*`, `qwq-*` prefixes resolve to `ProviderId::Qwen`, no collision with existing providers, unknown models still fall through to Kiro
- [x] 6.3 — Unit tests for Qwen3 dummy tool injection: tool injected when no tools + streaming, not injected when tools present, not injected for non-streaming. Also test `stream_options.include_usage: true` is set on streaming and NOT on non-streaming
- [x] 6.4 — Unit tests for rate limiting: 60 req/min enforcement, sliding window expiry (requests older than 60s evicted), 429 response with correct `Retry-After` header, quota error mapping (HTTP 403 `insufficient_quota` → 429, HTTP 403 other codes → passthrough)
- [x] 6.5 — Unit tests for device flow endpoints: mock token exchange, all RFC 8628 polling states (pending, slow_down, expired, denied), token storage on success, expired device code rejection (10-min TTL)
- [x] 6.6 — Unit tests for token refresh: successful refresh via MockExchanger, expired refresh token → delete + Kiro fallback
- [x] 6.7 — Unit tests for registry integration: verify `resolve_provider()` returns Qwen credentials from cache after `load_user_data()` loads them, verify `VALID_PROVIDERS` includes "qwen"
- [x] 6.8 — Unit tests for vision model detection: `qwen-vl-plus` and `qwen-vl-max` correctly identified as vision models, image payloads pass through in both OpenAI and Anthropic formats

## Phase 7: QA — Frontend E2E Tests
Agent: frontend-qa

- [x] 7.1 — Section structure tests: Qwen section appears on Profile page with correct heading, card structure follows KiroSetup/CopilotSetup pattern
- [x] 7.2 — Connected state tests: CONNECTED badge shown, disconnect button visible, reconnect button visible, connect button hidden
- [x] 7.3 — Not connected state tests: NOT CONNECTED badge shown, "$ connect qwen" button visible, disconnect button hidden
- [x] 7.4 — Device flow initiation tests: clicking connect calls `POST /_ui/api/providers/qwen/device-code`, shows verification URL as clickable link, shows user code, shows copy button, shows "waiting for authorization..." polling indicator, shows cancel button, cancel closes flow
- [x] 7.5 — Device flow polling state tests: successful auth → success toast + status updates, code expired → "Code expired, try again" message, access denied → error message. Use established `pollCount` pattern for simulating state transitions
- [x] 7.6 — Disconnect flow tests: clicking disconnect sends DELETE request + success toast, disconnect failure (500) → error toast
- [x] 7.7 — Loading state test: skeleton loader shown while fetching Qwen status (delayed API response)
- [x] 7.8 — Update existing provider mock data (`PROVIDERS_MIXED`, `PROVIDERS_ALL_DISCONNECTED`, `PROVIDERS_ALL_CONNECTED`) to include Qwen entry, update card count assertions
