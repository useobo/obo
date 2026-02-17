# @obo/crypto

Cryptographic utilities for secure token storage in OBO.

## Security Features

### Encryption at Rest

Tokens (API keys, OAuth tokens, JWTs) are encrypted using AES-256-GCM before being stored in PostgreSQL.

**Configuration:**
```bash
# Set a strong encryption key (REQUIRED for production)
export OBO_ENCRYPTION_KEY="your-secure-key-here"

# Enable/disable encryption (default: true)
export OBO_ENCRYPT_AT_REST="true"
```

**How it works:**
- Uses AES-256-GCM (authenticated encryption)
- Key derived from `OBO_ENCRYPTION_KEY` using scrypt with salt
- Format: `iv:authTag:encrypted` (all base64-encoded)
- Each token gets a unique IV (initialization vector)

### One-Time Token Delivery (Optional)

Store only a cryptographic hash of the token, making it non-retrievable after initial delivery.

**Configuration:**
```bash
# Enable one-time delivery (default: false)
export OBO_ONE_TIME_DELIVERY="true"
```

**How it works:**
- Token is hashed using SHA-256 before storage
- Hash cannot be reversed to recover the token
- Token is only returned once to the requesting agent
- Subsequent retrieval attempts fail

## API

```typescript
import { encrypt, decrypt, isEncrypted, getDefaultStorageConfig } from "@obo/crypto";

// Encrypt a secret
const encrypted = encrypt("my-secret-token");
// => "42G1oy6RwA0Nkype1wNmXA==:b8sWOqWBaPI1e1BCTEFdgQ==:u6BIX1ViJ55h..."

// Decrypt a secret
const decrypted = decrypt(encrypted);
// => "my-secret-token"

// Check if a value is encrypted
if (isEncrypted(value)) {
  const secret = decrypt(value);
}

// Get current configuration
const config = getDefaultStorageConfig();
// { encryptAtRest: true, oneTimeDelivery: false }
```

## Security Considerations

### JWT Tokens

Our OBO provider generates JWTs signed with HS256 (HMAC-SHA256). This uses `OBO_JWT_SECRET` for signing.

**Recommendations for production:**
1. Rotate `OBO_JWT_SECRET` periodically
2. Use a proper key management service (KMS, AWS Secrets Manager, etc.)
3. Implement JWT revocation list for immediate token invalidation

### Encryption Keys

**Development:** The default key is `"dev-key-change-me-in-production"`

**Production:** MUST set `OBO_ENCRYPTION_KEY` to a strong, random value (at least 32 bytes):

```bash
# Generate a secure key
openssl rand -base64 32
```

### Database Security

Even with encryption:
- Enable PostgreSQL SSL/TLS for connections
- Use database credentials with least privilege
- Enable row-level security for multi-tenant deployments
- Consider transparent data encryption (TDE) at rest

## Audit Trail

All token operations are logged to `audit_log` table:
- Token creation
- Token retrieval (with decryption)
- Token revocation
- Failed attempts

## Future Enhancements

- [ ] Integration with AWS KMS / GCP KMS / Azure Key Vault
- [ ] Per-provider key rotation schedules
- [ ] Hardware security module (HSM) support
- [ ] Token versioning for seamless rotation
- [ ] Automated key expiration alerts
