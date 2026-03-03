# Auth Session Files

This directory holds captured browser session state for E2E tests.

## Quick Start

1. Make sure the gateway is running via docker-compose at https://localhost
2. Run the interactive setup:
   ```bash
   cd frontend
   npm run test:e2e:setup
   ```
3. A browser window opens at the login page
4. Complete Google SSO login manually
5. Once logged in, click **Resume** in the Playwright Inspector
6. The session is saved to `session.json`

## What's Captured

`session.json` contains browser cookies including:
- `kgw_session` — session authentication cookie (24h TTL)
- `csrf_token` — CSRF protection token

## Refreshing

Sessions expire after 24 hours. Re-run `npm run test:e2e:setup` to capture a fresh session.

## Security

`session.json` contains real authentication tokens. It is git-ignored and should never be committed.
