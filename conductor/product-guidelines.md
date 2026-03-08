# Product Guidelines - Harbangan

## Voice and Tone

**Concise and direct.** Match the CRT terminal aesthetic of the UI. No fluff, no marketing speak. Technical accuracy over friendliness.

- Use imperative mood in documentation: "Run `docker compose up`" not "You can run..."
- Error messages should state what went wrong and what to do about it
- UI labels should be terse: "API Keys" not "Manage Your API Keys"
- Log messages use structured tracing fields, not prose

## Design Principles

### 1. Performance First
- Streaming responses must add minimal latency over direct Kiro access
- Use connection pooling, caching (model cache, session cache, API key cache)
- Prefer zero-copy parsing where possible

### 2. Simplicity Over Features
- One way to do things, not three
- Prefer configuration over code for behavior changes
- Docker Compose is the only deployment target (for now)
- No plugin system - direct integration only

### 3. Security and Reliability
- Per-user credential isolation (no shared Kiro tokens)
- CSRF protection on all state-changing web UI endpoints
- API keys stored as SHA-256 hashes, never in plaintext
- Session cookies are HttpOnly, CSRF tokens are readable by JS
- Graceful degradation: if guardrails service is down, configurable fail-open/fail-closed

### 4. Developer Experience
- OpenAI and Anthropic SDK compatibility without code changes
- Self-service setup: first user through Google SSO becomes admin
- Real-time dashboard with SSE for metrics and logs
- Clear error responses with actionable guidance

## UI Design

- CRT phosphor terminal aesthetic: dark background, green/cyan glow, monospace font
- All design tokens in CSS custom properties (`variables.css`)
- Sharp corners (`border-radius: 2px`), not rounded
- JetBrains Mono font family
- No external UI component libraries - hand-rolled components
