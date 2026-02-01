use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Extension, Query, TypedHeader,
    },
    headers,
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Router,
};
use dashmap::DashMap;
use futures::{stream::SplitSink, SinkExt, StreamExt};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::{
    net::TcpListener,
    sync::{mpsc, RwLock},
    time,
};
use tracing::{error, info, warn};
use uuid::Uuid;

use shared::models::User;

type Tx = mpsc::UnboundedSender<Message>;
type Rx = mpsc::UnboundedReceiver<Message>;

struct Connection {
    user_id: Uuid,
    device_id: String,
    last_heartbeat: Instant,
    tx: Tx,
}

struct AppState {
    connections: Arc<DashMap<Uuid, Vec<Connection>>>,
    redis_client: redis::Client,
    kafka_producer: rdkafka::producer::FutureProducer,
}

#[derive(Debug, Deserialize)]
struct WsQuery {
    token: String,
    device_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
enum WsMessage {
    Heartbeat,
    Message(ClientMessage),
    Presence(PresenceUpdate),
    Typing(TypingIndicator),
    ReadReceipt(ReadReceipt),
}

#[derive(Debug, Serialize, Deserialize)]
struct ClientMessage {
    conversation_id: Uuid,
    message_id: Uuid,
    content: Vec<u8>, // Client-encrypted
    nonce: Vec<u8>,
    reply_to: Option<Uuid>,
    timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
struct PresenceUpdate {
    status: String,
    custom_status: Option<String>,
    last_active: i64,
}

#[derive(Debug, Serialize, Deserialize)]
struct TypingIndicator {
    conversation_id: Uuid,
    is_typing: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct ReadReceipt {
    message_id: Uuid,
    conversation_id: Uuid,
    read_at: i64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    
    dotenv::dotenv().ok();
    
    let redis_url = std::env::var("REDIS_URL")
        .expect("REDIS_URL must be set");
    let redis_client = redis::Client::open(redis_url)?;
    
    let kafka_brokers = std::env::var("KAFKA_BROKERS")
        .unwrap_or_else(|_| "localhost:9092".to_string());
    
    let kafka_producer: rdkafka::producer::FutureProducer = rdkafka::config::ClientConfig::new()
        .set("bootstrap.servers", &kafka_brokers)
        .set("message.timeout.ms", "5000")
        .set("queue.buffering.max.ms", "0")
        .create()?;
    
    let state = Arc::new(AppState {
        connections: Arc::new(DashMap::new()),
        redis_client,
        kafka_producer,
    });
    
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/health", get(health_check))
        .layer(Extension(state.clone()));
    
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    let listener = TcpListener::bind(addr).await?;
    info!("WebSocket gateway listening on {}", addr);
    
    // Start connection cleanup task
    let connections = state.connections.clone();
    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(30));
        loop {
            interval.tick().await;
            cleanup_stale_connections(&connections).await;
        }
    });
    
    // Start Kafka consumer for message fan-out
    let state_clone = state.clone();
    tokio::spawn(async move {
        if let Err(e) = start_kafka_consumer(state_clone).await {
            error!("Kafka consumer error: {}", e);
        }
    });
    
    axum::serve(listener, app.into_make_service()).await?;
    
    Ok(())
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WsQuery>,
    Extension(state): Extension<Arc<AppState>>,
) -> impl IntoResponse {
    // Validate JWT token
    let claims = match validate_token(&query.token).await {
        Ok(claims) => claims,
        Err(_) => return StatusCode::UNAUTHORIZED.into_response(),
    };
    
    ws.on_upgrade(move |socket| handle_socket(socket, claims.sub, query.device_id, state))
}

async fn handle_socket(socket: WebSocket, user_id: Uuid, device_id: String, state: Arc<AppState>) {
    let (sender, receiver) = socket.split();
    
    // Create channel for sending messages to this connection
    let (tx, rx) = mpsc::unbounded_channel();
    
    let connection = Connection {
        user_id,
        device_id: device_id.clone(),
        last_heartbeat: Instant::now(),
        tx,
    };
    
    // Store connection
    state
        .connections
        .entry(user_id)
        .or_insert_with(Vec::new)
        .push(connection);
    
    info!("User {} connected from device {}", user_id, device_id);
    
    // Update presence in Redis
    update_presence(&state.redis_client, user_id, "online", &device_id).await;
    
    // Spawn sender task
    let send_task = tokio::spawn(send_messages(sender, rx));
    
    // Spawn receiver task
    let connections = state.connections.clone();
    let redis_client = state.redis_client.clone();
    let kafka_producer = state.kafka_producer.clone();
    
    let receive_task = tokio::spawn(receive_messages(
        receiver,
        user_id,
        device_id,
        connections,
        redis_client,
        kafka_producer,
    ));
    
    // Wait for either task to complete
    tokio::select! {
        _ = send_task => {},
        _ = receive_task => {},
    }
    
    // Cleanup on disconnect
    if let Some(mut connections) = state.connections.get_mut(&user_id) {
        connections.retain(|conn| conn.device_id != device_id);
        if connections.is_empty() {
            state.connections.remove(&user_id);
        }
    }
    
    // Update presence to offline
    update_presence(&state.redis_client, user_id, "offline", &device_id).await;
    
    info!("User {} disconnected from device {}", user_id, device_id);
}

async fn send_messages(mut sender: SplitSink<WebSocket, Message>, mut rx: Rx) {
    while let Some(message) = rx.recv().await {
        if let Err(e) = sender.send(message).await {
            error!("Failed to send WebSocket message: {}", e);
            break;
        }
    }
}

async fn receive_messages(
    mut receiver: futures::stream::SplitStream<WebSocket>,
    user_id: Uuid,
    device_id: String,
    connections: Arc<DashMap<Uuid, Vec<Connection>>>,
    redis_client: redis::Client,
    kafka_producer: rdkafka::producer::FutureProducer,
) {
    while let Some(Ok(message)) = receiver.next().await {
        match message {
            Message::Text(text) => {
                if let Ok(ws_message) = serde_json::from_str::<WsMessage>(&text) {
                    match ws_message {
                        WsMessage::Heartbeat => {
                            // Update heartbeat
                            if let Some(mut conns) = connections.get_mut(&user_id) {
                                for conn in conns.iter_mut() {
                                    if conn.device_id == device_id {
                                        conn.last_heartbeat = Instant::now();
                                        break;
                                    }
                                }
                            }
                        }
                        WsMessage::Message(msg) => {
                            // Forward to Kafka for processing
                            if let Err(e) = forward_to_kafka(&kafka_producer, &msg, user_id).await {
                                error!("Failed to forward message to Kafka: {}", e);
                            }
                        }
                        WsMessage::Presence(presence) => {
                            update_presence(
                                &redis_client,
                                user_id,
                                &presence.status,
                                &device_id,
                            ).await;
                        }
                        WsMessage::Typing(typing) => {
                            // Broadcast typing indicator to conversation participants
                            broadcast_typing(&connections, typing, user_id).await;
                        }
                        WsMessage::ReadReceipt(receipt) => {
                            // Update read receipt in database via Kafka
                            let receipt_data = serde_json::to_string(&receipt)
                                .unwrap_or_default();
                            
                            let record = rdkafka::producer::FutureRecord::to("read-receipts")
                                .key(&user_id.to_string())
                                .payload(&receipt_data);
                            
                            if let Err(e) = kafka_producer.send(record, Duration::from_secs(5)).await {
                                error!("Failed to send read receipt: {}", e);
                            }
                        }
                    }
                }
            }
            Message::Close(_) => {
                break;
            }
            _ => {}
        }
    }
}

async fn forward_to_kafka(
    producer: &rdkafka::producer::FutureProducer,
    message: &ClientMessage,
    sender_id: Uuid,
) -> Result<(), Box<dyn std::error::Error>> {
    let envelope = MessageEnvelope {
        sender_id,
        conversation_id: message.conversation_id,
        message_id: message.message_id,
        content: message.content.clone(),
        nonce: message.nonce.clone(),
        reply_to: message.reply_to,
        timestamp: message.timestamp,
    };
    
    let payload = serde_json::to_vec(&envelope)?;
    
    let record = rdkafka::producer::FutureRecord::to("messages")
        .key(&message.conversation_id.to_string())
        .payload(&payload);
    
    producer.send(record, Duration::from_secs(5)).await?;
    
    Ok(())
}

async fn broadcast_typing(
    connections: &DashMap<Uuid, Vec<Connection>>,
    typing: TypingIndicator,
    sender_id: Uuid,
) {
    // In production, fetch conversation participants from database
    // For now, broadcast to all connections of participants
    
    let typing_msg = serde_json::to_string(&WsMessage::Typing(typing))
        .unwrap_or_default();
    
    for conns in connections.iter() {
        if conns.key() != &sender_id { // Don't send to self
            for conn in conns.value() {
                let _ = conn.tx.send(Message::Text(typing_msg.clone()));
            }
        }
    }
}

async fn update_presence(
    redis_client: &redis::Client,
    user_id: Uuid,
    status: &str,
    device_id: &str,
) {
    let mut conn = match redis_client.get_async_connection().await {
        Ok(conn) => conn,
        Err(e) => {
            error!("Failed to connect to Redis: {}", e);
            return;
        }
    };
    
    let key = format!("presence:{}", user_id);
    let presence_data = serde_json::json!({
        "status": status,
        "device_id": device_id,
        "last_active": chrono::Utc::now().timestamp(),
    });
    
    let _: Result<(), _> = conn.set_ex(
        key,
        presence_data.to_string(),
        300, // 5 minute TTL
    ).await;
}

async fn cleanup_stale_connections(connections: &DashMap<Uuid, Vec<Connection>>) {
    let now = Instant::now();
    let timeout = Duration::from_secs(60); // 1 minute timeout
    
    connections.retain(|user_id, conns| {
        conns.retain(|conn| now.duration_since(conn.last_heartbeat) < timeout);
        !conns.is_empty()
    });
}

async fn validate_token(token: &str) -> Result<TokenClaims, Box<dyn std::error::Error>> {
    use jsonwebtoken::{decode, DecodingKey, Validation};
    
    let secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let token_data = decode::<TokenClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?;
    
    Ok(token_data.claims)
}

#[derive(Debug, Serialize, Deserialize)]
struct TokenClaims {
    sub: Uuid,
    exp: usize,
    iat: usize,
    device_id: String,
    session_id: Uuid,
}

#[derive(Debug, Serialize)]
struct MessageEnvelope {
    sender_id: Uuid,
    conversation_id: Uuid,
    message_id: Uuid,
    content: Vec<u8>,
    nonce: Vec<u8>,
    reply_to: Option<Uuid>,
    timestamp: i64,
}

async fn start_kafka_consumer(state: Arc<AppState>) -> Result<(), Box<dyn std::error::Error>> {
    let kafka_brokers = std::env::var("KAFKA_BROKERS")
        .unwrap_or_else(|_| "localhost:9092".to_string());
    
    let consumer: rdkafka::consumer::StreamConsumer = rdkafka::config::ClientConfig::new()
        .set("group.id", "websocket-gateway")
        .set("bootstrap.servers", &kafka_brokers)
        .set("enable.partition.eof", "false")
        .set("session.timeout.ms", "6000")
        .set("enable.auto.commit", "true")
        .create()?;
    
    consumer.subscribe(&["processed-messages", "presence-updates"])?;
    
    info!("Kafka consumer started");
    
    while let Some(message) = consumer.recv().await {
        match message.topic() {
            "processed-messages" => {
                if let Some(payload) = message.payload() {
                    if let Ok(envelope) = serde_json::from_slice::<MessageEnvelope>(payload) {
                        // Broadcast to all participants in the conversation
                        broadcast_message(&state.connections, envelope).await;
                    }
                }
            }
            "presence-updates" => {
                if let Some(payload) = message.payload() {
                    // Handle presence updates
                    handle_presence_update(&state.connections, payload).await;
                }
            }
            _ => {}
        }
    }
    
    Ok(())
}

async fn broadcast_message(
    connections: &DashMap<Uuid, Vec<Connection>>,
    envelope: MessageEnvelope,
) {
    // Fetch conversation participants (in production, from database)
    // For demo, we'll broadcast to a hardcoded list
    
    let message = WsMessage::Message(ClientMessage {
        conversation_id: envelope.conversation_id,
        message_id: envelope.message_id,
        content: envelope.content,
        nonce: envelope.nonce,
        reply_to: envelope.reply_to,
        timestamp: envelope.timestamp,
    });
    
    let message_json = match serde_json::to_string(&message) {
        Ok(json) => json,
        Err(e) => {
            error!("Failed to serialize message: {}", e);
            return;
        }
    };
    
    // Find all connections for participants and send
    // This is simplified - in production, we'd look up conversation participants
    for conns in connections.iter() {
        for conn in conns.value() {
            if conn.user_id != envelope.sender_id { // Don't echo to sender
                let _ = conn.tx.send(Message::Text(message_json.clone()));
            }
        }
    }
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "Gateway healthy")
}
