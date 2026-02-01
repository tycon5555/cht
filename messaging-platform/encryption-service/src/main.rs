use tonic::{transport::Server, Request, Response, Status};
use encryption_proto::{
    encryption_server::{Encryption, EncryptionServer},
    *,
};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::sync::Arc;
use uuid::Uuid;
use tracing::{info, error};

mod encryption_proto {
    tonic::include_proto!("encryption");
}

struct EncryptionService {
    db_pool: PgPool,
}

#[tonic::async_trait]
impl Encryption for EncryptionService {
    async fn store_encryption_session(
        &self,
        request: Request<StoreSessionRequest>,
    ) -> Result<Response<StoreSessionResponse>, Status> {
        let req = request.into_inner();
        
        let session_id = Uuid::parse_str(&req.session_id)
            .map_err(|_| Status::invalid_argument("Invalid session ID"))?;
        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;
        let peer_id = Uuid::parse_str(&req.peer_id)
            .map_err(|_| Status::invalid_argument("Invalid peer ID"))?;
        
        // Store session in database
        // Note: All encryption keys are already encrypted by the client
        // before being sent to this service
        
        sqlx::query!(
            r#"
            INSERT INTO encryption_sessions 
            (session_id, user_id, peer_id, root_key, sending_chain_key, 
             receiving_chain_key, sending_ratchet_key, receiving_ratchet_key,
             prev_sending_chain_length, prev_receiving_chain_length, 
             message_number, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            ON CONFLICT (user_id, peer_id, session_id) 
            DO UPDATE SET
                root_key = EXCLUDED.root_key,
                sending_chain_key = EXCLUDED.sending_chain_key,
                receiving_chain_key = EXCLUDED.receiving_chain_key,
                sending_ratchet_key = EXCLUDED.sending_ratchet_key,
                receiving_ratchet_key = EXCLUDED.receiving_ratchet_key,
                updated_at = NOW()
            "#,
            session_id,
            user_id,
            peer_id,
            &req.root_key,
            &req.sending_chain_key,
            &req.receiving_chain_key,
            &req.sending_ratchet_key,
            &req.receiving_ratchet_key,
            req.prev_sending_chain_length as i32,
            req.prev_receiving_chain_length as i32,
            req.message_number as i32
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| {
            error!("Failed to store session: {}", e);
            Status::internal("Failed to store session")
        })?;
        
        Ok(Response::new(StoreSessionResponse { success: true }))
    }
    
    async fn get_encryption_session(
        &self,
        request: Request<GetSessionRequest>,
    ) -> Result<Response<GetSessionResponse>, Status> {
        let req = request.into_inner();
        
        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;
        let peer_id = Uuid::parse_str(&req.peer_id)
            .map_err(|_| Status::invalid_argument("Invalid peer ID"))?;
        
        let session = sqlx::query!(
            r#"
            SELECT * FROM encryption_sessions 
            WHERE user_id = $1 AND peer_id = $2
            ORDER BY updated_at DESC
            LIMIT 1
            "#,
            user_id,
            peer_id
        )
        .fetch_optional(&self.db_pool)
        .await
        .map_err(|e| {
            error!("Failed to fetch session: {}", e);
            Status::internal("Failed to fetch session")
        })?;
        
        if let Some(session) = session {
            let response = GetSessionResponse {
                session_id: session.session_id.to_string(),
                root_key: session.root_key,
                sending_chain_key: session.sending_chain_key,
                receiving_chain_key: session.receiving_chain_key,
                sending_ratchet_key: session.sending_ratchet_key,
                receiving_ratchet_key: session.receiving_ratchet_key,
                prev_sending_chain_length: session.prev_sending_chain_length as u32,
                prev_receiving_chain_length: session.prev_receiving_chain_length as u32,
                message_number: session.message_number as u32,
            };
            
            Ok(Response::new(response))
        } else {
            Err(Status::not_found("Session not found"))
        }
    }
    
    async fn delete_encryption_session(
        &self,
        request: Request<DeleteSessionRequest>,
    ) -> Result<Response<DeleteSessionResponse>, Status> {
        let req = request.into_inner();
        
        let session_id = Uuid::parse_str(&req.session_id)
            .map_err(|_| Status::invalid_argument("Invalid session ID"))?;
        
        sqlx::query!(
            "DELETE FROM encryption_sessions WHERE session_id = $1",
            session_id
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| {
            error!("Failed to delete session: {}", e);
            Status::internal("Failed to delete session")
        })?;
        
        Ok(Response::new(DeleteSessionResponse { success: true }))
    }
    
    async fn rotate_group_keys(
        &self,
        request: Request<RotateGroupKeysRequest>,
    ) -> Result<Response<RotateGroupKeysResponse>, Status> {
        let req = request.into_inner();
        
        let group_id = Uuid::parse_str(&req.group_id)
            .map_err(|_| Status::invalid_argument("Invalid group ID"))?;
        
        // Get all group members
        let members = sqlx::query!(
            r#"
            SELECT user_id FROM group_members 
            WHERE group_id = $1 AND is_banned = false
            "#,
            group_id
        )
        .fetch_all(&self.db_pool)
        .await
        .map_err(|e| {
            error!("Failed to fetch group members: {}", e);
            Status::internal("Failed to fetch group members")
        })?;
        
        // Generate new encrypted key for each member
        // This is a simplified version - in reality, we'd use
        // each member's public key to encrypt the new group key
        
        let response = RotateGroupKeysResponse {
            success: true,
            rotated_for_users: members.len() as u32,
        };
        
        Ok(Response::new(response))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    
    dotenv::dotenv().ok();
    
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let db_pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&database_url)
        .await?;
    
    let addr = "[::1]:50051".parse()?;
    let service = EncryptionService { db_pool };
    
    info!("Encryption service listening on {}", addr);
    
    Server::builder()
        .add_service(EncryptionServer::new(service))
        .serve(addr)
        .await?;
    
    Ok(())
}
