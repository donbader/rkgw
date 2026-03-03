---
layout: default
title: Request Flow
parent: Architecture
nav_order: 1
permalink: /architecture/request-flow/
---

# Request Flow
{: .no_toc }

This page traces the complete lifecycle of a request through Kiro Gateway — from the moment a client sends an HTTP request to the final SSE event delivered back. Both OpenAI and Anthropic request paths are covered, along with streaming vs non-streaming differences and error handling at each stage.

## Table of Contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Complete Request Lifecycle

Every request passes through nginx for TLS termination, then the backend's middleware and handler pipeline. The differences between OpenAI and Anthropic paths are in the converter modules used for format translation.

```mermaid
sequenceDiagram
    participant Client
    participant Nginx as nginx (TLS)
    participant CORS as CORS Layer
    participant Debug as Debug Logger
    participant Auth as Auth Middleware
    participant Setup as Setup Guard
    participant Handler as Route Handler
    participant Resolver as Model Resolver
    participant Converter as Converter
    participant TokenCount as Tokenizer
    participant Truncation as Truncation Recovery
    participant AuthMgr as AuthManager
    participant HTTP as KiroHttpClient
    participant KiroAPI as Kiro API
    participant StreamParser as Stream Parser
    participant ThinkParser as Thinking Parser
    participant OutConverter as Output Converter
    participant SSE as SSE Formatter

    Client->>Nginx: HTTPS Request
    Nginx->>Nginx: TLS termination
    Nginx->>CORS: HTTP Request (plain)

    CORS->>Debug: Add CORS headers
    Debug->>Auth: Log request (if debug mode)

    Auth->>Auth: SHA-256 hash API key, lookup user in cache/DB
    alt Invalid or missing key
        Auth-->>Client: 401 Unauthorized
    end

    Auth->>Setup: Authenticated request (user identity injected)
    Setup->>Setup: Check setup_complete flag
    alt Setup not complete
        Setup-->>Client: 503 Service Unavailable
    end

    Setup->>Handler: Request passes all guards

    Handler->>Handler: Validate request (messages non-empty, etc.)
    Handler->>Resolver: Resolve model name
    Resolver->>Resolver: Normalize → check hidden models → check cache
    Resolver-->>Handler: ModelResolution {internal_id, source, is_verified}

    Handler->>Truncation: Inject recovery messages (if enabled)
    Handler->>Converter: Convert to Kiro format
    Converter->>Converter: Extract system prompt
    Converter->>Converter: Convert messages to UnifiedMessage
    Converter->>Converter: Convert tools (if any)
    Converter->>Converter: Build Kiro payload JSON
    Converter-->>Handler: KiroPayload

    Handler->>TokenCount: Count input tokens
    Handler->>AuthMgr: Get per-user access token
    AuthMgr->>AuthMgr: Check kiro_token_cache (4-min TTL)
    alt Token expired or missing
        AuthMgr->>AuthMgr: refresh_aws_sso_oidc()
    end
    AuthMgr-->>Handler: Valid access token

    Handler->>HTTP: POST /generateAssistantResponse
    HTTP->>KiroAPI: Send request with Bearer token
    alt HTTP error (429, 5xx)
        HTTP->>HTTP: Exponential backoff + retry
    end
    alt 403 Forbidden
        HTTP->>AuthMgr: Refresh token
        HTTP->>KiroAPI: Retry with new token
    end
    KiroAPI-->>HTTP: AWS Event Stream response

    alt Streaming mode
        loop For each binary frame
            HTTP-->>StreamParser: Stream chunk
            StreamParser->>StreamParser: Parse AWS Event Stream binary
            StreamParser->>StreamParser: Extract assistantResponseEvent JSON
            StreamParser->>ThinkParser: Feed content to thinking FSM
            ThinkParser-->>StreamParser: ThinkingParseResult
            StreamParser->>OutConverter: Convert KiroEvent to target format
            OutConverter-->>SSE: Format as SSE event
            SSE-->>Client: data: {...}\n\n
        end
        SSE-->>Client: data: [DONE] or event: message_stop
    else Non-streaming mode
        StreamParser->>StreamParser: Collect all events
        StreamParser->>OutConverter: Build complete response JSON
        OutConverter-->>Client: Single JSON response
    end
```

---

## Step-by-Step Walkthrough

### Step 1: nginx (TLS Termination)

All incoming requests first hit nginx, which handles:
- **TLS termination** using Let's Encrypt certificates (managed by certbot)
- **Reverse proxying** to the backend on port 8000 (plain HTTP)
- **SSE support** with proper buffering disabled for `/v1/*` streaming endpoints

nginx routes:
- `/_ui/*` (not `/_ui/api/*`) → serves React SPA static files
- `/_ui/api/*` → proxies to `backend:8000`
- `/v1/*` → proxies to `backend:8000` with SSE buffering disabled
- `/.well-known/acme-challenge/` → certbot webroot for certificate validation

### Step 2: Middleware Stack

After nginx proxies the request, it passes through the backend's middleware layers applied in `backend/src/main.rs:build_app()`:

1. **CORS Layer** (`middleware::cors_layer()`) — Adds permissive CORS headers (`Access-Control-Allow-Origin: *`). Handles OPTIONS preflight requests automatically via `tower-http::CorsLayer`.

2. **Debug Logger** (`middleware::debug_middleware()`) — When `debug_mode` is `Errors` or `All`, captures request/response bodies for troubleshooting. Controlled by the `DEBUG_MODE` config.

### Step 3: Authentication

Auth middleware is applied per-route group, not globally. Health check routes (`/`, `/health`) and Web UI routes (`/_ui/api/*`) bypass API key authentication.

For protected routes (`/v1/chat/completions`, `/v1/messages`, `/v1/models`), the middleware in `backend/src/middleware/mod.rs`:

1. Extracts the API key from `Authorization: Bearer {key}` or `x-api-key: {key}` header
2. SHA-256 hashes the key
3. Looks up the hash in `api_key_cache` (DashMap) for fast path, or PostgreSQL on cache miss
4. If found, injects the user identity and Kiro credentials into request extensions
5. If not found, returns `401 Unauthorized` JSON error

### Step 4: Setup Guard

The setup guard checks the `setup_complete` `AtomicBool`. If initial setup hasn't been completed (no admin user exists), API routes return `503 Service Unavailable` with a message directing users to the Web UI.

### Step 5: Request Validation

Each handler validates the incoming request:

- **OpenAI** (`chat_completions_handler`): Messages array must be non-empty.
- **Anthropic** (`anthropic_messages_handler`): Messages array must be non-empty and `max_tokens` must be positive. The `anthropic-version` header is logged but not required.

### Step 6: Model Resolution

The `ModelResolver` in `backend/src/resolver.rs` normalizes client-provided model names through a multi-stage pipeline:

```mermaid
flowchart LR
    INPUT["Client model name<br/><i>e.g. claude-sonnet-4-5</i>"] --> NORM["Normalize<br/><i>dash→dot, strip dates</i>"]
    NORM --> HIDDEN{"Hidden<br/>models?"}
    HIDDEN -->|Yes| INTERNAL["Internal Kiro ID<br/><i>e.g. CLAUDE_SONNET_4_20250514_V1_0</i>"]
    HIDDEN -->|No| CACHE{"In model<br/>cache?"}
    CACHE -->|Yes| CACHED["Cached model ID"]
    CACHE -->|No| PASS["Pass through as-is"]
```

The resolution result includes the `source` field (`"hidden"`, `"cache"`, or `"passthrough"`) and an `is_verified` flag indicating whether the model was found in a known list.

### Step 7: Truncation Recovery Injection

When `truncation_recovery` is enabled (default: `true`), the handler calls `truncation::inject_openai_truncation_recovery()` or `truncation::inject_anthropic_truncation_recovery()` to modify the message array. If a previous response was detected as truncated, a recovery message is injected asking the model to re-emit the truncated content.

### Step 8: Format Conversion (Inbound)

The converter modules translate the client request into the Kiro wire format:

- **OpenAI path**: `converters::openai_to_kiro::build_kiro_payload()` extracts the system prompt from messages, converts each `ChatMessage` to a `UnifiedMessage`, processes tool definitions, and builds the final Kiro JSON payload.

- **Anthropic path**: `converters::anthropic_to_kiro::build_kiro_payload()` handles Anthropic's content block arrays, `tool_use`/`tool_result` blocks, and the separate `system` field.

Both converters use the shared `UnifiedMessage` type from `converters/core.rs` as an intermediate representation before building the Kiro-specific JSON.

### Step 9: Token Counting

Input tokens are estimated using `tiktoken-rs` (cl100k_base encoding) with a 1.15x Claude correction factor. This count is used for:
- Usage reporting in the response
- Metrics tracking
- Streaming metrics handles

### Step 10: Authentication Token Retrieval

The handler retrieves the per-user Kiro access token:
1. Checks `kiro_token_cache` for a cached token (4-minute TTL)
2. On cache miss, loads the user's Kiro credentials from PostgreSQL
3. Calls `refresh::refresh_aws_sso_oidc()` to get a fresh access token
4. Caches the new token in `kiro_token_cache`
5. On refresh failure, falls back to the existing token if it hasn't actually expired (graceful degradation)

### Step 11: HTTP Request to Kiro API

`KiroHttpClient::request_with_retry()` sends the request to `https://codewhisperer.{region}.amazonaws.com/generateAssistantResponse` with:
- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`
- The converted Kiro payload as the JSON body

The retry logic handles:
- **403 Forbidden**: Triggers a token refresh and retries
- **429 Too Many Requests / 5xx**: Exponential backoff with 10% jitter (`delay = base_ms * 2^attempt + jitter`)
- **Other errors**: Fail immediately

### Step 12: Response Processing

The Kiro API always returns responses in AWS Event Stream binary format. The streaming module (`backend/src/streaming/mod.rs`) handles two paths:

#### Streaming Path

```mermaid
flowchart TD
    BYTES["Raw bytes from Kiro API"] --> PARSE["parse_aws_event_stream()<br/><i>Binary frame decoding</i>"]
    PARSE --> EXTRACT["Extract assistantResponseEvent<br/><i>JSON payload from headers</i>"]
    EXTRACT --> KIRO_EVENT["Build KiroEvent<br/><i>content / tool_use / usage</i>"]
    KIRO_EVENT --> THINKING["ThinkingParser.feed()<br/><i>Detect &lt;thinking&gt; blocks</i>"]
    THINKING --> |thinking_content| REASON["Emit as reasoning_content<br/><i>(OpenAI) or thinking block (Anthropic)</i>"]
    THINKING --> |regular_content| CONTENT["Emit as delta.content<br/><i>(OpenAI) or content_block_delta (Anthropic)</i>"]
    REASON --> FORMAT["Format as SSE event string"]
    CONTENT --> FORMAT
    FORMAT --> CLIENT["Send to client via<br/>text/event-stream"]
```

The streaming functions (`stream_kiro_to_openai()`, `stream_kiro_to_anthropic()`) return a `Stream<Item = Result<String, ApiError>>` that the handler wraps in an Axum `Body::from_stream()` response.

#### Non-Streaming Path

For non-streaming requests, `collect_openai_response()` or `collect_anthropic_response()` consumes the entire event stream and aggregates it into a single JSON response object. The Kiro API does not have a non-streaming mode — the gateway simulates it by collecting the stream.

---

## OpenAI vs Anthropic Flow Differences

While the overall pipeline is identical, there are format-specific differences:

| Aspect | OpenAI Path | Anthropic Path |
|--------|------------|----------------|
| Endpoint | `POST /v1/chat/completions` | `POST /v1/messages` |
| System prompt | Extracted from messages array (role: "system") | Separate `system` field in request body |
| Tool calls | `tool_calls` array on assistant messages | `tool_use` content blocks |
| Tool results | `role: "tool"` messages with `tool_call_id` | `tool_result` content blocks |
| Streaming format | `data: {"choices":[{"delta":{...}}]}\n\n` | `event: content_block_delta\ndata: {...}\n\n` |
| Stream termination | `data: [DONE]\n\n` | `event: message_stop\ndata: {}\n\n` |
| Thinking content | `reasoning_content` field in delta | `thinking` content block type |
| Usage reporting | In final chunk (when `include_usage: true`) | In `message_delta` event |
| Token counting | `count_message_tokens()` + `count_tools_tokens()` | `count_anthropic_message_tokens()` |

---

## Error Handling at Each Stage

The gateway uses a centralized `ApiError` enum (defined in `backend/src/error.rs`) that implements Axum's `IntoResponse` trait. Each variant maps to an HTTP status code:

```mermaid
flowchart TD
    subgraph Errors["ApiError Variants"]
        AUTH_ERR["AuthError<br/><i>401 Unauthorized</i>"]
        VALID_ERR["ValidationError<br/><i>400 Bad Request</i>"]
        MODEL_ERR["InvalidModel<br/><i>400 Bad Request</i>"]
        KIRO_ERR["KiroApiError<br/><i>Upstream status code</i>"]
        CONFIG_ERR["ConfigError<br/><i>500 Internal Server Error</i>"]
        INTERNAL["Internal<br/><i>500 Internal Server Error</i>"]
    end

    MW_STAGE["Middleware"] --> AUTH_ERR
    VALIDATE_STAGE["Validation"] --> VALID_ERR
    RESOLVE_STAGE["Model Resolution"] --> MODEL_ERR
    API_STAGE["Kiro API Call"] --> KIRO_ERR
    CONFIG_STAGE["Config Loading"] --> CONFIG_ERR
    ANY_STAGE["Any Stage"] --> INTERNAL
```

All errors are returned as JSON in the OpenAI error format:
```json
{
  "error": {
    "message": "descriptive error message",
    "type": "error_type"
  }
}
```

Every error is also recorded in the `MetricsCollector` with a category tag (`"auth"`, `"validation"`, `"upstream"`, `"internal"`, `"config"`) for monitoring.

---

## Request Metrics Tracking

Each request is wrapped in a `RequestGuard` (defined in `backend/src/routes/mod.rs`) that:

1. Increments `active_connections` on creation
2. Records latency, model, and token counts on completion
3. Decrements `active_connections` on drop (even if the request panics or is cancelled)

For streaming requests, a `StreamingMetricsTracker` is used instead, which tracks output tokens incrementally as they flow through the stream and records metrics when the tracker is dropped.
