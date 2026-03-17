# Plan: Multi-Provider Support for Proxy Mode

## Context

Proxy-only mode (`GATEWAY_MODE=proxy`) currently only works with Kiro. All 5 provider implementations exist but are inaccessible in proxy mode because credential resolution requires a database (`config_db`), which proxy mode doesn't have. The `ProviderRegistry.resolve_provider()` returns `(Kiro, None)` whenever `db` is `None`.

**Goal:** Enable all existing providers (Anthropic, OpenAI, Copilot, Qwen) plus a new generic OpenAI-compatible provider in proxy mode, configured entirely via environment variables.

## Consultation Summary

- **Proxy mode architecture:** Single-container, no DB, no Web UI. Auth via single `PROXY_API_KEY` hash comparison. All requests use `PROXY_USER_ID` (fixed UUID). Kiro credentials from `AuthManager` which reads env vars.
- **Provider architecture:** 5 providers built at startup via `build_provider_map()`. Each implements the `Provider` trait with both OpenAI and Anthropic interfaces. Model routing uses `provider_for_model()` prefix matching (claude-* → Anthropic, gpt-* → OpenAI, qwen-* → Qwen).
- **Key bottleneck:** `ProviderRegistry.resolve_provider()` at line 226 of `registry.rs` — returns `(Kiro, None)` when `db` is `None`. This is the single point that blocks all non-Kiro providers in proxy mode.
- **Credential types:** Anthropic/OpenAI use static API keys. Copilot/Qwen use OAuth tokens with expiry. Kiro uses AWS STS tokens with refresh.

## Design: ProxyCredentialStore

Add a `proxy_credentials` field to `ProviderRegistry` — a `HashMap<ProviderId, ProviderCredentials>` populated at startup from env vars. When `db` is `None`, `resolve_provider` checks this store instead of returning `(Kiro, None)`.

This is the minimal-change approach: the existing routing logic (`parse_prefixed_model`, `provider_for_model`, `pick_best_provider`) stays unchanged. Only the credential lookup path gets a proxy fallback.

## New Environment Variables

| Variable | Provider | Required | Example |
|----------|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Anthropic | No | `sk-ant-api03-...` |
| `OPENAI_API_KEY` | OpenAI | No | `sk-proj-...` |
| `OPENAI_BASE_URL` | OpenAI | No | `https://api.openai.com/v1` (default) |
| `COPILOT_TOKEN` | Copilot | No | OAuth token (or obtained via device flow) |
| `COPILOT_BASE_URL` | Copilot | No | `https://api.githubcopilot.com` (default) |
| `QWEN_TOKEN` | Qwen | No | OAuth token (or obtained via device flow) |
| `QWEN_BASE_URL` | Qwen | No | From OAuth response |
| `CUSTOM_PROVIDER_URL` | Custom | No | `http://localhost:11434/v1` |
| `CUSTOM_PROVIDER_KEY` | Custom | No | Optional API key |
| `CUSTOM_PROVIDER_MODELS` | Custom | No | `llama3,codellama,deepseek-r1` |

At least one provider must have credentials for proxy mode to start (Kiro via existing flow, or any of the above).

## File Manifest

| File | Action | Owner | Wave |
|------|--------|-------|------|
| `backend/src/providers/types.rs` | modify | rust-backend-engineer | 1 |
| `backend/src/providers/registry.rs` | modify | rust-backend-engineer | 1 |
| `backend/src/config.rs` | modify | rust-backend-engineer | 1 |
| `backend/src/providers/custom.rs` | create | rust-backend-engineer | 2 |
| `backend/src/providers/mod.rs` | modify | rust-backend-engineer | 2 |
| `backend/src/main.rs` | modify | rust-backend-engineer | 2 |
| `backend/src/routes/openai.rs` | modify | rust-backend-engineer | 3 |
| `backend/src/cache.rs` | modify | rust-backend-engineer | 3 |
| `backend/entrypoint.sh` | modify | devops-engineer | 3 |
| `docker-compose.gateway.yml` | modify | devops-engineer | 4 |
| `.env.example` | modify | devops-engineer | 4 |

## Wave 1: Core Infrastructure

### 1.1 Add `Custom` variant to `ProviderId`
**File:** `backend/src/providers/types.rs`
- Add `Custom` variant to `ProviderId` enum with `#[serde(rename = "custom")]`
- Add `"custom"` to `as_str()`, `Display`, `FromStr` implementations
- Update tests

### 1.2 Extend `ProxyConfig` with provider credentials
**File:** `backend/src/config.rs`
- Add fields to `ProxyConfig`:
  ```rust
  pub anthropic_api_key: Option<String>,
  pub openai_api_key: Option<String>,
  pub openai_base_url: Option<String>,
  pub copilot_token: Option<String>,
  pub copilot_base_url: Option<String>,
  pub qwen_token: Option<String>,
  pub qwen_base_url: Option<String>,
  pub custom_provider_url: Option<String>,
  pub custom_provider_key: Option<String>,
  pub custom_provider_models: Option<String>,
  ```
- Read new env vars in `Config::load()` when building `ProxyConfig`

### 1.3 Add `ProxyCredentialStore` to `ProviderRegistry`
**File:** `backend/src/providers/registry.rs`
- Add field: `proxy_credentials: Option<HashMap<ProviderId, ProviderCredentials>>`
- Add constructor: `ProviderRegistry::new_with_proxy(creds: HashMap<ProviderId, ProviderCredentials>)`
- Modify `resolve_provider()`:
  ```rust
  // After: let Some(db) = db else { return (ProviderId::Kiro, None); };
  // Change to:
  let Some(db) = db else {
      // Proxy mode: check proxy credential store
      if let Some(ref proxy_creds) = self.proxy_credentials {
          if let Some(cred) = proxy_creds.get(&native) {
              return (native, Some(cred.clone()));
          }
      }
      return (ProviderId::Kiro, None);
  };
  ```
- Extend `provider_for_model()` to handle custom provider models (accept a `custom_models: &HashSet<String>` param or store it in the registry)

## Wave 2: Provider Implementation

### 2.1 Create `CustomProvider`
**File:** `backend/src/providers/custom.rs` (new)
- Implements `Provider` trait
- OpenAI-compatible HTTP proxy: forwards requests to `base_url` with optional `Authorization: Bearer` header
- `execute_openai` → direct passthrough to target URL
- `execute_anthropic` → convert Anthropic format → OpenAI → forward → convert back
- `stream_openai` → direct SSE passthrough
- `stream_anthropic` → convert + stream + convert back
- Uses its own `reqwest::Client` (like other non-Kiro providers)

### 2.2 Register Custom provider + wire proxy credentials
**File:** `backend/src/providers/mod.rs`
- Add `pub mod custom;`
- Add `ProviderId::Custom` to `build_provider_map()`

**File:** `backend/src/main.rs`
- After `Config::load()`, build proxy credential map from `ProxyConfig` fields:
  ```rust
  if config.is_proxy_only() {
      let mut proxy_creds = HashMap::new();
      if let Some(key) = proxy.anthropic_api_key {
          proxy_creds.insert(ProviderId::Anthropic, ProviderCredentials {
              provider: ProviderId::Anthropic,
              access_token: key,
              base_url: None,
              account_label: "proxy".into(),
          });
      }
      // ... same for OpenAI, Copilot, Qwen, Custom
      let registry = ProviderRegistry::new_with_proxy(proxy_creds);
  }
  ```
- Store custom model list in the registry for `provider_for_model` lookup

### 2.3 Handle custom models in routing
**File:** `backend/src/providers/registry.rs`
- Add `custom_models: HashSet<String>` field to `ProviderRegistry`
- In `provider_for_model()`, check custom_models set before returning `None`
- Models in `CUSTOM_PROVIDER_MODELS` → `ProviderId::Custom`

## Wave 3: Models Endpoint + Entrypoint

### 3.1 Multi-provider `/v1/models`
**File:** `backend/src/routes/openai.rs` — `get_models_handler`
- In proxy mode, build model list from configured providers:
  - Kiro: existing `model_cache.get_all_model_ids()` (always included)
  - Anthropic: static known models list (claude-opus-4-6, claude-sonnet-4-6, etc.) if `ANTHROPIC_API_KEY` set
  - OpenAI: static known models list (gpt-4o, o3, o4-mini, etc.) if `OPENAI_API_KEY` set
  - Copilot: static list if `COPILOT_TOKEN` set
  - Qwen: static list if `QWEN_TOKEN` set
  - Custom: models from `CUSTOM_PROVIDER_MODELS`
- Use static lists (no API calls) — faster, no auth needed for model listing, and models are well-known

**File:** `backend/src/cache.rs` (or new `backend/src/providers/known_models.rs`)
- Define known model lists per provider as constants

### 3.2 Copilot + Qwen device flows
**File:** `backend/entrypoint.sh`
- Add GitHub device flow for Copilot:
  1. POST to `https://github.com/login/device/code` with `client_id`
  2. Display user_code + verification_uri
  3. Poll `https://github.com/login/oauth/access_token` until authorized
  4. Exchange GitHub token for Copilot token via `https://api.github.com/copilot_internal/v2/token`
  5. Export `COPILOT_TOKEN` and `COPILOT_BASE_URL`
- Add Qwen device flow:
  1. POST device authorization to Qwen OAuth endpoint
  2. Poll for token
  3. Export `QWEN_TOKEN` and `QWEN_BASE_URL`
- Cache all tokens to `/data/tokens.json` (extend existing cache)
- Skip device flows when tokens already provided via env vars

## Wave 4: Docker + Docs + Tests

### 4.1 Docker Compose
**File:** `docker-compose.gateway.yml`
- Add new env vars with `${VAR:-}` defaults

### 4.2 Environment example
**File:** `.env.example`
- Add all new proxy provider env vars with comments

### 4.3 Unit tests
**Files:** Tests within modified files
- `registry.rs`: Test proxy credential store resolution
- `registry.rs`: Test custom model routing
- `config.rs`: Test new env var loading
- `types.rs`: Test Custom ProviderId variant
- `custom.rs`: Test request forwarding (mock HTTP)

## Interface Contracts

### Proxy Credential Resolution Flow
```
Client Request → middleware (PROXY_API_KEY hash check)
  → resolve_provider_routing()
    → ProviderRegistry.resolve_provider(PROXY_USER_ID, model, db=None)
      → parse model prefix / infer provider from name / check custom_models
      → db is None → check proxy_credentials HashMap
        → found? → return (provider, creds)
        → not found? → return (Kiro, None)
  → build credentials (Kiro path or proxy creds path)
  → execute via Provider trait (unchanged)
```

### Model Routing Priority (proxy mode)
1. Explicit prefix: `anthropic/claude-opus-4-6` → Anthropic (if configured)
2. Model name prefix: `claude-*` → Anthropic, `gpt-*` → OpenAI, `qwen-*` → Qwen
3. Custom model list: model in `CUSTOM_PROVIDER_MODELS` → Custom
4. Fallback: Kiro (always available)

If resolved provider has no credentials, fall back to Kiro.

## Verification

```bash
# 1. Build
cd backend && cargo clippy --all-targets   # zero warnings
cd backend && cargo fmt --check             # no diffs
cd backend && cargo test --lib              # all tests pass

# 2. Manual test with Anthropic
GATEWAY_MODE=proxy PROXY_API_KEY=test-key-1234567890 ANTHROPIC_API_KEY=sk-ant-... \
  cargo run

curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer test-key-1234567890" \
  -d '{"model":"claude-sonnet-4-6","messages":[{"role":"user","content":"hello"}]}'

# 3. Manual test with OpenAI
OPENAI_API_KEY=sk-proj-... \
curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer test-key-1234567890" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"hello"}]}'

# 4. Manual test with Custom (Ollama)
CUSTOM_PROVIDER_URL=http://localhost:11434/v1 CUSTOM_PROVIDER_MODELS=llama3 \
curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer test-key-1234567890" \
  -d '{"model":"llama3","messages":[{"role":"user","content":"hello"}]}'

# 5. Check /v1/models includes all configured providers
curl http://localhost:8000/v1/models \
  -H "Authorization: Bearer test-key-1234567890"

# 6. Docker
docker compose -f docker-compose.gateway.yml --env-file .env.proxy build
docker compose -f docker-compose.gateway.yml --env-file .env.proxy up -d
```

## Recommended Preset
`/team-implement --preset backend-feature`

Primary work is backend-only (Rust). DevOps engineer needed for entrypoint.sh and Docker changes.
