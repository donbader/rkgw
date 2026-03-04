# Product Definition - rkgw

## Overview

**Name:** rkgw
**Version:** 1.0.8
**Description:** A Rust proxy gateway that translates OpenAI and Anthropic API formats to AWS Kiro backend.

## Problem Statement

Teams need a managed gateway to share Kiro access with guardrails and per-user authentication. Without rkgw, each developer would need direct Kiro credentials and there would be no centralized control over model access, usage tracking, or content safety.

## Target Users

### Developers (API consumers)
- Use AI coding tools (Cursor, Continue, VS Code extensions) that speak OpenAI or Anthropic API formats
- Connect through the gateway transparently via API keys
- Manage their own Kiro credentials and API keys via the web UI

### Platform/DevOps Teams (Administrators)
- Configure the gateway: allowed domains, user management, model routing
- Set up content guardrails (CEL rules + AWS Bedrock)
- Monitor usage metrics and logs via the real-time dashboard
- Manage MCP tool server connections

## Key Goals

1. **Format Compatibility** - Seamless translation between OpenAI/Anthropic API formats and Kiro's proprietary format, including streaming
2. **Per-User Authentication** - Individual Kiro credentials per user with automatic token refresh, API key management, and Google SSO for the web UI
3. **Content Guardrails** - Configurable safety rules using CEL expressions and AWS Bedrock guardrail integration for input/output validation

## Non-Goals

- Not a model hosting platform (proxies to Kiro only)
- Not a multi-cloud AI router (single backend target)
- Not a billing/metering system (tracks usage metrics but doesn't bill)
