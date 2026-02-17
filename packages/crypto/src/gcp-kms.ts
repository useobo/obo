/**
 * OBO GCP KMS Integration
 *
 * Google Cloud Key Management Service integration for enterprise-grade key management.
 *
 * Prerequisites:
 * 1. Google Cloud project with KMS API enabled
 * 2. Service account with KMS permissions (roles/cloudkms.cryptoKeyEncrypterDecrypter)
 * 3. Application default credentials (ADC) configured
 *
 * Setup:
 * ```bash
 * # Install dependencies
 * pnpm add @google-cloud/kms
 *
 * # Set environment variables
 * export OBO_KEY_PROVIDER=gcp
 * export GCP_KMS_PROJECT_ID=my-project
 * export GCP_KMS_LOCATION=global
 * export GCP_KMS_KEYRING=obo-keyring
 * export GCP_KMS_CRYPTO_KEY=obo-master-key
 * ```
 */

import { KeyManagementServiceClient } from "@google-cloud/kms";

const kmsClient = new KeyManagementServiceClient();

/**
 * KMS configuration from environment
 */
interface KmsConfig {
  projectId: string;
  location: string;
  keyRing: string;
  cryptoKey: string;
}

function getKmsConfig(): KmsConfig {
  const projectId = process.env.GCP_KMS_PROJECT_ID;
  const location = process.env.GCP_KMS_LOCATION || "global";
  const keyRing = process.env.GCP_KMS_KEYRING || "obo-keyring";
  const cryptoKey = process.env.GCP_KMS_CRYPTO_KEY || "obo-master-key";

  if (!projectId) {
    throw new Error("GCP_KMS_PROJECT_ID is required for GCP KMS provider");
  }

  return { projectId, location, keyRing, cryptoKey };
}

/**
 * Get the full KMS key name
 */
function getKeyName(config: KmsConfig): string {
  return kmsClient.cryptoKeyPath(
    config.projectId,
    config.location,
    config.keyRing,
    config.cryptoKey
  );
}

/**
 * Encrypt data using GCP KMS
 *
 * @param plaintext - Data to encrypt (will be UTF-8 encoded)
 * @returns Base64-encoded ciphertext
 */
export async function encryptWithKms(plaintext: string): Promise<string> {
  const config = getKmsConfig();
  const keyName = getKeyName(config);

  const [result] = await kmsClient.encrypt({
    name: keyName,
    plaintext: Buffer.from(plaintext, "utf-8"),
  });

  if (!result.ciphertext) {
    throw new Error("KMS encrypt returned empty ciphertext");
  }

  return result.ciphertext.toString("base64");
}

/**
 * Decrypt data using GCP KMS
 *
 * @param ciphertext - Base64-encoded ciphertext from encryptWithKms
 * @returns Decrypted plaintext
 */
export async function decryptWithKms(ciphertext: string): Promise<string> {
  const config = getKmsConfig();
  const keyName = getKeyName(config);

  const [result] = await kmsClient.decrypt({
    name: keyName,
    ciphertext: Buffer.from(ciphertext, "base64"),
  });

  if (!result.plaintext) {
    throw new Error("KMS decrypt returned empty plaintext");
  }

  return result.plaintext.toString("utf-8");
}

/**
 * Sign data using GCP KMS asymmetric signing
 *
 * This is useful for JWT signing with a managed private key.
 *
 * @param data - Data to sign
 * @returns Base64-encoded signature
 */
export async function signWithKms(data: string): Promise<string> {
  const config = getKmsConfig();
  const keyName = getKeyName(config);

  const [result] = await kmsClient.asymmetricSign({
    name: keyName,
    digest: {
      sha256: await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(data)
      ),
    },
  });

  if (!result.signature) {
    throw new Error("KMS sign returned empty signature");
  }

  return result.signature.toString("base64");
}

/**
 * Verify signature using GCP KMS public key
 *
 * @param data - Original data
 * @param signature - Base64-encoded signature
 * @returns True if signature is valid
 */
export async function verifyWithKms(data: string, signature: string): Promise<boolean> {
  const config = getKmsConfig();
  const keyName = getKeyName(config);

  // Get public key
  const [pubKeyResponse] = await kmsClient.getAsymmetricPublicKey({
    name: keyName,
  });

  if (!pubKeyResponse.pem) {
    throw new Error("KMS returned empty public key");
  }

  // Import public key
  const keyData = await crypto.subtle.importKey(
    "spki",
    Buffer.from(pubKeyResponse.pem, "base64"),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Verify signature
  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    keyData,
    Buffer.from(signature, "base64"),
    new TextEncoder().encode(data)
  );

  return isValid;
}

/**
 * Check if GCP KMS is configured
 */
export function isGcpKmsConfigured(): boolean {
  return !!(
    process.env.GCP_KMS_PROJECT_ID &&
    process.env.OBO_KEY_PROVIDER === "gcp"
  );
}

/**
 * Get KMS key info (for debugging)
 */
export async function getKmsKeyInfo(): Promise<{
  name: string;
  configured: boolean;
}> {
  if (!isGcpKmsConfigured()) {
    return { name: "", configured: false };
  }

  const config = getKmsConfig();
  return {
    name: getKeyName(config),
    configured: true,
  };
}
