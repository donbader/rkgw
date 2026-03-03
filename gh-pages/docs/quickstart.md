---
layout: default
title: Quickstart
nav_order: 3
---

# Quickstart
{: .no_toc }

Get Kiro Gateway running and make your first API call in under 5 minutes using Docker.

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## 1. Clone and configure

```bash
git clone https://github.com/if414013/rkgw.git
cd rkgw
cp .env.example .env
```

Edit `.env` and fill in your values:

```bash
DOMAIN=gateway.example.com
EMAIL=admin@example.com
POSTGRES_PASSWORD=change-me
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://gateway.example.com/_ui/api/auth/google/callback
```

You need a **Google OAuth Client ID** from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with the redirect URI set to your callback URL above.

## 2. Provision TLS certificates

```bash
chmod +x init-certs.sh
./init-certs.sh
```

This obtains a Let's Encrypt certificate for your domain. Your domain must have DNS pointing to this server.

## 3. Start with Docker Compose

```bash
docker compose up -d --build
```

This starts four services: PostgreSQL, the Rust backend, nginx (TLS termination), and certbot (certificate renewal). The first build takes a few minutes.

Watch the logs:

```bash
docker compose logs -f backend
```

Wait until you see:

```
Setup not complete — starting in setup-only mode
Server listening on http://0.0.0.0:8000
```

## 4. Complete setup via Web UI

Open `https://your-domain.com/_ui/` in your browser.

1. Click **Sign in with Google** — the first user gets the Admin role
2. Add your **Kiro credentials** via the AWS SSO device code flow
3. Create a **personal API key** in the API Keys section

## 5. Verify it works

```bash
# Health check
curl https://your-domain.com/health
# → {"status":"ok"}

# List models
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://your-domain.com/v1/models
```

## 6. Make your first API call

### OpenAI format

```bash
curl -X POST https://your-domain.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4",
    "messages": [
      {"role": "user", "content": "Write a haiku about coding"}
    ],
    "stream": true
  }'
```

### Anthropic format

```bash
curl -X POST https://your-domain.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Write a haiku about coding"}
    ],
    "stream": true
  }'
```

You should see a streaming SSE response with the model's reply.

---

## What's next?

- [Getting Started](getting-started.html) — Full walkthrough with Google OAuth setup, Kiro credential flow, and SDK integration examples
- [Configuration Reference](configuration.html) — Environment variables and runtime settings
