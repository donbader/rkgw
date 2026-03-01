# Docker Deployment Runbook

## Prerequisites

- Docker and Docker Compose installed on the VPS
- `rsync` available on both your local machine and the server
- The repository cloned on the server at `/path/to/rkgw`

---

## First-Time Setup

### 1. Generate a TLS certificate (once)

The gateway requires TLS when binding to `0.0.0.0` (enforced at startup). Run this on
the server to generate a 10-year self-signed certificate:

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 \
  -keyout certs/key.pem -out certs/cert.pem \
  -days 3650 -nodes \
  -subj "/CN=$(hostname)"
```

> **Tip:** To use a real certificate (e.g. from Let's Encrypt), place `fullchain.pem` as
> `certs/cert.pem` and `privkey.pem` as `certs/key.pem`. No other changes are needed.

### 2. Sync the kiro-cli auth database from your local machine

The gateway reads AWS SSO OIDC credentials from the kiro-cli SQLite database. Run this
on **your local machine**:

```bash
# macOS
rsync -avz ~/Library/Application\ Support/kiro-cli/data.sqlite3 \
  user@your-server:/path/to/rkgw/kiro-data.db

# Linux
rsync -avz ~/.local/share/kiro-cli/data.sqlite3 \
  user@your-server:/path/to/rkgw/kiro-data.db
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env — at minimum set PROXY_API_KEY and KIRO_REGION
```

Do **not** set `SERVER_HOST`, `TLS_ENABLED`, `KIRO_CLI_DB_FILE`, `CONFIG_DB`, `TLS_CERT`,
or `TLS_KEY` in `.env` — these are managed by `docker-compose.yml`.

### 4. Build and start

```bash
docker compose up -d --build
docker compose logs -f
```

The first build takes a few minutes (compiles Rust + React). Subsequent builds are fast
unless `Cargo.toml` or `package.json` dependencies change.

### 5. Verify

```bash
# Health check (self-signed cert → use -k)
curl -k https://your-server:8000/health
# → {"status":"ok"}

# Model list
curl -k -H "Authorization: Bearer <PROXY_API_KEY>" \
  https://your-server:8000/v1/models

# Web dashboard
open https://your-server:8000/_ui/
```

---

## Token Refresh Workflow

AWS SSO tokens in the kiro-cli DB expire periodically (typically every 8 hours). The
gateway reads the DB on each request, so syncing the file is all that's needed — no
container restart required.

**Manual sync** (run on local machine whenever you refresh your Kiro session):

```bash
# macOS
rsync -avz ~/Library/Application\ Support/kiro-cli/data.sqlite3 \
  user@your-server:/path/to/rkgw/kiro-data.db
```

**Automated sync** via cron on the server (requires SSH key-based auth from server to
local machine, or a reverse approach where your local machine pushes on a schedule):

```cron
# /etc/cron.d/kiro-sync — sync every 4 hours from local machine
0 */4 * * * youruser rsync user@local-machine:/path/to/kiro-data.db \
  /path/to/rkgw/kiro-data.db 2>&1 | logger -t kiro-sync
```

---

## Day-to-Day Operations

```bash
# View live logs
docker compose logs -f

# Check container status (should show "healthy" after ~30s)
docker compose ps

# Stop the gateway
docker compose down

# Rebuild after code changes
docker compose up -d --build

# Restart without rebuild
docker compose restart gateway

# Update TLS cert (no rebuild needed — certs are bind-mounted)
cp new-cert.pem certs/cert.pem
cp new-key.pem certs/key.pem
docker compose restart gateway
```

---

## Volume Layout

| Mount | Type | Purpose |
|-------|------|---------|
| `./kiro-data.db:/kiro-data.db:ro` | bind (read-only) | kiro-cli auth credentials |
| `config-db:/data` | named volume | gateway config SQLite DB (persists restarts) |
| `./certs:/certs:ro` | bind (read-only) | TLS cert + key (operator-managed) |

The `config-db` named volume is managed by Docker. To inspect or back it up:

```bash
docker run --rm -v rkgw_config-db:/data busybox ls /data
docker run --rm -v rkgw_config-db:/data -v $(pwd):/backup \
  busybox tar czf /backup/config-db-backup.tar.gz /data
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `TLS is required when binding to non-localhost` | `TLS_ENABLED` not set | Ensure `docker-compose.yml` has `TLS_ENABLED: "true"` in `environment:` |
| `TLS certificate file not found` | Certs not in `./certs/` | Run step 1 (generate certs) |
| `Failed to open database` | `kiro-data.db` missing | Run step 2 (sync auth DB) |
| Container exits immediately | Bad env var or DB path | `docker compose logs gateway` for details |
| `healthy` never reached | TLS cert untrusted by curl | Healthcheck uses `-k` (insecure); if still failing, check port binding |
