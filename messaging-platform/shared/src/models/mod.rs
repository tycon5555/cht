use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct User {
    pub id: Uuid,
    #[validate(length(min = 3, max = 32))]
    pub username: String,
    pub email: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
    pub is_verified: bool,
    pub last_seen: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    Text,
    Image,
    Video,
    File,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub message_type: MessageType,
    pub content: Vec<u8>, // Encrypted on client
    pub nonce: Vec<u8>,   // AES-GCM nonce
    pub timestamp: DateTime<Utc>,
    pub reply_to: Option<Uuid>,
    pub edited: bool,
    pub deleted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: Uuid,
    pub conversation_type: ConversationType,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_message_at: Option<DateTime<Utc>>,
    pub is_encrypted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConversationType {
    DirectMessage,
    Group,
    Channel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupMember {
    pub user_id: Uuid,
    pub group_id: Uuid,
    pub role: GroupRole,
    pub joined_at: DateTime<Utc>,
    pub permissions: Vec<Permission>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GroupRole {
    Owner,
    Admin,
    Member,
    Guest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Permission {
    SendMessages,
    DeleteMessages,
    AddMembers,
    RemoveMembers,
    ChangeGroupInfo,
    PinMessages,
    MentionEveryone,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionSession {
    pub session_id: Uuid,
    pub user_id: Uuid,
    pub peer_id: Uuid,
    pub root_key: Vec<u8>,
    pub sending_chain_key: Vec<u8>,
    pub receiving_chain_key: Vec<u8>,
    pub sending_ratchet_key: Vec<u8>,
    pub receiving_ratchet_key: Vec<u8>,
    pub prev_sending_chain_length: u32,
    pub prev_receiving_chain_length: u32,
    pub message_number: u32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct Report {
    pub id: Uuid,
    pub reporter_id: Uuid,
    pub target_id: Uuid,
    pub target_type: ReportTargetType,
    pub reason: ReportReason,
    pub description: Option<String>,
    pub status: ReportStatus,
    pub created_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub resolved_by: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportTargetType {
    User,
    Message,
    Group,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportReason {
    Spam,
    Harassment,
    HateSpeech,
    Nudity,
    Violence,
    Impersonation,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportStatus {
    Pending,
    Investigating,
    Resolved,
    Dismissed,
}
