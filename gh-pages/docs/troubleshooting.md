---
layout: default
title: Troubleshooting
nav_order: 9
---

# Troubleshooting
{: .no_toc }

Common issues, error messages, and their solutions when running Kiro Gateway.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Quick Diagnostic Checklist

Before diving into specific issues, run through this checklist:

1. **Are all services running?** — `docker compose ps` (expect: db, backend, frontend, certbot)
2. **Is the backend healthy?** — `docker compose logs backend` (look for startup messages)
3. **Can you reach the Web UI?** — Open `https://your-domain/_ui/` in a browser
4. **Is setup complete?** — If you see the setup wizard, complete it first (sign in with Google)
5. **Check the logs** — `docker compose logs -f backend` for backend, `docker compose logs -f frontend` for nginx

---

## Startup Errors

### "Failed to connect to PostgreSQL"

**Cause:** The backend cannot reach the PostgreSQL database at the configured `DATABASE_URL`.

**Solutions:**
- **Check service health:** `docker compose ps` — the `db` service should show "healthy". The backend depends on `db` with `condition: service_healthy`.
- **View db logs:** `docker compose logs db` — check for PostgreSQL startup errors
- **Verify credentials:** Ensure `POSTGRES_PASSWORD` in `.env` matches what the db container expects
- **Connection string:** `DATABASE_URL` is auto-set by docker-compose to `postgres://kiro:$POSTGRES_PASSWORD@db:5432/kiro_gateway`

### Backend container exits immediately

**Cause:** Usually a configuration error or failed database connection.

**Solution:** Check the backend logs for the specific error:

```bash
docker compose logs backend
```

Common causes:
- Invalid environment variables in `.env`
- PostgreSQL not ready (check `docker compose ps` — `db` should be healthy)
- Missing required environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`)

### Frontend (nginx) container won't start

**Cause:** Nginx configuration error or missing TLS certificates.

**Solutions:**
- **Check logs:** `docker compose logs frontend`
- **Missing certificates:** On first run, you must provision certificates first with `./init-certs.sh`
- **Configuration error:** The nginx template uses `envsubst` — verify `DOMAIN` is set in `.env`
- **Port conflict:** Ensure ports 80 and 443 are not in use by another service

---

## TLS / Certificate Issues

### Certbot fails to obtain certificates

**Cause:** Let's Encrypt cannot verify domain ownership via HTTP-01 challenge.

**Solutions:**
- **DNS must point to your server:** Ensure `DOMAIN` in `.env` resolves to your server's public IP
- **Port 80 must be accessible:** Let's Encrypt validates via `http://your-domain/.well-known/acme-challenge/`. Ensure port 80 is open in your firewall and not blocked by another service.
- **Rate limits:** Let's Encrypt has rate limits (5 duplicate certs per week). Check [Let's Encrypt rate limits](https://letsencrypt.org/docs/rate-limits/).
- **Email required:** Ensure `EMAIL` is set in `.env` for Let's Encrypt notifications

### First-time certificate provisioning

On a fresh deployment, run the init script before starting the full stack:

```bash
chmod +x init-certs.sh
./init-certs.sh
```

This obtains the initial Let's Encrypt certificates. After this, certbot auto-renews every 12 hours via the certbot container.

### Certificate not renewing

**Cause:** The certbot container may not be running or the webroot is inaccessible.

**Solutions:**
- **Check certbot status:** `docker compose ps certbot`
- **Check certbot logs:** `docker compose logs certbot`
- **Manual renewal test:** `docker compose run --rm certbot renew --dry-run`
- **Webroot access:** Ensure the nginx configuration serves `/.well-known/acme-challenge/` from the certbot webroot volume

### "SSL: error" or "certificate verify failed" in client

**Cause:** Certificate issues between client and nginx.

**Solutions:**
- Verify certificates exist: `docker compose exec frontend ls -la /etc/letsencrypt/live/$DOMAIN/`
- Check certificate expiry: `docker compose exec frontend openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem`
- Restart nginx after cert renewal: `docker compose restart frontend`

---

## Google SSO Issues

### "OAuth callback URL mismatch"

**Cause:** The `GOOGLE_CALLBACK_URL` in `.env` doesn't match the authorized redirect URI in your Google Cloud Console.

**Solutions:**
- **Check `.env`:** `GOOGLE_CALLBACK_URL` should be `https://your-domain/_ui/api/auth/google/callback`
- **Check Google Cloud Console:** Go to APIs & Services > Credentials > Your OAuth Client. The "Authorized redirect URIs" must include the exact same URL.
- **Protocol matters:** The URL must use `https://`, not `http://`
- **No trailing slash:** Ensure there's no trailing slash mismatch

### "Sign in with Google" fails silently

**Cause:** Missing or incorrect Google OAuth configuration.

**Solutions:**
- Verify all three Google OAuth variables are set in `.env`:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL`
- Check that the OAuth consent screen is configured in Google Cloud Console
- For development, ensure "Test users" are added if the app is in testing mode
- Check backend logs for OAuth errors: `docker compose logs backend | grep -i oauth`

### "Access denied" after Google login

**Cause:** The user's Google account domain may not be in the allowed domain list.

**Solutions:**
- If domain allowlisting is enabled, the admin must add the user's email domain via the web UI
- The first user (admin) bypasses domain restrictions during initial setup
- Check the domain allowlist in the admin panel at `/_ui/`

---

## Authentication Errors

### "Invalid or missing API Key" (401) on /v1/* endpoints

**Cause:** The request doesn't include a valid per-user API key.

**Solutions:**
- Create an API key in the web dashboard at `/_ui/` (API Keys section)
- Verify the key is sent in the correct header:
  - OpenAI-style: `Authorization: Bearer YOUR_API_KEY`
  - Anthropic-style: `x-api-key: YOUR_API_KEY`
- The `Authorization` header must include the `Bearer ` prefix (with a space)
- API keys are per-user — each user must create their own

### "Failed to get access token"

**Cause:** The gateway couldn't obtain a valid Kiro API access token for the user. The user's Kiro refresh token may have expired or not been configured.

**Solutions:**
- Sign in to the web UI and check the Kiro token management section
- Re-configure Kiro credentials for the affected user
- Each user manages their own Kiro tokens — verify the specific user's configuration

### "Setup required. Please complete setup at /_ui/" (503)

**Cause:** The gateway is in setup-only mode because no admin user exists in the database. All `/v1/*` endpoints return 503 until setup is done.

**Solution:** Open `https://your-domain/_ui/` and complete setup by signing in with Google. The first user gets the admin role.

---

## Connection Problems

### Cannot connect to the gateway

**Possible causes and solutions:**

1. **Services not running:** Check all four services are up:
   ```bash
   docker compose ps
   ```

2. **Firewall:** Ensure ports 80 and 443 are open:
   ```bash
   # Check if ports are listening
   ss -tlnp | grep -E ':(80|443)\s'

   # Open firewall (Ubuntu/Debian)
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. **DNS:** Ensure your domain resolves to the server's IP:
   ```bash
   dig your-domain +short
   ```

4. **Nginx not proxying:** Check nginx logs and configuration:
   ```bash
   docker compose logs frontend
   ```

### "502 Bad Gateway" from nginx

**Cause:** Nginx cannot reach the backend service.

**Solutions:**
- Check that the backend container is running: `docker compose ps backend`
- Check backend logs for errors: `docker compose logs backend`
- Verify the backend is listening on port 8000: `docker compose exec backend curl -s http://localhost:8000/health`
- Ensure both services are on the same Docker network

### Streaming responses hang or disconnect

**Possible causes:**

1. **Proxy timeout:** The nginx configuration should have appropriate timeouts for SSE streaming. Check that `proxy_read_timeout` is set high enough (300s recommended for long completions).

2. **First token timeout:** The gateway has a configurable timeout for the first token (default: 15 seconds). If the model takes longer to start responding, increase `first_token_timeout` in the Web UI.

3. **Network timeout:** Some cloud load balancers have idle connection timeouts. Ensure your load balancer timeout exceeds the expected response time (300+ seconds for long completions).

---

## API Errors

### "messages cannot be empty" (400)

**Cause:** The `messages` array in the request body is empty.

**Solution:** Include at least one message:

```json
{
  "model": "claude-sonnet-4-20250514",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ]
}
```

### "max_tokens must be positive" (400)

**Cause:** The `max_tokens` field in an Anthropic-format request is zero or negative.

**Solution:** Set `max_tokens` to a positive integer.

### "Kiro API error: 429 - Rate limit exceeded"

**Cause:** The upstream Kiro API is rate-limiting your requests.

**Solutions:**
- Reduce request frequency
- The gateway automatically retries with backoff (configurable via `http_max_retries`, default: 3)
- Check if multiple users are sharing the same Kiro credentials

### "Kiro API error: 403 - Forbidden"

**Cause:** The Kiro API rejected the request, usually due to an expired or invalid access token.

**Solutions:**
- The gateway auto-refreshes tokens, but if the refresh token itself has expired, the user needs to re-configure their Kiro credentials via the web UI
- Each user manages their own Kiro tokens — check the specific user's token status

### Model not found or unexpected model behavior

**Cause:** The model name doesn't match any known model in the Kiro API.

**Solutions:**
- List available models: `curl -H "Authorization: Bearer YOUR_KEY" https://your-domain/v1/models`
- Use the exact model ID from the list
- The resolver supports common aliases (e.g. `claude-sonnet-4.5`), but if your alias isn't recognized, use the canonical ID

---

## Docker-Specific Issues

### Build fails during `docker compose build`

**Possible causes:**

- **Out of memory:** Rust compilation is memory-intensive. Ensure at least 2 GB RAM is available. On low-memory VPS, add swap:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  ```
- **Network issues:** Both Cargo (Rust dependencies) and npm (frontend dependencies) need internet access during the build.

### PostgreSQL data persistence

PostgreSQL data is stored in a Docker named volume (`pgdata`). If you remove volumes, you lose all configuration, users, and API keys.

**Best practices:**
- **Never** use `docker compose down -v` unless you want to reset everything
- Back up regularly:
  ```bash
  docker compose exec db pg_dump -U kiro kiro_gateway > backup.sql
  ```
- Restore from backup:
  ```bash
  cat backup.sql | docker compose exec -T db psql -U kiro kiro_gateway
  ```

### Port conflicts

**Cause:** Another service is already using port 80 or 443.

**Solution:** Stop the conflicting service or adjust your configuration. The gateway requires ports 80 (for HTTP redirect and certbot) and 443 (for HTTPS).

```bash
# Find what's using the ports
ss -tlnp | grep -E ':(80|443)\s'
```

---

## Log Analysis Tips

### Enable Debug Logging

For detailed request/response logging, change settings in the Web UI (admin only):

- Set `log_level` to `debug`
- Set `debug_mode` to `all` (logs all request/response bodies — use temporarily)

Debug mode options:
- `off` — no debug output (default)
- `errors` — log request/response bodies only for failed requests
- `all` — log all request/response bodies (verbose)

### Viewing Logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Nginx (frontend) only
docker compose logs -f frontend

# Filter by level
docker compose logs backend 2>&1 | grep -i error

# Last 100 lines with timestamps
docker compose logs -f --timestamps --tail=100 backend

# Web UI: use the log viewer at /_ui/ (requires login)
```

### Key Log Messages to Watch For

| Log Message | Meaning |
|-------------|---------|
| `Request to /v1/chat/completions: model=X, stream=Y, messages=Z` | Incoming request received |
| `Model resolution: X -> Y (source: Z, verified: true)` | Model name resolved successfully |
| `Handling streaming response` | Streaming mode activated |
| `Access attempt with invalid or missing API key` | Authentication failure |
| `Failed to get access token` | Kiro token refresh failed |
| `Internal error: ...` | Unexpected server error (check full trace) |

---

## Getting Help

If you can't resolve an issue:

1. Check the [GitHub Issues](https://github.com/if414013/rkgw/issues) for known problems
2. Collect diagnostic information:
   ```bash
   # Service status
   docker compose ps

   # Recent backend logs
   docker compose logs --tail=100 backend

   # Recent nginx logs
   docker compose logs --tail=100 frontend

   # Certificate status
   docker compose exec frontend ls -la /etc/letsencrypt/live/

   # System info
   uname -a
   docker --version
   docker compose version
   ```
3. Open a new issue with the diagnostic information and steps to reproduce
