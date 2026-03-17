# Plan: Fix Misleading & Incomplete Documentation

## Context

The README "Supported Models" section only lists 3 models but the backend supports 5 providers with many more models. Client setup docs don't distinguish between deployment modes. The user wants the README to list all available models and redirect to gh-pages for client setup details.

## Files to Modify

| File | Change |
|------|--------|
| `README.md` (lines 27-35) | Rewrite "Supported Models" → provider-aware section with all models |
| `gh-pages/docs/client-setup.md` | Split configs by deployment mode, add provider prefix docs |

---

## 1. README.md — Rewrite "Supported Models"

Replace current 3-model table (lines 27-35) with a comprehensive provider + model listing.

### Structure:

```markdown
## Supported Providers & Models

Model availability depends on your deployment mode.

### Kiro (proxy-only + full deployment)

All Claude models via AWS CodeWhisperer. Default provider for both modes.

| Model | ID | Description |
|-------|----|-------------|
| Claude Opus 4.6 | `claude-opus-4.6` | Latest flagship. Complex reasoning |
| Claude Sonnet 4.6 | `claude-sonnet-4.6` | Balanced. Coding, general-purpose |
| Claude Haiku 4.5 | `claude-haiku-4.5` | Fast. Quick responses, simple tasks |
| Claude Sonnet 4 | `claude-sonnet-4` | Previous generation balanced |
| Claude 3.7 Sonnet | `claude-3.7-sonnet` | Legacy |
| Claude 3.5 Sonnet v2 | `claude-3-5-sonnet-20241022` | Legacy |
| Claude 3.5 Sonnet v1 | `claude-3-5-sonnet-20240620` | Legacy |
| Claude 3.5 Haiku | `claude-3-5-haiku-20241022` | Legacy |
| Claude 3 Opus | `claude-3-opus-20240229` | Legacy |
| Claude 3 Sonnet | `claude-3-sonnet-20240229` | Legacy |
| Claude 3 Haiku | `claude-3-haiku-20240307` | Legacy |

> **Smart Model Resolution:** Use any name format — `claude-sonnet-4-6`, `claude-sonnet-4.6`,
> or versioned like `claude-sonnet-4-20250514`. The gateway normalizes automatically.

### Direct Providers (full deployment only)

Requires per-user OAuth tokens configured in the Web UI. Use the `provider/model` prefix.

| Provider | Example Models | Prefix |
|----------|---------------|--------|
| Anthropic | Claude family (direct API) | `anthropic/` |
| OpenAI Codex | GPT-4, o1, o3, o4, ChatGPT | `openai_codex/` |
| GitHub Copilot | Copilot models | `copilot/` |
| Qwen | Qwen, QwQ family | `qwen/` |

> Direct provider models bypass Kiro entirely. See [Client Setup](https://if414013.github.io/harbangan/docs/client-setup) for configuration.
```

**Source data:**
- Hidden models: `backend/src/main.rs:495-518` (`add_hidden_models` function)
- Provider IDs: `backend/src/providers/types.rs:8-20` (`ProviderId` enum)
- Provider routing: `backend/src/providers/registry.rs:64-82` (`provider_for_model`)
- Model normalization: `backend/src/resolver.rs:34-75` (`normalize_model_name`)

---

## 2. gh-pages/docs/client-setup.md — Mode-Aware Client Setup

### Changes:

**A. Add a "Before You Start" section** at the top explaining the two modes:

```markdown
## Before You Start

Your configuration depends on your deployment mode:

| | Proxy-Only | Full Deployment |
|---|---|---|
| API Key | `PROXY_API_KEY` from `.env.proxy` | Personal key from Web UI (`/_ui/`) |
| Providers | Kiro only | Kiro + Anthropic, OpenAI, Copilot, Qwen |
| Models | `claude-*` names, `auto` | + `anthropic/`, `openai_codex/`, `copilot/`, `qwen/` prefixes |
```

**B. For each client section**, add mode callouts:

- Claude Code: show both `PROXY_API_KEY` and Web UI key scenarios
- Zed: same distinction
- OpenCode: add direct provider model configs alongside Kiro ones
- Cursor/VS Code: clarify which base URL to use

**C. Add a "Model Naming" section** before Known Limitations:

```markdown
## Model Naming

### Kiro pipeline (default)
Use Claude model names directly. The gateway normalizes variants:
- `claude-sonnet-4-6` → `claude-sonnet-4.6`
- `claude-3-7-sonnet-20250219` → `claude-3.7-sonnet`
- `auto` → gateway picks the best available model

### Direct providers (full deployment only)
Prefix with the provider name to bypass Kiro:
- `anthropic/claude-opus-4-6` → Anthropic API directly
- `openai_codex/gpt-4` → OpenAI Codex
- `qwen/qwen-coder` → Qwen
- `copilot/gpt-4` → GitHub Copilot

Requires OAuth tokens configured per-user in the Web UI Providers page.
```

---

## Verification

1. Review diffs: `git diff README.md gh-pages/docs/client-setup.md`
2. Check README renders on GitHub (model tables, provider info)
3. Verify gh-pages markdown is valid Jekyll (frontmatter preserved, TOC works)
4. No backend changes — docs only
