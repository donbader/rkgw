# Plan: Push Backend & Frontend Images to Docker Hub

## Context

The project has no Docker Hub publishing workflow. Images are only built locally via docker-compose. We need to:
1. Create a production frontend Dockerfile (current one runs `vite dev`)
2. Add a GitHub Actions workflow to build and push both images to Docker Hub on every push to main

## Decisions

- **Docker Hub account**: `taufanvps`
- **Image names**: `taufanvps/harbangan-backend`, `taufanvps/harbangan-frontend`
- **Tags**: `:latest` + `:sha-<7-char commit hash>`
- **Trigger**: On release tag creation only (e.g., `v1.0.8`)
- **Frontend**: Multi-stage build → nginx serving `dist/`

## Changes

### 1. Update `frontend/Dockerfile` — production multi-stage build

Replace the current dev-only Dockerfile with:
- **Stage 1 (build)**: `node:20-alpine` → `npm ci && npm run build` → outputs `dist/`
- **Stage 2 (runtime)**: `nginx:alpine` → copy `dist/` to `/usr/share/nginx/html`
- Add `frontend/nginx.conf` for SPA routing (all routes → `index.html`, proxy `/_ui/api` → backend)

**Files**: `frontend/Dockerfile`, `frontend/nginx.conf`

### 2. Create `.github/workflows/docker-push.yml`

New workflow triggered on release tag creation (`v*`):
- **Trigger**: `on: push: tags: ['v*']`
- **Steps**:
  1. Checkout code
  2. Set up Docker Buildx
  3. Extract version from tag (e.g., `v1.0.8` → `1.0.8`)
  4. Login to Docker Hub (using `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` secrets)
  5. Build + push backend: `taufanvps/harbangan-backend:latest`, `:v1.0.8`, `:sha-<hash>`
  6. Build + push frontend: `taufanvps/harbangan-frontend:latest`, `:v1.0.8`, `:sha-<hash>`
- Use `docker/build-push-action@v6` for caching

### 3. Update `docker-compose.yml` — reference Docker Hub images

Add `image:` directives so users can pull pre-built images instead of building locally:
- `taufanvps/harbangan-backend:latest`
- `taufanvps/harbangan-frontend:latest`

### 4. GitHub Secrets Required (manual setup)

User must add these in GitHub repo Settings → Secrets:
- `DOCKERHUB_USERNAME` = `if414013`
- `DOCKERHUB_TOKEN` = Docker Hub Personal Access Token

## Files Modified

| File | Change |
|------|--------|
| `frontend/Dockerfile` | Replace dev Dockerfile with production multi-stage (node build → nginx) |
| `frontend/nginx.conf` | New — SPA routing + API proxy config |
| `.github/workflows/docker-push.yml` | New — Build & push workflow |
| `docker-compose.yml` | Add `image:` for both services |
| `docker-compose.gateway.yml` | Update `image:` to Docker Hub name |

## Agent Assignment

- **devops-engineer**: Workflow file, docker-compose updates
- **react-frontend-engineer**: Production Dockerfile + nginx.conf

## Verification

1. `docker build -t test-frontend ./frontend` — builds successfully
2. `docker compose config --quiet` — valid compose files
3. Push to main → workflow runs → images appear on Docker Hub
4. `docker pull taufanvps/harbangan-backend:latest` — works
5. `docker pull taufanvps/harbangan-frontend:latest` — works
