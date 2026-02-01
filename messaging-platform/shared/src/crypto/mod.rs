use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce
};
use chacha20poly1305::{ChaCha20Poly1305, Key as ChaChaKey, Nonce as ChaChaNonce};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use x25519_dalek::{PublicKey, StaticSecret};
use rand::rngs::OsRng;
use thiserror::Error;
use base64::{Engine as _, engine::general_purpose};

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Encryption failed")]
    EncryptionError,
    #[error("Decryption failed")]
    DecryptionError,
    #[error("Invalid key")]
    InvalidKey,
    #[error("Invalid signature")]
    InvalidSignature,
    #[error("Key generation failed")]
    KeyGenerationError,
}

pub struct KeyPair {
    pub signing_key: SigningKey,
    pub verifying_key: VerifyingKey,
    pub diffie_hellman_secret: StaticSecret,
    pub diffie_hellman_public: PublicKey,
}

impl KeyPair {
    pub fn generate() -> Result<Self, CryptoError> {
        let mut csprng = OsRng;
        
        let signing_key = SigningKey::generate(&mut csprng);
        let verifying_key = signing_key.verifying_key();
        
        let diffie_hellman_secret = StaticSecret::random_from_rng(OsRng);
        let diffie_hellman_public = PublicKey::from(&diffie_hellman_secret);
        
        Ok(Self {
            signing_key,
            verifying_key,
            diffie_hellman_secret,
            diffie_hellman_public,
        })
    }
    
    pub fn sign(&self, message: &[u8]) -> Signature {
        self.signing_key.sign(message)
    }
    
    pub fn verify(&self, message: &[u8], signature: &Signature) -> Result<(), CryptoError> {
        self.verifying_key
            .verify(message, signature)
            .map_err(|_| CryptoError::InvalidSignature)
    }
}

pub struct DoubleRatchet {
    root_key: [u8; 32],
    sending_chain_key: [u8; 32],
    receiving_chain_key: [u8; 32],
    sending_ratchet_key: StaticSecret,
    receiving_ratchet_key: PublicKey,
    message_number: u32,
    prev_sending_chain_length: u32,
    prev_receiving_chain_length: u32,
}

impl DoubleRatchet {
    pub fn new(
        root_key: [u8; 32],
        sending_chain_key: [u8; 32],
        receiving_chain_key: [u8; 32],
        sending_ratchet_key: StaticSecret,
        receiving_ratchet_key: PublicKey,
    ) -> Self {
        Self {
            root_key,
            sending_chain_key,
            receiving_chain_key,
            sending_ratchet_key,
            receiving_ratchet_key,
            message_number: 0,
            prev_sending_chain_length: 0,
            prev_receiving_chain_length: 0,
        }
    }
    
    pub fn encrypt_message(&mut self, plaintext: &[u8]) -> Result<(Vec<u8>, [u8; 24]), CryptoError> {
        // Derive message key
        let message_key = self.derive_message_key(&self.sending_chain_key);
        
        // Encrypt with ChaCha20-Poly1305
        let cipher = ChaCha20Poly1305::new(ChaChaKey::from_slice(&message_key));
        let nonce = ChaChaNonce::from_slice(&[0u8; 12]); // In production, use random nonce
        
        cipher
            .encrypt(&nonce, plaintext)
            .map_err(|_| CryptoError::EncryptionError)
            .map(|ciphertext| (ciphertext, [0u8; 24]))
    }
    
    pub fn decrypt_message(&mut self, ciphertext: &[u8], nonce: &[u8; 24]) -> Result<Vec<u8>, CryptoError> {
        let message_key = self.derive_message_key(&self.receiving_chain_key);
        
        let cipher = ChaCha20Poly1305::new(ChaChaKey::from_slice(&message_key));
        let nonce = ChaChaNonce::from_slice(&nonce[..12]);
        
        cipher
            .decrypt(&nonce, ciphertext)
            .map_err(|_| CryptoError::DecryptionError)
    }
    
    fn derive_message_key(&self, chain_key: &[u8; 32]) -> [u8; 32] {
        // HKDF-based key derivation
        let mut output = [0u8; 32];
        hkdf::Hkdf::<sha2::Sha256>::new(None, chain_key)
            .expand(b"message_key", &mut output)
            .expect("HKDF expansion failed");
        output
    }
    
    pub fn perform_ratchet_step(&mut self) {
        // Generate new DH key pair
        let new_secret = StaticSecret::random_from_rng(OsRng);
        let new_public = PublicKey::from(&new_secret);
        
        // Calculate new root key and chain key
        let dh_secret = self.sending_ratchet_key.diffie_hellman(&self.receiving_ratchet_key);
        let mut kdf_input = Vec::new();
        kdf_input.extend_from_slice(&self.root_key);
        kdf_input.extend_from_slice(dh_secret.as_bytes());
        
        let mut kdf_output = [0u8; 64];
        hkdf::Hkdf::<sha2::Sha256>::new(None, &kdf_input)
            .expand(b"double_ratchet", &mut kdf_output)
            .expect("HKDF expansion failed");
        
        self.root_key.copy_from_slice(&kdf_output[..32]);
        self.sending_chain_key.copy_from_slice(&kdf_output[32..]);
        
        // Update keys
        self.sending_ratchet_key = new_secret;
        self.message_number = 0;
        self.prev_sending_chain_length += 1;
    }
}

pub fn encrypt_aes_gcm(key: &[u8; 32], plaintext: &[u8]) -> Result<(Vec<u8>, [u8; 12]), CryptoError> {
    let cipher = Aes256Gcm::new(key.into());
    let nonce = Nonce::from_slice(&[0u8; 12]); // In production, use random nonce
    
    cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| CryptoError::EncryptionError)
        .map(|ciphertext| (ciphertext, [0u8; 12]))
}

pub fn decrypt_aes_gcm(key: &[u8; 32], ciphertext: &[u8], nonce: &[u8; 12]) -> Result<Vec<u8>, CryptoError> {
    let cipher = Aes256Gcm::new(key.into());
    let nonce = Nonce::from_slice(nonce);
    
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| CryptoError::DecryptionError)
}

pub fn generate_shared_secret(local_secret: &StaticSecret, remote_public: &PublicKey) -> [u8; 32] {
    local_secret.diffie_hellman(remote_public).to_bytes()
}
