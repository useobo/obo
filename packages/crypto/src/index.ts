/**
 * OBO Crypto Utilities
 *
 * Encryption and hashing for secure token storage.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Encryption configuration
 */
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = "obo-token-salt-v1"; // In production, use proper key management

/**
 * Derive encryption key from environment secret
 */
function deriveKey(): Buffer {
  const secret = process.env.OBO_ENCRYPTION_KEY || "dev-key-change-me-in-production";
  return scryptSync(secret, SALT, KEY_LENGTH);
}

/**
 * Encrypt sensitive data (API keys, tokens, etc.)
 *
 * Returns base64-encoded string with format: iv:authTag:encrypted
 */
export function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "binary");
  encrypted += cipher.final("binary");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted (all base64)
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    Buffer.from(encrypted, "binary").toString("base64"),
  ].join(":");
}

/**
 * Decrypt data that was encrypted with encrypt()
 */
export function decrypt(ciphertext: string): string {
  const key = deriveKey();
  const [ivB64, authTagB64, encryptedB64] = ciphertext.split(":");

  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error("Invalid ciphertext format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * One-way hash for tokens that should only be delivered once
 * (e.g., we can verify but never retrieve)
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a token against its hash
 */
export async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  const tokenHash = await hashToken(token);
  return tokenHash === hash;
}

/**
 * Check if a string is encrypted (has our format marker)
 */
export function isEncrypted(value: string): boolean {
  // Encrypted values have 3 parts separated by colons
  const parts = value.split(":");
  return parts.length === 3 &&
    parts.every((part) => part.length > 0 && /^[A-Za-z0-9+/=]+$/.test(part));
}

/**
 * Configuration for token storage behavior
 */
export interface TokenStorageConfig {
  /** Whether to encrypt secrets at rest (default: true) */
  encryptAtRest?: boolean;
  /** Whether to store only a hash, making it one-time retrievable (default: false) */
  oneTimeDelivery?: boolean;
}

/**
 * Default configuration from environment
 */
export function getDefaultStorageConfig(): TokenStorageConfig {
  return {
    encryptAtRest: process.env.OBO_ENCRYPT_AT_REST !== "false", // default true
    oneTimeDelivery: process.env.OBO_ONE_TIME_DELIVERY === "true", // default false
  };
}
