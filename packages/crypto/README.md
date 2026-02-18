# @useobo/crypto

Cryptographic utilities for OBO. Provides AES-256-GCM encryption, JWT signing/verification with key rotation support, and optional GCP Cloud KMS integration.

## Installation

```bash
npm install @useobo/crypto
# or
pnpm add @useobo/crypto
```

## Features

- **AES-256-GCM Encryption**: Authenticated encryption for sensitive data at rest
- **JWT Signing & Verification**: Create and verify JWT tokens with HS256
- **Key Rotation**: Support for multiple signing keys with seamless rotation
- **JWT Revocation**: In-memory token blocklist for immediate invalidation
- **GCP Cloud KMS**: Optional hardware-grade key management for enterprise deployments

## Usage

### Encryption

```typescript
import { encrypt, decrypt, isEncrypted } from '@useobo/crypto';

// Encrypt sensitive data
const encrypted = encrypt('my-secret-token');
// Returns: "enc:v1:base64iv:base64ciphertext:base64tag"

// Check if data is encrypted
if (isEncrypted(encrypted)) {
  const decrypted = decrypt(encrypted);
  console.log(decrypted); // "my-secret-token"
}
```

### JWT Operations

```typescript
import { signJWT, verifyJWT, getKeyInfo } from '@useobo/crypto';

// Sign a JWT
const token = await signJWT({
  principal: 'user@example.com',
  scopes: ['repo:read', 'repo:write'],
  slipId: 'slip_abc123',
}, 3600); // expires in 1 hour

// Verify a JWT
const payload = await verifyJWT(token);
console.log(payload.principal); // "user@example.com"

// Get key information
const keys = getKeyInfo();
console.log(keys);
// { primary: { id: '1', createdAt: ... }, secondary: [...] }
```

### JWT Revocation

```typescript
import { revokeToken, isTokenRevoked, cleanupExpiredRevocations } from '@useobo/crypto';

// Revoke a token by JTI
revokeToken('slip_abc123', 'User requested revocation');

// Check if revoked
if (isTokenRevoked('slip_abc123')) {
  console.log('Token has been revoked');
}

// Cleanup old revocations (run periodically)
cleanupExpiredRevocations(7 * 24 * 60 * 60 * 1000); // 7 days
```

### GCP Cloud KMS (Optional)

```typescript
import {
  encryptWithKms,
  decryptWithKms,
  hasKmsConfigured
} from '@useobo/crypto';

// Check if KMS is configured
if (hasKmsConfigured()) {
  // Encrypt using GCP KMS
  const ciphertext = await encryptWithKms('sensitive-data');

  // Decrypt using GCP KMS
  const plaintext = await decryptWithKms(ciphertext);
}
```

## Environment Variables

```bash
# Encryption key (32 bytes base64-encoded)
OBO_ENCRYPTION_KEY=your-32-byte-base64-key

# JWT signing secrets (for key rotation)
OBO_JWT_SECRET_1=primary-secret
OBO_JWT_SECRET_2=secondary-secret

# GCP KMS (optional)
OBO_KMS_PROJECT_ID=my-project
OBO_KMS_LOCATION_ID=global
OBO_KMS_KEY_RING_ID=obo-keys
OBO_KMS_KEY_ID=obo-encryption-key
```

## License

MIT
