# qwen-coder-provider_20260308: Add Qwen Coder Provider Support

**Type**: feature
**Created**: 2026-03-08
**Preset**: fullstack + infra
**Services**: backend, frontend, infra, backend-qa, frontend-qa

## Problem Statement

Add ProviderId::Qwen to rkgw's multi-provider system, enabling request routing through Alibaba's Qwen Coder API with OAuth Device Flow auth, OpenAI-compatible passthrough, Anthropic API format support (via conversion), Qwen-specific headers, and Qwen3 streaming bug workaround.

## User Story

As a developer using Qwen Coder, I want to route requests through rkgw so that I can use Qwen models via both OpenAI and Anthropic API formats with per-user OAuth authentication.

## Acceptance Criteria

1. Qwen variant added to ProviderId with full serde support
2. QwenProvider implements all 5 Provider trait methods (id + execute/stream x openai/anthropic)
3. OAuth Device Flow endpoints work (device-code + polling), following existing Kiro device flow pattern
4. Frontend shows device flow UI with verification link, code, and polling status
5. Model routing matches qwen*/qwq* prefixes to Qwen provider
6. Qwen3 dummy tool workaround active for streaming requests
7. Docker env vars configured for Qwen OAuth
8. Image/vision support for qwen-vl-* models
9. Rate limiting: 60 req/min per credential sliding window
10. All existing tests pass + new Qwen-specific unit tests added

## Scope Boundaries

**In scope:**
- Full provider implementation (OpenAI + Anthropic format)
- OAuth Device Flow (reusing existing Kiro pattern)
- Rate limiting (60 req/min sliding window)
- Image/vision model support (qwen-vl-*)
- Qwen3 streaming bug workaround (dummy tool injection)
- Frontend device flow UI
- Docker/infra configuration
- Unit tests + E2E tests

**Out of scope:**
- Quota management (daily reset tracking)
- Proxy-only mode Qwen support
- Qwen model list API integration

## Dependencies

- Existing multi-provider system (ProviderId, Provider trait, ProviderRegistry, provider_auth.rs)
- Completed copilot-provider-support track (provider priority system)
- user_provider_tokens DB table
- Existing Kiro device flow implementation (auth pattern reference)

## Technical Considerations

- Follow Copilot provider pattern for Provider trait implementation
- Reuse existing Kiro device flow pattern for OAuth (not a new auth pattern)
- Reuse existing converters for Anthropic ↔ OpenAI format conversion
- Respect `resource_url` from token response for base URL override
- Qwen-specific headers required (X-Dashscope-*, User-Agent)
- Qwen3 dummy tool injection for streaming when no tools defined
- `stream_options.include_usage: true` for usage tracking
