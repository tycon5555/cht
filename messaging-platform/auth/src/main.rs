use axum::{
    extract::{Extension, Json, Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::{sync::Arc, time::Duration};
use tracing::{info, warn, error};
use uuid::Uuid;
use validator::Validate;

use shared::models::{User, Report};
use shared::crypto::KeyPair;
use shared::errors::AppError;

struct AppState {
    db_pool: PgPool,
    jwt_secret: String,
    refresh_token_secret: String,
}

#[derive(Debug, Clone)]
pub struct Claims {
    pub sub: Uuid,
    pub exp: usize,
    pub iat: usize,
    pub device_id: String,
    pub session_id: Uuid,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(length(min = 3, max = 32))]
    pub username: String,
    
    #[validate(email)]
    pub email: String,
    
    #[validate(length(min = 8, max = 100))]
    pub password: String,
    
    pub public_key: String, // Base64 encoded Ed25519 public key
    pub dh_public_key: String, // Base64 encoded X25519 public key
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
    pub device_id: String,
    pub device_name: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u64,
    pub user: UserResponse,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub public_key: String,
    pub dh_public_key: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            email: user.email,
            public_key: String::new(), // Will be populated from DB
            dh_public_key: String::new(),
            created_at: user.created_at,
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    
    dotenv::dotenv().ok();
    
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set");
    let refresh_token_secret = std::env::var("REFRESH_TOKEN_SECRET")
        .expect("REFRESH_TOKEN_SECRET must be set");
    
    let db_pool = PgPoolOptions::new()
        .max_connections(50)
        .connect(&database_url)
        .await?;
    
    sqlx::migrate!("./migrations").run(&db_pool).await?;
    
    let state = Arc::new(AppState {
        db_pool,
        jwt_secret,
        refresh_token_secret,
    });
    
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/refresh", post(refresh_token))
        .route("/logout", post(logout))
        .route("/sessions", get(list_sessions))
        .route("/sessions/:session_id", post(revoke_session))
        .route("/users/:user_id", get(get_user))
        .route("/users/search", get(search_users))
        .route("/me", get(get_current_user))
        .route("/me/public-key", post(update_public_key))
        .layer(Extension(state))
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .layer(tower_http::cors::CorsLayer::permissive());
    
    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], 3001));
    info!("Auth service listening on {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;
    
    Ok(())
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "Auth service healthy")
}

async fn register(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    payload.validate()?;
    
    // Check if user exists
    let existing_user = sqlx::query!(
        "SELECT id FROM users WHERE username = $1 OR email = $2",
        payload.username,
        payload.email
    )
    .fetch_optional(&state.db_pool)
    .await?;
    
    if existing_user.is_some() {
        return Err(AppError::Conflict("User already exists".to_string()));
    }
    
    // Hash password with Argon2
    let salt = generate_salt();
    let password_hash = hash_password(&payload.password, &salt)?;
    
    // Generate device ID for initial session
    let device_id = Uuid::new_v4().to_string();
    let session_id = Uuid::new_v4();
    
    // Start transaction
    let mut tx = state.db_pool.begin().await?;
    
    // Insert user
    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users 
        (username, email, password_hash, salt, public_key, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
        "#,
        payload.username,
        payload.email,
        password_hash,
        salt,
        payload.public_key
    )
    .fetch_one(&mut tx)
    .await?;
    
    // Generate tokens
    let (access_token, refresh_token, expires_in) = 
        generate_tokens(&user, &device_id, &session_id, &state)?;
    
    // Hash tokens for storage
    let access_token_hash = hash_token(&access_token);
    let refresh_token_hash = hash_token(&refresh_token);
    
    // Create session
    sqlx::query!(
        r#"
        INSERT INTO sessions 
        (id, user_id, device_id, refresh_token_hash, access_token_hash, created_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '30 days')
        "#,
        session_id,
        user.id,
        device_id,
        refresh_token_hash,
        access_token_hash
    )
    .execute(&mut tx)
    .await?;
    
    tx.commit().await?;
    
    let response = AuthResponse {
        access_token,
        refresh_token,
        expires_in,
        user: UserResponse {
            id: user.id,
            username: user.username,
            email: user.email,
            public_key: payload.public_key,
            dh_public_key: payload.dh_public_key,
            created_at: user.created_at,
        },
    };
    
    Ok(Json(response))
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Find user
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users 
        WHERE username = $1 OR email = $1
        "#,
        payload.username
    )
    .fetch_optional(&state.db_pool)
    .await?
    .ok_or(AppError::Unauthorized("Invalid credentials".to_string()))?;
    
    // Check if account is active
    if !user.is_active {
        return Err(AppError::Forbidden("Account deactivated".to_string()));
    }
    
    // Verify password
    let stored_hash = sqlx::query!(
        "SELECT password_hash, salt FROM users WHERE id = $1",
        user.id
    )
    .fetch_one(&state.db_pool)
    .await?;
    
    if !verify_password(&payload.password, &stored_hash.password_hash, &stored_hash.salt)? {
        return Err(AppError::Unauthorized("Invalid credentials".to_string()));
    }
    
    // Get user's public keys
    let keys = sqlx::query!(
        "SELECT public_key FROM users WHERE id = $1",
        user.id
    )
    .fetch_one(&state.db_pool)
    .await?;
    
    let session_id = Uuid::new_v4();
    
    // Generate tokens
    let (access_token, refresh_token, expires_in) = 
        generate_tokens(&user, &payload.device_id, &session_id, &state)?;
    
    // Hash tokens
    let access_token_hash = hash_token(&access_token);
    let refresh_token_hash = hash_token(&refresh_token);
    
    // Check for existing session on this device
    let existing_session = sqlx::query!(
        "SELECT id FROM sessions WHERE user_id = $1 AND device_id = $2",
        user.id,
        payload.device_id
    )
    .fetch_optional(&state.db_pool)
    .await?;
    
    if let Some(session) = existing_session {
        // Revoke old session
        sqlx::query!(
            "UPDATE sessions SET revoked_at = NOW() WHERE id = $1",
            session.id
        )
        .execute(&state.db_pool)
        .await?;
    }
    
    // Create new session
    sqlx::query!(
        r#"
        INSERT INTO sessions 
        (id, user_id, device_id, refresh_token_hash, access_token_hash, created_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '30 days')
        "#,
        session_id,
        user.id,
        payload.device_id,
        refresh_token_hash,
        access_token_hash
    )
    .execute(&state.db_pool)
    .await?;
    
    // Update last seen
    sqlx::query!(
        "UPDATE users SET last_seen = NOW() WHERE id = $1",
        user.id
    )
    .execute(&state.db_pool)
    .await?;
    
    let response = AuthResponse {
        access_token,
        refresh_token,
        expires_in,
        user: UserResponse {
            id: user.id,
            username: user.username,
            email: user.email,
            public_key: keys.public_key,
            dh_public_key: String::new(), // Would need separate field
            created_at: user.created_at,
        },
    };
    
    Ok(Json(response))
}

async fn refresh_token(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<AuthResponse>, AppError> {
    let refresh_token = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .ok_or(AppError::Unauthorized("Missing token".to_string()))?;
    
    let refresh_token_hash = hash_token(refresh_token);
    
    // Find session by refresh token
    let session = sqlx::query!(
        r#"
        SELECT s.*, u.*
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.refresh_token_hash = $1 
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW
