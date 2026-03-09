use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::routes::AppState;
use crate::web_ui::config_db::RegistryModel;

// ── Request / Response Types ─────────────────────────────────

/// Response for GET /admin/models — list all registry models.
#[derive(Debug, Serialize)]
pub struct ModelsListResponse {
    pub models: Vec<RegistryModel>,
    pub total: usize,
}

/// Request body for PATCH /admin/models/:id — toggle enabled or update display_name.
#[derive(Debug, Deserialize)]
pub struct UpdateModelRequest {
    pub enabled: Option<bool>,
    pub display_name: Option<String>,
}

/// Response after updating a model.
#[derive(Debug, Serialize)]
pub struct UpdateModelResponse {
    pub success: bool,
    pub id: Uuid,
}

/// Request body for POST /admin/models/populate.
#[derive(Debug, Deserialize)]
pub struct PopulateRequest {
    /// Optional provider_id to populate. If None, populates all providers.
    pub provider_id: Option<String>,
}

/// Response after populating models.
#[derive(Debug, Serialize)]
pub struct PopulateResponse {
    pub success: bool,
    pub models_upserted: usize,
}

/// Response after deleting a model.
#[derive(Debug, Serialize)]
pub struct DeleteModelResponse {
    pub success: bool,
    pub id: Uuid,
}

// ── Route Handlers (stubs) ───────────────────────────────────

/// GET /admin/models — list all models in the registry.
async fn list_models(State(state): State<AppState>) -> impl IntoResponse {
    let db = match state.require_config_db() {
        Ok(db) => db,
        Err(e) => return e.into_response(),
    };

    match db.get_all_registry_models().await {
        Ok(models) => {
            let total = models.len();
            Json(ModelsListResponse { models, total }).into_response()
        }
        Err(e) => {
            tracing::error!(error = ?e, "Failed to list registry models");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Failed to list models"})),
            )
                .into_response()
        }
    }
}

/// PATCH /admin/models/:id — update a model (enable/disable, rename).
async fn update_model(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateModelRequest>,
) -> impl IntoResponse {
    let db = match state.require_config_db() {
        Ok(db) => db,
        Err(e) => return e.into_response(),
    };

    if let Some(enabled) = body.enabled {
        match db.update_model_enabled(id, enabled).await {
            Ok(true) => {}
            Ok(false) => {
                return (
                    StatusCode::NOT_FOUND,
                    Json(serde_json::json!({"error": "Model not found"})),
                )
                    .into_response();
            }
            Err(e) => {
                tracing::error!(error = ?e, "Failed to update model enabled");
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Failed to update model"})),
                )
                    .into_response();
            }
        }
    }

    // display_name update not yet implemented — will be added in Phase 2
    if body.display_name.is_some() {
        tracing::debug!(id = %id, "display_name update not yet implemented");
    }

    Json(UpdateModelResponse { success: true, id }).into_response()
}

/// DELETE /admin/models/:id — remove a model from the registry.
async fn delete_model(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let db = match state.require_config_db() {
        Ok(db) => db,
        Err(e) => return e.into_response(),
    };

    match db.delete_registry_model(id).await {
        Ok(true) => Json(DeleteModelResponse { success: true, id }).into_response(),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Model not found"})),
        )
            .into_response(),
        Err(e) => {
            tracing::error!(error = ?e, "Failed to delete model");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Failed to delete model"})),
            )
                .into_response()
        }
    }
}

/// POST /admin/models/populate — populate models from API or static data.
async fn populate_models(
    State(_state): State<AppState>,
    Json(_body): Json<PopulateRequest>,
) -> impl IntoResponse {
    // Full implementation in Phase 2 — needs AppState access to auth_manager, http_client
    (
        StatusCode::NOT_IMPLEMENTED,
        Json(serde_json::json!({"error": "Populate not yet implemented — coming in Phase 2"})),
    )
}

// ── Router ───────────────────────────────────────────────────

/// Admin model registry routes, to be nested under `/admin/models`.
pub fn model_registry_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_models))
        .route("/{id}", patch(update_model))
        .route("/{id}", delete(delete_model))
        .route("/populate", post(populate_models))
}
