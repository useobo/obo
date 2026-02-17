# OBO Security Guide

## Overview

OBO handles sensitive credentials (API keys, OAuth tokens, JWTs). This guide explains how to secure your deployment.

## Token Encryption at Rest

### Default (AES-256-GCM)

By default, tokens are encrypted using AES-256-GCM before storage:

```bash
export OBO_ENCRYPTION_KEY="$(openssl rand -base64 32)"  # REQUIRED for production
```

**How it works:**
- Each token gets a unique initialization vector (IV)
- Authenticated encryption (AEAD) prevents tampering
- Key derived using scrypt with salt
- Format: `iv:authTag:encrypted` (base64-encoded)

### One-Time Token Delivery

For maximum security, store only a cryptographic hash (tokens can't be retrieved after delivery):

```bash
export OBO_ONE_TIME_DELIVERY=true
```

**Use case:** When the agent should receive the token once and never again.

## JWT Key Management

### Key Rotation

OBO supports seamless JWT key rotation:

```bash
# Current primary signing key
OBO_JWT_SECRET_1="$(openssl rand -base64 32)"

# Next key (for rotation)
OBO_JWT_SECRET_2="$(openssl rand -base64 32)"

# Old key (keep for verification during rotation)
OBO_JWT_SECRET_3="previous-key-here"
```

**Rotation process:**
1. Add new key as `_1` (becomes primary)
2. Shift existing keys (`_1` → `_2`, `_2` → `_3`, etc.)
3. Keep old keys for verification (tokens signed with old keys still valid)
4. Remove old keys after their tokens expire

### JWT Revocation

Tokens can be revoked immediately via API:

```bash
curl -X POST http://localhost:3001/trpc/jwt.revoke \
  -H "Content-Type: application/json" \
  -d '{"jti": "slip_id", "reason": "User requested"}'
```

**Note:** In production, the revocation list should be backed by Redis.

## GCP Cloud KMS Integration

For enterprise deployments, use Google Cloud KMS for hardware-grade key management.

### Setup

1. **Create a KMS key ring and key:**

```bash
# Set your project
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Create key ring
gcloud kms keyrings create obo-keyring \
  --location global

# Create symmetric encryption key
gcloud kms keys create obo-master-key \
  --keyring obo-keyring \
  --location global \
  --purpose "encryption"

# Create asymmetric signing key (for JWTs)
gcloud kms keys create obo-signing-key \
  --keyring obo-keyring \
  --location global \
  --purpose "asymmetric-signing" \
  --key-algorithm "rsa-sign-pkcs1-v1_5-sha256"
```

2. **Configure service account permissions:**

```bash
# Create service account
gcloud iam service-accounts create obo-kms \
  --display-name="OBO KMS Service Account"

# Grant KMS permissions
gcloud kms keys add-iam-policy-binding \
  obo-master-key \
  --keyring obo-keyring \
  --location global \
  --member="serviceAccount:obo-kms@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"

gcloud kms keys add-iam-policy-binding \
  obo-signing-key \
  --keyring obo-keyring \
  --location global \
  --member="serviceAccount:obo-kms@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudkms.signerVerifier"
```

3. **Enable Application Default Credentials:**

```bash
# Download service account key
gcloud iam service-accounts keys create obo-kms-key.json \
  --iam-account="obo-kms@${PROJECT_ID}.iam.gserviceaccount.com"

# Set ADC
export GOOGLE_APPLICATION_CREDENTIALS="./obo-kms-key.json"
```

4. **Install dependencies and configure:**

```bash
# Install GCP KMS client
pnpm add @google-cloud/kms

# Configure OBO
export OBO_KEY_PROVIDER=gcp
export GCP_KMS_PROJECT_ID=$PROJECT_ID
export GCP_KMS_LOCATION=global
export GCP_KMS_KEYRING=obo-keyring
export GCP_KMS_CRYPTO_KEY=obo-master-key
```

### Cost

Google Cloud KMS free tier (as of 2025):
- 200 symmetric encrypt/decrypt operations per month
- 200 asymmetric sign/verify operations per month
- Beyond that: ~$0.03 per 10,000 operations

For most deployments, the free tier is sufficient. If you have high volume, consider:
- Caching decrypted keys in memory (short TTL)
- Using local encryption with periodic rotation
- Batching operations

## Database Security

### PostgreSQL Configuration

```sql
-- Enable SSL/TLS
ALTER DATABASE obo SET ssl = on;
ALTER DATABASE obo SET ssl_min_protocol_version = 'TLSv1.3';

-- Enable row-level security (for multi-tenant)
ALTER TABLE slips ENABLE ROW LEVEL SECURITY;

-- Create policy for user-isolated access
CREATE POLICY user_slips ON slips
  FOR ALL
  USING (principal_id IN (
    SELECT id FROM principals WHERE email = current_user
  ));
```

### Transparent Data Encryption (TDE)

Cloud providers offer TDE at no extra cost:
- **Cloud SQL (GCP):** Enabled by default
- **RDS (AWS):** Enabled by default
- **Azure Database:** Enabled by default

TDE encrypts data at the storage level. Combine with application-level encryption for defense in depth.

## Security Checklist

### For Development

- [ ] Change default `OBO_ENCRYPTION_KEY` and `OBO_JWT_SECRET_1`
- [ ] Enable local SSL/TLS for API
- [ ] Use environment variables for secrets (never commit `.env`)

### For Production

- [ ] Set strong `OBO_ENCRYPTION_KEY` (32+ bytes, randomly generated)
- [ ] Set strong JWT signing keys
- [ ] Enable PostgreSQL SSL/TLS
- [ ] Configure key rotation schedule
- [ ] Set up monitoring for revocation list size
- [ ] Use GCP KMS or equivalent (optional, recommended)
- [ ] Enable audit logging
- [ ] Set up alerts for suspicious activity

### For High Security

- [ ] Hardware Security Module (HSM) or Cloud KMS
- [ ] Short token TTLs (15-60 minutes)
- [ ] Require user approval for high-risk scopes
- [ ] IP whitelisting for OAuth callbacks
- [ ] Regular security audits
- [ ] Penetration testing

## Incident Response

### Compromised Token

1. Revoke immediately via API: `/trpc/jwt.revoke`
2. Revoke associated slip: `/trpc/slip.revoke`
3. Check audit logs for usage patterns
4. Notify the target service (GitHub, Supabase, etc.)

### Compromised Encryption Key

1. **Rotate immediately:**
   ```bash
   # Generate new key
   export OBO_ENCRYPTION_KEY="$(openssl rand -base64 32)"

   # Re-encrypt all tokens (requires migration script)
   # TODO: Add migration command
   ```

2. **Rotate JWT signing keys** (see above)

3. **Audit access logs** for the time period

### Compromised Database

1. **Assume all tokens are exposed**
2. **Revoke all active slips** (cascading revocation)
3. **Rotate all encryption keys**
4. **Notify all users** of potential exposure
5. **Force re-authorization** for all connected services

## Compliance

OBO supports compliance requirements for:

- **SOC 2:** Audit logging, access controls, encryption at rest
- **GDPR:** Right to erasure (slip/token revocation), data minimization
- **HIPAA:** BAA may be required for healthcare deployments
- **PCI DSS:** Never store full payment card numbers (use tokenization)

## Questions?

See [`../packages/crypto/README.md`](../packages/crypto/README.md) for API documentation.
