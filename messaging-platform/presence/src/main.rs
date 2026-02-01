use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use chrono::{DateTime, Utc};
use dashmap::DashMap;
use redis::{AsyncCommands, RedisResult};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tokio::sync::{broadcast, RwLock};
use tonic::{transport::Server, Request, Response, Status};
use tracing::{error, info, warn};
use uuid::Uuid;

mod presence_proto {
    tonic::include_proto!("presence");
}

use presence_proto::{
    presence_server::{Presence, PresenceServer},
    *,
};

#[derive(Debug, Clone)]
struct PresenceState {
    user_id: Uuid,
    status: String,
    device_id: String,
    ip_address: Option<String>,
    user_agent: Option<String>,
    custom_status: Option<String>,
    last_active: DateTime<Utc>,
    expires_at: DateTime<Utc>,
}

struct PresenceService {
    redis_client: redis::Client,
    pg_pool: PgPool,
    kafka_producer: rdkafka::producer::FutureProducer,
    user_subscriptions: Arc<DashMap<Uuid, broadcast::Sender<PresenceUpdate>>>,
    active_users: Arc<RwLock<HashMap<Uuid, Vec<PresenceState>>>>,
}

#[tonic::async_trait]
impl Presence for PresenceService {
    async fn update_presence(
        &self,
        request: Request<UpdatePresenceRequest>,
    ) -> Result<Response<UpdatePresenceResponse>, Status> {
        let req = request.into_inner();
        
        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;
        
        // Update Redis
        let mut redis_conn = self.redis_client.get_async_connection().await
            .map_err(|e| {
                error!("Redis connection failed: {}", e);
                Status::internal("Redis connection failed")
            })?;
        
        let now = Utc::now();
        let expires_at = now + chrono::Duration::seconds(300); // 5 minute TTL
        
        let presence_data = serde_json::json!({
            "user_id": req.user_id,
            "status": req.status,
            "device_id": req.device_id,
            "ip_address": req.ip_address,
            "user_agent": req.user_agent,
            "custom_status": req.custom_status,
            "last_active": now.to_rfc3339(),
            "expires_at": expires_at.to_rfc3339(),
        });
        
        // Store in Redis with TTL
        let redis_key = format!("presence:{}:{}", user_id, req.device_id);
        let _: RedisResult<()> = redis_conn.set_ex(
            &redis_key,
            presence_data.to_string(),
            300,
        ).await;
        
        // Also store in set for user's all devices
        let user_presence_key = format!("user_presence:{}", user_id);
        let _: RedisResult<()> = redis_conn.sadd(&user_presence_key, &redis_key).await;
        let _: RedisResult<()> = redis_conn.expire(&user_presence_key, 300).await;
        
        // Update PostgreSQL for historical tracking
        sqlx::query!(
            r#"
            INSERT INTO user_presence_history 
            (user_id, device_id, status, ip_address, user_agent, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            user_id,
            req.device_id,
            req.status,
            req.ip_address,
            req.user_agent,
            now
        )
        .execute(&self.pg_pool)
        .await
        .map_err(|e| {
            error!("Failed to store presence history: {}", e);
            Status::internal("Failed to store presence")
        })?;
        
        // Update in-memory state
        let mut active_users = self.active_users.write().await;
        let user_states = active_users.entry(user_id).or_insert_with(Vec::new);
        
        // Update or add device state
        if let Some(existing) = user_states.iter_mut().find(|s| s.device_id == req.device_id) {
            existing.status = req.status.clone();
            existing.last_active = now;
            existing.expires_at = expires_at;
            existing.custom_status = req.custom_status.clone();
        } else {
            user_states.push(PresenceState {
                user_id,
                status: req.status.clone(),
                device_id: req.device_id.clone(),
                ip_address: req.ip_address.clone(),
                user_agent: req.user_agent.clone(),
                custom_status: req.custom_status.clone(),
                last_active: now,
                expires_at,
            });
        }
        
        // Clean up stale entries
        user_states.retain(|state| state.expires_at > now);
        
        // Broadcast presence update
        if let Some(tx) = self.user_subscriptions.get(&user_id) {
            let update = PresenceUpdate {
                user_id: req.user_id.clone(),
                status: req.status.clone(),
                device_id: req.device_id.clone(),
                last_active: now.timestamp(),
                custom_status: req.custom_status.clone(),
            };
            
            let _ = tx.send(update);
        }
        
        // Publish to Kafka for other services
        self.publish_presence_update(&req, &now).await?;
        
        info!("Updated presence for user {}: {}", user_id, req.status);
        
        Ok(Response::new(UpdatePresenceResponse { success: true }))
    }
    
    async fn get_presence(
        &self,
        request: Request<GetPresenceRequest>,
    ) -> Result<Response<GetPresenceResponse>, Status> {
        let req = request.into_inner();
        
        let user_ids: Vec<Uuid> = req.user_ids
            .iter()
            .filter_map(|id| Uuid::parse_str(id).ok())
            .collect();
        
        if user_ids.is_empty() {
            return Err(Status::invalid_argument("No valid user IDs provided"));
        }
        
        let mut redis_conn = self.redis_client.get_async_connection().await
            .map_err(|e| {
                error!("Redis connection failed: {}", e);
                Status::internal("Redis connection failed")
            })?;
        
        let now = Utc::now();
        let mut presence_map = HashMap::new();
        
        for user_id in user_ids {
            let user_presence_key = format!("user_presence:{}", user_id);
            
            // Get all device keys for this user
            let device_keys: Vec<String> = redis_conn.smembers(&user_presence_key).await
                .map_err(|e| {
                    error!("Failed to get device keys: {}", e);
                    Status::internal("Failed to get presence")
                })?;
            
            if !device_keys.is_empty() {
                // Get all device presence data
                let device_data: Vec<String> = redis_conn.mget(&device_keys).await
                    .map_err(|e| {
                        error!("Failed to get presence data: {}", e);
                        Status::internal("Failed to get presence")
                    })?;
                
                // Parse and find most recent/most relevant status
                let mut user_status = "offline".to_string();
                let mut last_active = now;
                let mut custom_status = None;
                
                for data in device_data {
                    if let Ok(presence) = serde_json::from_str::<RedisPresence>(&data) {
                        if presence.expires_at > now {
                            // User is online on this device
                            if presence.status == "online" {
                                user_status = "online".to_string();
                                last_active = presence.last_active;
                                custom_status = presence.custom_status;
                                break;
                            } else if user_status != "online" {
                                // Check for other statuses
                                user_status = presence.status.clone();
                                if presence.last_active > last_active {
                                    last_active = presence.last_active;
                                    custom_status = presence.custom_status.clone();
                                }
                            }
                        }
                    }
                }
                
                presence_map.insert(
                    user_id.to_string(),
                    UserPresence {
                        status: user_status,
                        last_active: last_active.timestamp(),
                        custom_status,
                        devices: device_keys.len() as u32,
                    },
                );
            } else {
                // No active presence found
                presence_map.insert(
                    user_id.to_string(),
                    UserPresence {
                        status: "offline".to_string(),
                        last_active: 0,
                        custom_status: None,
                        devices: 0,
                    },
                );
            }
        }
        
        let response = GetPresenceResponse {
            presence: presence_map,
        };
        
        Ok(Response::new(response))
    }
    
    async fn subscribe_presence(
        &self,
        request: Request<SubscribePresenceRequest>,
    ) -> tonic::Result<tonic::Response<tonic::Streaming<PresenceUpdate>>, Status> {
        let req = request.into_inner();
        
        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;
        
        // Create broadcast channel if it doesn't exist
        let tx = self.user_subscriptions
            .entry(user_id)
            .or_insert_with(|| broadcast::channel(100).0)
            .clone();
        
        let rx = tx.subscribe();
        
        // Stream presence updates
        let stream = tokio_stream::wrappers::BroadcastStream::new(rx)
            .filter_map(|result| async move {
                match result {
                    Ok(update) => Some(update),
                    Err(_) => None,
                }
            })
            .map(|update| Ok(update));
        
        Ok(Response::new(Box::pin(stream) as tonic::Streaming<PresenceUpdate>))
    }
    
    async fn get_online_friends(
        &self,
        request: Request<GetOnlineFriendsRequest>,
    ) -> Result<Response<GetOnlineFriendsResponse>, Status> {
        let req = request.into_inner();
        
        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;
        
        // Get user's friends from database
        let friends = sqlx::query!(
            r#"
            SELECT related_user_id 
            FROM user_relationships 
            WHERE user_id = $1 AND relationship_type = 'friend'
            "#,
            user_id
        )
        .fetch_all(&self.pg_pool)
        .await
        .map_err(|e| {
            error!("Failed to get friends: {}", e);
            Status::internal("Failed to get friends")
        })?;
        
        let friend_ids: Vec<String> = friends
            .into_iter()
            .map(|f| f.related_user_id.to_string())
            .collect();
        
        if friend_ids.is_empty() {
            return Ok(Response::new(GetOnlineFriendsResponse {
                online_friends: Vec::new(),
            }));
        }
        
        // Get presence for all friends
        let presence_req = GetPresenceRequest { user_ids: friend_ids };
        let presence_resp = self.get_presence(Request::new(presence_req)).await?;
        
        let mut online_friends = Vec::new();
        
        for (friend_id, presence) in presence_resp.into_inner().presence {
            if presence.status == "online" {
                online_friends.push(FriendPresence {
                    user_id: friend_id,
                    status: presence.status,
                    last_active: presence.last_active,
                    custom_status: presence.custom_status,
                });
            }
        }
        
        Ok(Response::new(GetOnlineFriendsResponse { online_friends }))
    }
    
    async fn bulk_presence_update(
        &self,
        request: Request<BulkPresenceUpdateRequest>,
    ) -> Result<Response<BulkPresenceUpdateResponse>, Status> {
        let req = request.into_inner();
        
        let mut successes = 0;
        let mut failures = 0;
        
        for update in req.updates {
            let update_req = UpdatePresenceRequest {
                user_id: update.user_id,
                status: update.status,
                device_id: update.device_id,
                ip_address: update.ip_address,
                user_agent: update.user_agent,
                custom_status: update.custom_status,
            };
            
            match self.update_presence(Request::new(update_req)).await {
                Ok(_) => successes += 1,
                Err(_) => failures += 1,
            }
        }
        
        Ok(Response::new(BulkPresenceUpdateResponse {
            successes,
            failures,
        }))
    }
}

impl PresenceService {
    async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let redis_url = std::env::var("REDIS_URL")
            .expect("REDIS_URL must be set");
        let redis_client = redis::Client::open(redis_url)?;
        
        let database_url = std::env::var("DATABASE_URL")
            .expect("DATABASE_URL must be set");
        let pg_pool = sqlx::PgPool::connect(&database_url).await?;
        
        let kafka_brokers = std::env::var("KAFKA_BROKERS")
            .unwrap_or_else(|_| "localhost:9092".to_string());
        
        let kafka_producer: rdkafka::producer::FutureProducer = rdkafka::config::ClientConfig::new()
            .set("bootstrap.servers", &kafka_brokers)
            .set("message.timeout.ms", "5000")
            .create()?;
        
        Ok(Self {
            redis_client,
            pg_pool,
            kafka_producer,
            user_subscriptions: Arc::new(DashMap::new()),
            active_users: Arc::new(RwLock::new(HashMap::new())),
        })
    }
    
    async fn publish_presence_update(
        &self,
        update: &UpdatePresenceRequest,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), Status> {
        let presence_event = PresenceEvent {
            user_id: update.user_id.clone(),
            status: update.status.clone(),
            device_id: update.device_id.clone(),
            timestamp: timestamp.timestamp(),
            custom_status: update.custom_status.clone(),
        };
        
        let payload = serde_json::to_vec(&presence_event)
            .map_err(|e| {
                error!("Failed to serialize presence event: {}", e);
                Status::internal("Serialization failed")
            })?;
        
        let record = rdkafka::producer::FutureRecord::to("presence-events")
            .key(&update.user_id)
            .payload(&payload);
        
        self.kafka_producer.send(record, Duration::from_secs(5)).await
            .map_err(|e| {
                error!("Failed to publish presence event: {}", e);
                Status::internal("Kafka publish failed")
            })?;
        
        Ok(())
    }
    
    async fn start_cleanup_task(&self) {
        let redis_client = self.redis_client.clone();
        let active_users = self.active_users.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(60));
            
            loop {
                interval.tick().await;
                
                let now = Utc::now();
                
                // Clean in-memory cache
                {
                    let mut users = active_users.write().await;
                    users.retain(|_, states| {
                        states.retain(|state| state.expires_at > now);
                        !states.is_empty()
                    });
                }
                
                // Clean Redis (letting TTL handle it automatically)
                // Redis will auto-expire keys based on TTL
            }
        });
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct RedisPresence {
    user_id: String,
    status: String,
    device_id: String,
    ip_address: Option<String>,
    user_agent: Option<String>,
    custom_status: Option<String>,
    last_active: DateTime<Utc>,
    expires_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
struct PresenceEvent {
    user_id: String,
    status: String,
    device_id: String,
    timestamp: i64,
    custom_status: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    
    dotenv::dotenv().ok();
    
    let presence_service = PresenceService::new().await?;
    
    // Start background cleanup task
    presence_service.start_cleanup_task().await;
    
    let addr = "[::1]:50052".parse()?;
    
    info!("Presence service listening on {}", addr);
    
    Server::builder()
        .add_service(PresenceServer::new(presence_service))
        .serve(addr)
        .await?;
    
    Ok(())
}
