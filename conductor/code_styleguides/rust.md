# Rust Style Guide - Harbangan Backend

## Formatting

- Use `cargo fmt` (rustfmt defaults) before every commit
- Run `cargo clippy` and fix ALL warnings before committing

## Imports

Group imports with blank lines between groups:

```rust
// 1. std library
use std::sync::Arc;

// 2. External crates (alphabetical)
use axum::extract::State;
use serde::{Deserialize, Serialize};
use tracing::{debug, info, error};

// 3. Crate-internal modules
use crate::models::openai::ChatRequest;
use crate::routes::AppState;
```

## Error Handling

- Define error enums with `thiserror` in `error.rs` files
- Use `anyhow::Result` with `.context()` for error propagation
- `ApiError` implements `IntoResponse` for HTTP error mapping
- Never use `.unwrap()` in production code; use `.expect("reason")` only for truly impossible cases

```rust
#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Authentication failed: {0}")]
    AuthError(String),
    #[error("Internal server error")]
    Internal(#[from] anyhow::Error),
}
```

## Logging

Use `tracing` macros with structured fields:

```rust
debug!(model = %model_id, "Processing request");
info!(tokens = count, latency_ms = elapsed, "Request completed");
error!(error = ?err, endpoint = %path, "Failed to process");
```

- `debug!` for request flow details
- `info!` for successful operations with metrics
- `warn!` for recoverable issues
- `error!` for failures requiring attention

## Naming

- Functions: `snake_case`
- Types/Structs/Enums: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Module files: `snake_case.rs`
- Test functions: `test_<function_name>_<scenario>`

## Structs and Types

- Derive `Debug` on all types, `Clone` where needed
- Use `#[serde(rename_all = "snake_case")]` for JSON serialization
- Prefer `&str` over `String` in function parameters where possible
- Use `Arc<T>` for shared state, `Arc<RwLock<T>>` for mutable shared state

## Async Patterns

- All handlers are async (Axum requirement)
- Use `tokio::spawn` for background tasks
- Prefer `tokio::sync::RwLock` over `std::sync::RwLock` for async contexts
- Use `DashMap` for concurrent in-memory caches

## Testing

- Place tests in `#[cfg(test)] mod tests` at the bottom of each file
- Use `#[tokio::test]` for async tests
- Name: `test_<function>_<scenario>`
- Use `create_test_config()` or `Config::with_defaults()` for test setup
- Feature-gate integration tests: `#[cfg(any(test, feature = "test-utils"))]`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_auth_refresh_expired_token() {
        let config = create_test_config();
        // ...
    }
}
```

## Module Organization

- One file per logical concern (e.g., `openai_to_kiro.rs`, `kiro_to_openai.rs`)
- Shared logic in `core.rs` or `mod.rs`
- Public API defined in `mod.rs` with `pub use` re-exports
- Keep `mod.rs` files thin - mainly re-exports and shared types
