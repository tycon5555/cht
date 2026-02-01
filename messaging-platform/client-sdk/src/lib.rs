use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime};

use async_trait::async_trait;
use chacha20poly1305::{ChaCha20Poly1305, KeyInit, Key as ChaChaKey, Nonce as ChaChaNonce};
use ed25519_dalek::{Signature, Signer, SigningKey, VerifyingKey};
use futures::{SinkExt, StreamExt};
use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, Mutex, RwLock};
use tokio_tungstenite::{connect_async, tungstenite::Message};
use uuid::Uuid;
use x25519_dalek::{PublicKey, StaticSecret};

#[derive(Debug, thiserror::Error)]
pub enum SdkError {
    #[error("Network error: {0}")]
    NetworkError(String),
    
    #[error("Authentication error: {0}")]
    AuthError(String),
    
    #[error("Encryption error: {0}")]
    EncryptionError(String),
    
    #[error("WebSocket error: {0}")]
    WebSocketError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    #[error("Invalid state: {0}")]
    InvalidState(String),
}

pub struct MessagingClient {
    http_client: Client,
    base_url: String,
    ws_url: String,
    auth_token: Option<String>,
    user_id: Option<Uuid>,
    device_id: String,
    
    // WebSocket connection
    ws_sender: Option<mpsc::UnboundedSender<Message>>,
    message_receiver: Option<mpsc::UnboundedReceiver<IncomingMessage>>,
    
    // Crypto state
    identity_key: Arc<RwLock<SigningKey>>,
    signed_pre_key: Arc<RwLock<SigningKey>>,
    one_time_keys: Arc<Mutex<Vec<SigningKey>>>,
    
    // Session management
    sessions: Arc<RwLock<HashMap<Uuid, DoubleRatchetSession>>>,
    
    // Callbacks
    message_handlers: Arc<Mutex<Vec<Box<dyn MessageHandler + Send + Sync>>>>,
    presence_handlers: Arc<Mutex<Vec<Box<dyn PresenceHandler + Send + Sync>>>>,
}

impl MessagingClient {
    pub fn new(base_url: &str, device_id: &str) -> Self {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");
        
        let ws_url = format!("ws://{}/ws", base_url.replace("http://", ""));
        
        Self {
            http_client,
            base_url: base_url.to_string(),
            ws_url,
            auth_token: None,
            user_id: None,
            device_id: device_id.to_string(),
            ws_sender: None,
            message_receiver: None,
            
            identity_key: Arc::new(RwLock::new(SigningKey::generate(&mut rand::thread_rng()))),
            signed_pre_key: Arc::new(RwLock::new(SigningKey::generate(&mut rand::thread_rng()))),
            one_time_keys: Arc::new(Mutex::new(Vec::new())),
            
            sessions: Arc::new(RwLock::new(HashMap::new())),
            
            message_handlers: Arc::new(Mutex::new(Vec::new())),
            presence_handlers: Arc::new(Mutex::new(Vec::new())),
        }
    }
    
    pub async fn register(
        &mut self,
        username: &str,
        email: &str,
        password: &str,
    ) -> Result<AuthResponse, SdkError> {
        // Generate encryption keys
        let identity_key = self.identity_key.read().await;
        let signed_pre_key = self.signed_pre_key.read().await;
        
        // Generate one-time keys
        let mut one_time_keys = Vec::new();
        for _ in 0..100 {
            one_time_keys.push(SigningKey::generate(&mut rand::thread_rng()));
        }
        *self.one_time_keys.lock().await = one_time_keys;
        
        let registration = RegistrationRequest {
            username: username.to_string(),
            email: email.to_string(),
            password: password.to_string(),
            public_key: base64::encode(identity_key.verifying_key().to_bytes()),
            dh_public_key: base64::encode([0u8; 32]), // Placeholder
            signed_pre_key: base64::encode(signed_pre_key.verifying_key().to_bytes()),
            one_time_keys: Vec::new(), // Would send first batch
        };
        
        let response = self.http_client
            .post(&format!("{}/register", self.base_url))
            .json(&registration)
            .send()
            .await
            .map_err(|e| SdkError::NetworkError(e.to_string()))?;
        
        if response.status() != StatusCode::OK {
            return Err(SdkError::AuthError(format!("Registration failed: {}", response.status())));
        }
        
        let auth_response: AuthResponse = response.json().await
            .map_err(|e| SdkError::SerializationError(e.to_string()))?;
        
        self.auth_token = Some(auth_response.access_token.clone());
        self.user_id = Some(auth_response.user.id);
        
        Ok(auth_response)
    }
    
    pub async fn login(
        &mut self,
        username: &str,
        password: &str,
        device_name: &str,
    ) -> Result<AuthResponse, SdkError> {
        let login_request = LoginRequest {
            username: username.to_string(),
            password: password.to_string(),
            device_id: self.device_id.clone(),
            device_name: device_name.to_string(),
        };
        
        let response = self.http_client
            .post(&format!("{}/login", self.base_url))
            .json(&login_request)
            .send()
            .await
            .map_err(|e| SdkError::NetworkError(e.to_string()))?;
        
        if response.status() != StatusCode::OK {
            return Err(SdkError::AuthError(format!("Login failed: {}", response.status())));
        }
        
        let auth_response: AuthResponse = response.json().await
            .map_err(|e| SdkError::SerializationError(e.to_string()))?;
        
        self.auth_token = Some(auth_response.access_token.clone());
        self.user_id = Some(auth_response.user.id);
        
        Ok(auth_response)
    }
    
    pub async fn connect_websocket(&mut self) -> Result<(), SdkError> {
        let token = self.auth_token.as_ref()
            .ok_or_else(|| SdkError::InvalidState("Not authenticated".to_string()))?;
        
        let url = format!("{}?token={}&device_id={}", self.ws_url, token, self.device_id);
        
        let (ws_stream, _) = connect_async(&url)
            .await
            .map_err(|e| SdkError::WebSocketError(e.to_string()))?;
        
        let (mut ws_sender, mut ws_receiver) = ws_stream.split();
        
        // Create channels for message passing
        let (tx, rx) = mpsc::unbounded_channel::<Message>();
        let (message_tx, message_rx) = mpsc::unbounded_channel::<IncomingMessage>();
        
        self.ws_sender = Some(tx);
        self.message_receiver = Some(message_rx);
        
        let user_id = self.user_id.unwrap();
        let device_id = self.device_id.clone();
        let message_handlers = self.message_handlers.clone();
        let presence_handlers = self.presence_handlers.clone();
        
        // Spawn WebSocket sender task
        let sender_tx = self.ws_sender.clone().unwrap();
        tokio::spawn(async move {
            while let Some(message) = rx.recv().await {
                if let Err(e) = ws_sender.send(message).await {
                    eprintln!("WebSocket send error: {}", e);
                    break;
                }
            }
        });
        
        // Spawn WebSocket receiver task
        tokio::spawn(async move {
            while let Some(message) = ws_receiver.next().await {
                match message {
                    Ok(Message::Text(text)) => {
                        if let Ok(ws_message) = serde_json::from_str::<WsMessage>(&text) {
                            match ws_message {
                                WsMessage::Message(msg) => {
                                    // Call message handlers
                                    let handlers = message_handlers.lock().await;
                                    for handler in handlers.iter() {
                                        handler.on_message(&msg).await;
                                    }
                                    
                                    // Forward to message channel
                                    let _ = message_tx.send(IncomingMessage::ChatMessage(msg));
                                }
                                WsMessage::Presence(presence) => {
                                    // Call presence handlers
                                    let handlers = presence_handlers.lock().await;
                                    for handler in handlers.iter() {
                                        handler.on_presence_update(&presence).await;
                                    }
                                }
                                WsMessage::Typing(typing) => {
                                    let _ = message_tx.send(IncomingMessage::TypingIndicator(typing));
                                }
                                _ => {}
                            }
                        }
                    }
                    Ok(Message::Close(_)) => {
                        break;
                    }
                    Err(e) => {
                        eprintln!("WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }
        });
        
        // Start heartbeat
        self.start_heartbeat();
        
        Ok(())
    }
    
    pub async fn send_message(
        &self,
        conversation_id: Uuid,
        content: &str,
        reply_to: Option<Uuid>,
    ) -> Result<Uuid, SdkError> {
        let user_id = self.user_id.ok_or_else(|| 
            SdkError::InvalidState("Not authenticated".to_string()))?;
        
        let message_id = Uuid::new_v4();
        let timestamp = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        
        // Encrypt message for each participant
        // For simplicity, we'll encrypt with a shared key
        let sessions = self.sessions.read().await;
        if let Some(session) = sessions.get(&conversation_id) {
            let (encrypted_content, nonce) = session.encrypt(content.as_bytes())
                .map_err(|e| SdkError::EncryptionError(e.to_string()))?;
            
            let message = ClientMessage {
                conversation_id,
                message_id,
                content: encrypted_content,
                nonce,
                reply_to,
                timestamp,
            };
            
            let ws_message = WsMessage::Message(message);
            let json = serde_json::to_string(&ws_message)
                .map_err(|e| SdkError::SerializationError(e.to_string()))?;
            
            let sender = self.ws_sender.as_ref()
                .ok_or_else(|| SdkError::InvalidState("WebSocket not connected".to_string()))?;
            
            sender.send(Message::Text(json))
                .map_err(|e| SdkError::WebSocketError(e.to_string()))?;
            
            Ok(message_id)
        } else {
            // Create new session
            Err(SdkError::InvalidState("No encryption session for conversation".to_string()))
        }
    }
    
    pub async fn update_presence(
        &self,
        status: &str,
        custom_status: Option<&str>,
    ) -> Result<(), SdkError> {
        let presence = PresenceUpdate {
            status: status.to_string(),
            custom_status: custom_status.map(|s| s.to_string()),
            last_active: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64,
        };
        
        let ws_message = WsMessage::Presence(presence);
        let json = serde_json::to_string(&ws_message)
            .map_err(|e| SdkError::SerializationError(e.to_string()))?;
        
        let sender = self.ws_sender.as_ref()
            .ok_or_else(|| SdkError::InvalidState("WebSocket not connected".to_string()))?;
        
        sender.send(Message::Text(json))
            .map_err(|e| SdkError::WebSocketError(e.to_string()))
    }
    
    pub async fn send_typing_indicator(
        &self,
        conversation_id: Uuid,
        is_typing: bool,
    ) -> Result<(), SdkError> {
        let typing = TypingIndicator {
            conversation_id,
            is_typing,
        };
        
        let ws_message = WsMessage::Typing(typing);
        let json = serde_json::to_string(&ws_message)
            .map_err(|e| SdkError::SerializationError(e.to_string()))?;
        
        let sender = self.ws_sender.as_ref()
            .ok_or_else(|| SdkError::InvalidState("WebSocket not connected".to_string()))?;
        
        sender.send(Message::Text(json))
            .map_err(|e| SdkError::WebSocketError(e.to_string()))
    }
    
    pub async fn create_group(
        &self,
        name: &str,
        user_ids: &[Uuid],
    ) -> Result<Uuid, SdkError> {
        let request = CreateGroupRequest {
            name: name.to_string(),
            user_ids: user_ids.to_vec(),
            is_encrypted: true,
        };
        
        let response = self.http_client
            .post(&format!("{}/groups", self.base_url))
            .bearer_auth(self.auth_token.as_ref().unwrap())
            .json(&request)
            .send()
            .await
            .map_err(|e| SdkError::NetworkError(e.to_string()))?;
        
        if response.status() != StatusCode::CREATED {
            return Err(SdkError::NetworkError(format!("Failed to create group: {}", response.status())));
        }
        
        let group: GroupResponse = response.json().await
            .map_err(|e| SdkError::SerializationError(e.to_string()))?;
        
        Ok(group.id)
    }
    
    pub fn add_message_handler<H: MessageHandler + Send + Sync + 'static>(
        &self,
        handler: H,
    ) -> tokio::sync::oneshot::Sender<()> {
        let (tx, rx) = tokio::sync::oneshot::channel();
        let handlers = self.message_handlers.clone();
        
        tokio::spawn(async move {
            handlers.lock().await.push(Box::new(handler));
            let _ = rx.await;
        });
        
        tx
    }
    
    pub fn add_presence_handler<H: PresenceHandler + Send + Sync + 'static>(
        &self,
        handler: H,
    ) -> tokio::sync::oneshot::Sender<()> {
        let (tx, rx) = tokio::sync::oneshot::channel();
        let handlers = self.presence_handlers.clone();
        
        tokio::spawn(async move {
            handlers.lock().await.push(Box::new(handler));
            let _ = rx.await;
        });
        
        tx
    }
    
    pub async fn receive_message(&mut self) -> Option<IncomingMessage> {
        if let Some(receiver) = &mut self.message_receiver {
            receiver.recv().await
        } else {
            None
        }
    }
    
    fn start_heartbeat(&self) {
        let sender = self.ws_sender.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(30));
            
            loop {
                interval.tick().await;
                
                if let Some(sender) = &sender {
                    let heartbeat = WsMessage::Heartbeat;
                    if let Ok(json) = serde_json::to_string(&heartbeat) {
                        let _ = sender.send(Message::Text(json));
                    }
                }
            }
        });
    }
}

#[async_trait]
pub trait MessageHandler {
    async fn on_message(&self, message: &ClientMessage);
}

#[async_trait]
pub trait PresenceHandler {
    async fn on_presence_update(&self, presence: &PresenceUpdate);
}

struct DoubleRatchetSession {
    root_key: [u8; 32],
    sending_chain_key: [u8; 32],
    receiving_chain_key: [u8; 32],
    sending_ratchet_key: StaticSecret,
    receiving_ratchet_key: PublicKey,
    message_number: u32,
}

impl DoubleRatchetSession {
    fn encrypt(&self, plaintext: &[u8]) -> Result<(Vec<u8>, Vec<u8>), chacha20poly1305::Error> {
        let key = ChaChaKey::from_slice(&self.sending_chain_key);
        let cipher = ChaCha20Poly1305::new(key);
        let nonce = ChaChaNonce::from_slice(&[0u8; 12]);
        
        cipher.encrypt(nonce, plaintext)
            .map(|ciphertext| (ciphertext, nonce.to_vec()))
    }
    
    fn decrypt(&self, ciphertext: &[u8], nonce: &[u8]) -> Result<Vec<u8>, chacha20poly1305::Error> {
        let key = ChaChaKey::from_slice(&self.receiving_chain_key);
        let cipher = ChaCha20Poly1305::new(key);
        let nonce = ChaChaNonce::from_slice(nonce);
        
        cipher.decrypt(&nonce, ciphertext)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WsMessage {
    Heartbeat,
    Message(ClientMessage),
    Presence(PresenceUpdate),
    Typing(TypingIndicator),
    ReadReceipt(ReadReceipt),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientMessage {
    pub conversation_id: Uuid,
    pub message_id: Uuid,
    pub content: Vec<u8>,
    pub nonce: Vec<u8>,
    pub reply_to: Option<Uuid>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenceUpdate {
    pub status: String,
    pub custom_status: Option<String>,
    pub last_active: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypingIndicator {
    pub conversation_id: Uuid,
    pub is_typing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadReceipt {
    pub message_id: Uuid,
    pub conversation_id: Uuid,
    pub read_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistrationRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub public_key: String,
    pub dh_public_key: String,
    pub signed_pre_key: String,
    pub one_time_keys: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
    pub device_id: String,
    pub device_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u64,
    pub user: UserResponse,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub public_key: String,
    pub dh_public_key: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGroupRequest {
    pub name: String,
    pub user_ids: Vec<Uuid>,
    pub is_encrypted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupResponse {
    pub id: Uuid,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug)]
pub enum IncomingMessage {
    ChatMessage(ClientMessage),
    TypingIndicator(TypingIndicator),
    PresenceUpdate(PresenceUpdate),
}

// Example usage
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = MessagingClient::new("http://localhost:3000", "device-123");
    
    // Login
    let auth = client.login("username", "password", "My Device").await?;
    println!("Logged in as: {}", auth.user.username);
    
    // Connect WebSocket
    client.connect_websocket().await?;
    println!("WebSocket connected");
    
    // Add message handler
    struct MyHandler;
    
    #[async_trait::async_trait]
    impl MessageHandler for MyHandler {
        async fn on_message(&self, message: &ClientMessage) {
            println!("Received message: {:?}", message);
        }
    }
    
    let _handler_tx = client.add_message_handler(MyHandler);
    
    // Update presence
    client.update_presence("online", Some("Available")).await?;
    
    // Send a message
    let conversation_id = Uuid::new_v4(); // Would be real conversation ID
    let message_id = client.send_message(conversation_id, "Hello, world!", None).await?;
    println!("Sent message: {}", message_id);
    
    // Keep running
    tokio::signal::ctrl_c().await?;
    
    Ok(())
}
