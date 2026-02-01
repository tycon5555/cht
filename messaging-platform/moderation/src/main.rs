use axum::{
    extract::{Extension, Json, Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::{collections::HashMap, sync::Arc, time::Duration};
use tracing::{error, info, warn};
use uuid::Uuid;
use validator::Validate;

use shared::models::{Report, ReportReason, ReportStatus, ReportTargetType};
use shared::errors::AppError;

struct AppState {
    db_pool: PgPool,
    redis_client: redis::Client,
    kafka_producer: rdkafka::producer::FutureProducer,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateReportRequest {
    pub target_id: String,
    pub target_type: ReportTargetType,
    pub reason: ReportReason,
    #[validate(length(max = 1000))]
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ReportResponse {
    pub id: Uuid,
    pub reporter_id: Uuid,
    pub target_id: Uuid,
    pub target_type: String,
    pub reason: String,
    pub description: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub resolved_by: Option<Uuid>,
}

impl From<Report> for ReportResponse {
    fn from(report: Report) -> Self {
        Self {
            id: report.id,
            reporter_id: report.reporter_id,
            target_id: report.target_id,
            target_type: format!("{:?}", report.target_type),
            reason: format!("{:?}", report.reason),
            description: report.description,
            status: format!("{:?}", report.status),
            created_at: report.created_at,
            resolved_at: report.resolved_at,
            resolved_by: report.resolved_by,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateReportRequest {
    pub status: ReportStatus,
    pub action_taken: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ModerationActionRequest {
    pub action: ModerationAction,
    pub duration_seconds: Option<i64>,
    pub reason: String,
}

#[derive(Debug, Deserialize)]
pub enum ModerationAction {
    BanUser,
    UnbanUser,
    MuteUser,
    DeleteMessage,
    DeleteGroup,
    RemoveMember,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    
    dotenv::dotenv().ok();
    
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let redis_url = std::env::var("REDIS_URL")
        .expect("REDIS_URL must be set");
    
    let db_pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&database_url)
        .await?;
    
    let redis_client = redis::Client::open(redis_url)?;
    
    let kafka_brokers = std::env::var("KAFKA_BROKERS")
        .unwrap_or_else(|_| "localhost:9092".to_string());
    
    let kafka_producer: rdkafka::producer::FutureProducer = rdkafka::config::ClientConfig::new()
        .set("bootstrap.servers", &kafka_brokers)
        .set("message.timeout.ms", "5000")
        .create()?;
    
    // Run migrations
    sqlx::migrate!("./migrations").run(&db_pool).await?;
    
    let state = Arc::new(AppState {
        db_pool,
        redis_client,
        kafka_producer,
    });
    
    let app = Router::new()
        .route("/reports", post(create_report))
        .route("/reports", get(list_reports))
        .route("/reports/{report_id}", get(get_report))
        .route("/reports/{report_id}", post(update_report))
        .route("/reports/{report_id}/resolve", post(resolve_report))
        .route("/moderate/action", post(take_moderation_action))
        .route("/moderate/user/{user_id}/status", get(get_user_moderation_status))
        .route("/moderate/stats", get(get_moderation_stats))
        .route("/health", get(health_check))
        .layer(Extension(state))
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .layer(tower_http::cors::CorsLayer::permissive());
    
    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], 3004));
    info!("Moderation service listening on {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;
    
    Ok(())
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "Moderation service healthy")
}

async fn create_report(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<CreateReportRequest>,
) -> Result<Json<ReportResponse>, AppError> {
    // Extract user ID from JWT (simplified)
    let user_id = extract_user_id_from_headers(&headers)?;
    
    payload.validate()?;
    
    // Validate target exists based on type
    validate_report_target(&state.db_pool, &payload.target_id, &payload.target_type).await?;
    
    // Check if user has already reported this target recently
    let recent_report = sqlx::query!(
        r#"
        SELECT id FROM reports 
        WHERE reporter_id = $1 
        AND target_id = $2::uuid
        AND target_type = $3
        AND created_at > NOW() - INTERVAL '24 hours'
        LIMIT 1
        "#,
        user_id,
        payload.target_id,
        format!("{:?}", payload.target_type)
    )
    .fetch_optional(&state.db_pool)
    .await?;
    
    if recent_report.is_some() {
        return Err(AppError::Conflict(
            "You have already reported this target recently".to_string(),
        ));
    }
    
    let target_id = Uuid::parse_str(&payload.target_id)
        .map_err(|_| AppError::ValidationError("Invalid target ID".to_string()))?;
    
    let report = sqlx::query_as!(
        Report,
        r#"
        INSERT INTO reports 
        (reporter_id, target_id, target_type, reason, description, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
        RETURNING *
        "#,
        user_id,
        target_id,
        format!("{:?}", payload.target_type),
        format!("{:?}", payload.reason),
        payload.description
    )
    .fetch_one(&state.db_pool)
    .await?;
    
    // Publish report created event
    publish_moderation_event(
        &state.kafka_producer,
        "report_created",
        &report.id,
        &user_id,
    ).await?;
    
    // Check for automated actions (e.g., auto-ban for spam)
    check_automated_actions(&state, &report).await?;
    
    info!("Report created: {} by user {}", report.id, user_id);
    
    Ok(Json(ReportResponse::from(report)))
}

async fn list_reports(
    State(state): State<Arc<AppState>>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<ReportResponse>>, AppError> {
    let status_filter = params.get("status").map(|s| s.as_str());
    let target_type_filter = params.get("target_type").map(|s| s.as_str());
    let limit = params.get("limit").and_then(|l| l.parse().ok()).unwrap_or(50);
    let offset = params.get("offset").and_then(|o| o.parse().ok()).unwrap_or(0);
    
    let mut query = "SELECT * FROM reports WHERE 1=1".to_string();
    let mut args: Vec<&(dyn sqlx::postgres::PgHasArrayType + Send + Sync)> = Vec::new();
    
    if let Some(status) = status_filter {
        query.push_str(" AND status = $");
        args.push(&status);
    }
    
    if let Some(target_type) = target_type_filter {
        query.push_str(" AND target_type = $");
        args.push(&target_type);
    }
    
    query.push_str(" ORDER BY created_at DESC LIMIT $ OFFSET $");
    
    let reports = sqlx::query_as::<_, Report>(&query)
        .fetch_all(&state.db_pool)
        .await?;
    
    let responses = reports.into_iter()
        .map(ReportResponse::from)
        .collect();
    
    Ok(Json(responses))
}

async fn get_report(
    State(state): State<Arc<AppState>>,
    Path(report_id): Path<Uuid>,
) -> Result<Json<ReportResponse>, AppError> {
    let report = sqlx::query_as!(
        Report,
        r#"
        SELECT * FROM reports WHERE id = $1
        "#,
        report_id
    )
    .fetch_optional(&state.db_pool)
    .await?
    .ok_or(AppError::NotFound("Report not found".to_string()))?;
    
    Ok(Json(ReportResponse::from(report)))
}

async fn update_report(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(report_id): Path<Uuid>,
    Json(payload): Json<UpdateReportRequest>,
) -> Result<Json<ReportResponse>, AppError> {
    // Extract moderator ID from JWT
    let moderator_id = extract_user_id_from_headers(&headers)?;
    
    // Verify user is a moderator/admin
    verify_moderator_role(&state.db_pool, &moderator_id).await?;
    
    let report = sqlx::query_as!(
        Report,
        r#"
        UPDATE reports 
        SET status = $1, 
            resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE NULL END,
            resolved_by = CASE WHEN $1 = 'resolved' THEN $2 ELSE NULL END
        WHERE id = $3
        RETURNING *
        "#,
        format!("{:?}", payload.status),
        moderator_id,
        report_id
    )
    .fetch_optional(&state.db_pool)
    .await?
    .ok_or(AppError::NotFound("Report not found".to_string()))?;
    
    // Publish report updated event
    publish_moderation_event(
        &state.kafka_producer,
        "report_updated",
        &report.id,
        &moderator_id,
    ).await?;
    
    Ok(Json(ReportResponse::from(report)))
}

async fn resolve_report(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(report_id): Path<Uuid>,
    Json(payload): Json<UpdateReportRequest>,
) -> Result<Json<ReportResponse>, AppError> {
    // Extract moderator ID from JWT
    let moderator_id = extract_user_id_from_headers(&headers)?;
    
    // Verify user is a moderator/admin
    verify_moderator_role(&state.db_pool, &moderator_id).await?;
    
    let report = sqlx::query_as!(
        Report,
        r#"
        UPDATE reports 
        SET status = 'resolved', 
            resolved_at = NOW(),
            resolved_by = $1,
            action_taken = $2
        WHERE id = $3
        RETURNING *
        "#,
        moderator_id,
        payload.action_taken,
        report_id
    )
    .fetch_optional(&state.db_pool)
    .await?
    .ok_or(AppError::NotFound("Report not found".to_string()))?;
    
    // Publish report resolved event
    publish_moderation_event(
        &state.kafka_producer,
        "report_resolved",
        &report.id,
        &moderator_id,
    ).await?;
    
    Ok(Json(ReportResponse::from(report)))
}

async fn take_moderation_action(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<ModerationActionRequest>,
) -> Result<StatusCode, AppError> {
    // Extract moderator ID from JWT
    let moderator_id = extract_user_id_from_headers(&headers)?;
    
    // Verify user is a moderator/admin
    verify_moderator_role(&state.db_pool, &moderator_id).await?;
    
    match payload.action {
        ModerationAction::BanUser => {
            // Extract target user ID from request (would need additional field)
            // ban_user(&state, target_user_id, payload.duration_seconds, &payload.reason).await?;
        }
        ModerationAction::UnbanUser => {
            // unban_user(&state, target_user_id).await?;
        }
        ModerationAction::MuteUser => {
            // mute_user(&state, target_user_id, payload.duration_seconds).await?;
        }
        ModerationAction::DeleteMessage => {
            // delete_message(&state, message_id).await?;
        }
        ModerationAction::DeleteGroup => {
            // delete_group(&state, group_id).await?;
        }
        ModerationAction::RemoveMember => {
            // remove_member(&state, group_id, user_id).await?;
        }
    }
    
    // Publish moderation action event
    let action_event = ModerationActionEvent {
        moderator_id,
        action: format!("{:?}", payload.action),
        reason: payload.reason,
        timestamp: Utc::now().timestamp(),
    };
    
    let payload = serde_json::to_vec(&action_event)
        .map_err(|e| AppError::SerializationError(e.to_string()))?;
    
    let record = rdkafka::producer::FutureRecord::to("moderation-actions")
        .key(&moderator_id.to_string())
        .payload(&payload);
    
    state.kafka_producer.send(record, Duration::from_secs(5)).await
        .map_err(|e| AppError::ExternalServiceError(e.to_string()))?;
    
    Ok(StatusCode::OK)
}

async fn get_user_moderation_status(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<UserModerationStatus>, AppError> {
    // Get user's active bans/mutes
    let active_restrictions = sqlx::query!(
        r#"
        SELECT restriction_type, expires_at, reason 
        FROM user_restrictions 
        WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
        "#,
        user_id
    )
    .fetch_all(&state.db_pool)
    .await?;
    
    // Get report count
    let report_count = sqlx::query!(
