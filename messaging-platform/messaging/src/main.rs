use chrono::{DateTime, Utc};
use rdkafka::consumer::{Consumer, StreamConsumer};
use scylla::{IntoTypedRows, Session, SessionBuilder};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};
use uuid::Uuid;

use shared::models::{Message, Conversation, GroupMember};

#[derive(Debug, Serialize, Deserialize)]
struct ProcessedMessage {
    message_id: Uuid,
    conversation_id: Uuid,
    sender_id: Uuid,
    content: Vec<u8>,
    nonce: Vec<u8>,
    reply_to: Option<Uuid>,
    timestamp: i64,
    delivered_to: Vec<Uuid>,
    read_by: Vec<Uuid>,
}

struct MessageProcessor {
    scylla_session: Arc<Session>,
    kafka_consumer: StreamConsumer,
    pg_pool: sqlx::PgPool,
}

impl MessageProcessor {
    async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let scylla_nodes = std::env::var("SCYLLA_NODES")
            .unwrap_or_else(|_| "127.0.0.1:9042".to_string());
        
        let session: Session = SessionBuilder::new()
            .known_node(&scylla_nodes)
            .build()
            .await?;
        
        let kafka_brokers = std::env::var("KAFKA_BROKERS")
            .unwrap_or_else(|_| "localhost:9092".to_string());
        
        let consumer: StreamConsumer = rdkafka::config::ClientConfig::new()
            .set("group.id", "message-processor")
            .set("bootstrap.servers", &kafka_brokers)
            .set("enable.partition.eof", "false")
            .set("session.timeout.ms", "6000")
            .set("enable.auto.commit", "true")
            .create()?;
        
        let database_url = std::env::var("DATABASE_URL")
            .expect("DATABASE_URL must be set");
        
        let pg_pool = sqlx::PgPool::connect(&database_url).await?;
        
        Ok(Self {
            scylla_session: Arc::new(session),
            kafka_consumer,
            pg_pool,
        })
    }
    
    async fn process_messages(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.kafka_consumer.subscribe(&["messages"])?;
        
        info!("Message processor started");
        
        while let Some(message) = self.kafka_consumer.recv().await {
            if let Some(payload) = message.payload() {
                if let Ok(envelope) = serde_json::from_slice::<MessageEnvelope>(payload) {
                    self.process_message(envelope).await?;
                }
            }
        }
        
        Ok(())
    }
    
    async fn process_message(&self, envelope: MessageEnvelope) -> Result<(), Box<dyn std::error::Error>> {
        // Validate conversation exists and user is member
        let is_member = sqlx::query!(
            r#"
            SELECT 1 FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND is_banned = false
            "#,
            envelope.conversation_id,
            envelope.sender_id
        )
        .fetch_optional(&self.pg_pool)
        .await?;
        
        if is_member.is_none() {
            warn!("User {} is not a member of conversation {}", 
                  envelope.sender_id, envelope.conversation_id);
            return Ok(());
        }
        
        // Calculate time bucket (e.g., day-based)
        let timestamp = DateTime::from_timestamp(envelope.timestamp, 0)
            .unwrap_or_else(Utc::now);
        let bucket_id = (timestamp.date().num_days_from_ce() / 1) as i32; // Daily bucket
        
        // Store message in ScyllaDB
        let message_id = envelope.message_id.as_u128() as i64;
        
        let query = r#"
        INSERT INTO messaging.messages 
        (conversation_id, bucket_id, message_id, sender_id, 
         message_type, content, nonce, reply_to, timestamp, 
         edited, deleted, encryption_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, false, false, 1)
        "#;
        
        self.scylla_session
            .query(query, (
                envelope.conversation_id,
                bucket_id,
                message_id,
                envelope.sender_id,
                "text", // message_type
                envelope.content,
                envelope.nonce,
                envelope.reply_to.map(|id| id.as_u128() as i64),
                timestamp,
            ))
            .await?;
        
        // Update conversation last message timestamp
        sqlx::query!(
            r#"
            UPDATE conversations 
            SET last_message_at = $1 
            WHERE id = $2
            "#,
            timestamp,
            envelope.conversation_id
        )
        .execute(&self.pg_pool)
        .await?;
        
        // Update user_conversations for all participants
        let participants = self.get_conversation_participants(envelope.conversation_id).await?;
        
        for participant_id in participants {
            if participant_id != envelope.sender_id {
                // Update unread count
                let update_query = r#"
                UPDATE messaging.user_conversations 
                SET unread_count = unread_count + 1,
                    last_message_id = ?,
                    last_message_at = ?
                WHERE user_id = ? AND conversation_id = ?
                "#;
                
                self.scylla_session
                    .query(update_query, (
                        participant_id,
                        envelope.conversation_id,
                        message_id,
                        timestamp,
                    ))
                    .await?;
            }
        }
        
        // Create delivery status records
        self.create_delivery_status(
            envelope.message_id,
            envelope.conversation_id,
            &participants,
            envelope.sender_id,
        ).await?;
        
        // Publish processed message for WebSocket distribution
        let processed_msg = ProcessedMessage {
            message_id: envelope.message_id,
            conversation_id: envelope.conversation_id,
            sender_id: envelope.sender_id,
            content: envelope.content,
            nonce: envelope.nonce,
            reply_to: envelope.reply_to,
            timestamp: envelope.timestamp,
            delivered_to: vec![envelope.sender_id], // Sender sees it as delivered immediately
            read_by: vec![],
        };
        
        self.publish_processed_message(processed_msg).await?;
        
        info!("Processed message {} from user {}", 
              envelope.message_id, envelope.sender_id);
        
        Ok(())
    }
    
    async fn get_conversation_participants(&self, conversation_id: Uuid) -> Result<Vec<Uuid>, Box<dyn std::error::Error>> {
        let members = sqlx::query!(
            r#"
            SELECT user_id FROM group_members 
            WHERE group_id = $1 AND is_banned = false
            "#,
            conversation_id
        )
        .fetch_all(&self.pg_pool)
        .await?;
        
        Ok(members.into_iter().map(|r| r.user_id).collect())
    }
    
    async fn create_delivery_status(
        &self,
        message_id: Uuid,
        conversation_id: Uuid,
        participants: &[Uuid],
        sender_id: Uuid,
    ) -> Result<(), Box<dyn std::error::Error>> {
        for &user_id in participants {
            let delivered = user_id == sender_id; // Sender sees it as delivered immediately
            
            let query = r#"
            INSERT INTO messaging.delivery_status 
            (message_id, conversation_id, user_id, delivered, read, delivered_at)
            VALUES (?, ?, ?, ?, false, ?)
            "#;
            
            self.scylla_session
                .query(query, (
                    message_id.as_u128() as i64,
                    conversation_id,
                    user_id,
                    delivered,
                    if delivered { Some(Utc::now()) } else { None },
                ))
                .await?;
        }
        
        Ok(())
    }
    
    async fn publish_processed_message(&self, msg: ProcessedMessage) -> Result<(), Box<dyn std::error::Error>> {
        use rdkafka::producer::FutureProducer;
        
        let producer: FutureProducer = rdkafka::config::ClientConfig::new()
            .set("bootstrap.servers", "localhost:9092")
            .set("message.timeout.ms", "5000")
            .create()?;
        
        let payload = serde_json::to_vec(&msg)?;
        
        let record = rdkafka::producer::FutureRecord::to("processed-messages")
            .key(&msg.conversation_id.to_string())
            .payload(&payload);
        
        producer.send(record, std::time::Duration::from_secs(5)).await?;
        
        Ok(())
    }
    
    async fn handle_read_receipt(&self, user_id: Uuid, message_id: Uuid) -> Result<(), Box<dyn std::error::Error>> {
        let query = r#"
        UPDATE messaging.delivery_status 
        SET read = true, read_at = ?
        WHERE message_id = ? AND user_id = ?
        "#;
        
        self.scylla_session
            .query(query, (
                Utc::now(),
                message_id.as_u128() as i64,
                user_id,
            ))
            .await?;
        
        // Publish read receipt update
        let receipt_update = ReadReceiptUpdate {
            user_id,
            message_id,
            read_at: Utc::now().timestamp(),
        };
        
        let producer: rdkafka::producer::FutureProducer = rdkafka::config::ClientConfig::new()
            .set("bootstrap.servers", "localhost:9092")
            .create()?;
        
        let payload = serde_json::to_vec(&receipt_update)?;
        
        let record = rdkafka::producer::FutureRecord::to("read-receipts")
            .key(&user_id.to_string())
            .payload(&payload);
        
        producer.send(record, std::time::Duration::from_secs(5)).await?;
        
        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct MessageEnvelope {
    sender_id: Uuid,
    conversation_id: Uuid,
    message_id: Uuid,
    content: Vec<u8>,
    nonce: Vec<u8>,
    reply_to: Option<Uuid>,
    timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
struct ReadReceiptUpdate {
    user_id: Uuid,
    message_id: Uuid,
    read_at: i64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    
    dotenv::dotenv().ok();
    
    let processor = MessageProcessor::new().await?;
    processor.process_messages().await?;
    
    Ok(())
}
