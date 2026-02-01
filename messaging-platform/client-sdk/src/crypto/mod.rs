use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce
};
use chacha20poly1305::{ChaCha20Poly1305, Key as ChaChaKey, Nonce as ChaChaNonce};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use rand::rngs::OsRng;
use x25519_dalek::{PublicKey, StaticSecret};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
    
    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),
    
    #[error("Invalid key: {0}")]
    InvalidKey(String),
    
    #[error("Invalid signature: {0}")]
    InvalidSignature(String),
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
    
    pub fn encrypt(&mut self, plaintext: &[u8]) -> Result<(Vec<u8>, [u8; 12]), CryptoError> {
        // Derive message key from chain key
        let message_key = self.derive_message_key(&self.sending_chain_key);
        
        // Encrypt with ChaCha20-Poly1305
        let cipher = ChaCha20Poly1305::new(ChaChaKey::from_slice(&message_key));
        let nonce = self.generate_nonce();
        
        cipher.encrypt(&ChaChaNonce::from_slice(&nonce), plaintext)
            .map(|ciphertext| (ciphertext, nonce))
            .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))
    }
    
    pub fn decrypt(&mut self, ciphertext: &[u8], nonce: &[u8; 12]) -> Result<Vec<u8>, CryptoError> {
        let message_key = self.derive_message_key(&self.receiving_chain_key);
        
        let cipher = ChaCha20Poly1305::new(ChaChaKey::from_slice(&message_key));
        
        cipher.decrypt(&ChaChaNonce::from_slice(nonce), ciphertext)
            .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))
    }
    
    pub fn perform_ratchet_step(&mut self, new_receiving_key: PublicKey) -> Result<(), CryptoError> {
        // Calculate DH secret
        let dh_secret = self.sending_ratchet_key.diffie_hellman(&new_receiving_key);
        
        // KDF to get new root key and chain key
        let mut kdf_input = Vec::new();
        kdf_input.extend_from_slice(&self.root_key);
        kdf_input.extend_from_slice(dh_secret.as_bytes());
        
        let mut kdf_output = [0u8; 64];
        hkdf::Hkdf::<sha2::Sha256>::new(None, &kdf_input)
            .expand(b"double_ratchet", &mut kdf_output)
            .map_err(|e| CryptoError::KeyGenerationFailed(e.to_string()))?;
        
        // Update keys
        self.root_key.copy_from_slice(&kdf_output[..32]);
        self.sending_chain_key.copy_from_slice(&kdf_output[32..]);
        
        // Generate new sending ratchet key
        let new_sending_secret = StaticSecret::random_from_rng(OsRng);
        let new_sending_public = PublicKey::from(&new_sending_secret);
        
        // Update receiving key
        self.receiving_ratchet_key = new_receiving_key;
        self.sending_ratchet_key = new_sending_secret;
        
        // Reset counters
        self.message_number = 0;
        self.prev_sending_chain_length += 1;
        
        Ok(())
    }
    
    fn derive_message_key(&self, chain_key: &[u8; 32]) -> [u8; 32] {
        let mut output = [0u8; 32];
        hkdf::Hkdf::<sha2::Sha256>::new(None, chain_key)
            .expand(b"message_key", &mut output)
            .expect("HKDF expansion failed");
        output
    }
    
    fn generate_nonce(&self) -> [u8; 12] {
        use rand::RngCore;
        let mut nonce = [0u8; 12];
        rand::thread_rng().fill_bytes(&mut nonce);
        nonce
    }
}

pub struct X3DH {
    identity_key: SigningKey,
    signed_pre_key: SigningKey,
    one_time_keys: Vec<SigningKey>,
}

impl X3DH {
    pub fn new() -> Self {
        let mut rng = OsRng;
        
        Self {
            identity_key: SigningKey::generate(&mut rng),
            signed_pre_key: SigningKey::generate(&mut rng),
            one_time_keys: Vec::new(),
        }
    }
    
    pub fn generate_one_time_keys(&mut self, count: usize) {
        let mut rng = OsRng;
        
        for _ in 0..count {
            self.one_time_keys.push(SigningKey::generate(&mut rng));
        }
    }
    
    pub fn perform_key_exchange(
        &self,
        remote_identity_key: &VerifyingKey,
        remote_signed_pre_key: &VerifyingKey,
        remote_one_time_key: Option<&VerifyingKey>,
    ) -> Result<[u8; 32], CryptoError> {
        // Convert to X25519 keys
        let identity_secret = self.identity_key.to_scalar_bytes();
        let signed_pre_secret = self.signed_pre_key.to_scalar_bytes();
        
        // Calculate DH1 = DH(IKA, SPKB)
        let dh1 = self.dh_calculation(&identity_secret, remote_signed_pre_key.as_bytes());
        
        // Calculate DH2 = DH(EKA, IKB)
        let dh2 = self.dh_calculation(&signed_pre_secret, remote_identity_key.as_bytes());
        
        // Calculate DH3 = DH(EKA, SPKB)
        let dh3 = self.dh_calculation(&signed_pre_secret, remote_signed_pre_key.as_bytes());
        
        let mut final_key = Vec::new();
        final_key.extend_from_slice(&dh1);
        final_key.extend_from_slice(&dh2);
        final_key.extend_from_slice(&dh3);
        
        // Add DH4 if one-time key is provided
        if let Some(one_time_key) = remote_one_time_key {
            if let Some(local_one_time_key) = self.one_time_keys.first() {
                let dh4 = self.dh_calculation(
                    &local_one_time_key.to_scalar_bytes(),
                    one_time_key.as_bytes(),
                );
                final_key.extend_from_slice(&dh4);
            }
        }
        
        // KDF to get final shared secret
        let mut output = [0u8; 32];
        hkdf::Hkdf::<sha2::Sha256>::new(None, &final_key)
            .expand(b"x3dh", &mut output)
            .map_err(|e| CryptoError::KeyGenerationFailed(e.to_string()))?;
        
        Ok(output)
    }
    
    fn dh_calculation(&self, local_secret: &[u8], remote_public: &[u8]) -> [u8; 32] {
        // Simplified DH calculation
        // In production, use proper X25519
        let mut result = [0u8; 32];
        for i in 0..32 {
            result[i] = local_secret[i] ^ remote_public[i];
        }
        result
    }
}

pub fn encrypt_aes_gcm(key: &[u8; 32], plaintext: &[u8]) -> Result<(Vec<u8>, [u8; 12]), CryptoError> {
    let cipher = Aes256Gcm::new(key.into());
    let mut nonce = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce);
    
    cipher.encrypt(&Nonce::from_slice(&nonce), plaintext)
        .map(|ciphertext| (ciphertext, nonce))
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))
}

pub fn decrypt_aes_gcm(key: &[u8; 32], ciphertext: &[u8], nonce: &[u8; 12]) -> Result<Vec<u8>, CryptoError> {
    let cipher = Aes256Gcm::new(key.into());
    
    cipher.decrypt(&Nonce::from_slice(nonce), ciphertext)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))
}
