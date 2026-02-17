/**
 * OBO JWT Utilities
 *
 * JWT signing, verification, key rotation, and revocation.
 */

import { SignJWT, jwtVerify, type JWTVerifyResult, type JWTPayload } from "jose";

/**
 * Key metadata for rotation tracking
 */
interface KeyMetadata {
  id: string;
  key: Uint8Array;
  createdAt: number;
  expiresAt?: number; // When this key should no longer be used for signing
}

/**
 * Key store for rotation support
 */
class KeyStore {
  private keys: Map<string, KeyMetadata> = new Map();
  private primaryKeyId: string | null = null;

  constructor() {
    this.initializeFromEnv();
  }

  /**
   * Initialize keys from environment variables
   * Supports multiple keys for rotation:
   * OBO_JWT_SECRET_1 (primary, current)
   * OBO_JWT_SECRET_2 (secondary, for verification during rotation)
   * etc.
   */
  private initializeFromEnv(): void {
    // Find all JWT secrets from environment
    const secrets: Array<{ id: string; key: string }> = [];

    // Check for numbered keys (OBO_JWT_SECRET_1, _2, etc.)
    for (let i = 1; i <= 10; i++) {
      const envKey = `OBO_JWT_SECRET_${i}`;
      const secret = process.env[envKey];
      if (secret) {
        secrets.push({ id: `key-${i}`, key: secret });
      }
    }

    // Fall back to single OBO_JWT_SECRET
    if (secrets.length === 0) {
      const secret = process.env.OBO_JWT_SECRET || "dev-jwt-secret-change-me-in-production";
      secrets.push({ id: "key-1", key: secret });
    }

    // Sort by number so key-1 is primary
    secrets.sort((a, b) => parseInt(a.id.split("-")[1]) - parseInt(b.id.split("-")[1]));

    // Initialize keys
    for (const { id, key } of secrets) {
      const keyBytes = new TextEncoder().encode(key);
      this.keys.set(id, {
        id,
        key: keyBytes,
        createdAt: Date.now(),
      });
    }

    // Set first key as primary
    this.primaryKeyId = secrets[0].id;
  }

  /**
   * Get the primary signing key
   */
  getPrimarySigningKey(): { id: string; key: Uint8Array } {
    if (!this.primaryKeyId) {
      throw new Error("No signing key available");
    }
    const metadata = this.keys.get(this.primaryKeyId);
    if (!metadata) {
      throw new Error(`Primary key ${this.primaryKeyId} not found`);
    }
    return { id: metadata.id, key: metadata.key };
  }

  /**
   * Get a key by ID for verification
   */
  getKeyById(id: string): Uint8Array | undefined {
    return this.keys.get(id)?.key;
  }

  /**
   * Get all keys (for trying multiple during verification)
   */
  getAllKeys(): Map<string, Uint8Array> {
    const allKeys = new Map<string, Uint8Array>();
    for (const [id, metadata] of this.keys.entries()) {
      allKeys.set(id, metadata.key);
    }
    return allKeys;
  }

  /**
   * Get all key metadata
   */
  getKeyMetadata(): KeyMetadata[] {
    return Array.from(this.keys.values());
  }
}

// Global key store instance
const keyStore = new KeyStore();

/**
 * In-memory revocation list
 * In production, this should be backed by Redis or the database
 */
const revokedTokens = new Map<string, { revokedAt: number; reason?: string }>();

/**
 * Clean up expired revocation entries (older than 7 days)
 */
function cleanupRevocationList(): void {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
  for (const [tokenId, info] of revokedTokens.entries()) {
    if (info.revokedAt < cutoff) {
      revokedTokens.delete(tokenId);
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRevocationList, 60 * 60 * 1000);
}

/**
 * JWT payload for OBO tokens
 */
export interface OboJWTPayload {
  /** Principal (user) this token is for */
  principal: string;
  /** Granted scopes */
  scopes: string[];
  /** Associated slip ID */
  slipId: string;
  /** Key ID that signed this token (for rotation) */
  kid?: string;
  /** JWT ID (for revocation) */
  jti?: string;
  /** Issuer */
  iss?: string;
  /** Subject */
  sub?: string;
  /** Expiration time */
  exp?: number;
  /** Issued at */
  iat?: number;
}

/**
 * Sign a JWT with the current primary key
 */
export async function signJWT(payload: OboJWTPayload, expiresIn: number = 3600): Promise<string> {
  const { id: kid, key } = keyStore.getPrimarySigningKey();

  return await new SignJWT({
    principal: payload.principal,
    scopes: payload.scopes,
    slipId: payload.slipId,
  })
    .setProtectedHeader({ alg: "HS256", kid })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .setJti(payload.slipId) // Use slip ID as JWT ID for revocation
    .setIssuer("obo")
    .setSubject(payload.principal)
    .sign(key);
}

/**
 * Verify a JWT
 *
 * Tries all keys to support key rotation
 */
export async function verifyJWT(token: string): Promise<OboJWTPayload> {
  // First, check if this token has been revoked
  const decoded = decodeJWTPayload(token);
  if (decoded.jti && isTokenRevoked(decoded.jti)) {
    throw new Error("Token has been revoked");
  }

  // Try verifying with each key
  const allKeys = keyStore.getAllKeys();
  const errors: Error[] = [];

  for (const [kid, key] of allKeys.entries()) {
    try {
      const result = await jwtVerify(token, key, {
        issuer: "obo",
        algorithms: ["HS256"],
      });
      // Return the payload with our custom fields
      return {
        principal: result.payload.principal as string,
        scopes: result.payload.scopes as string[],
        slipId: result.payload.slipId as string,
        jti: result.payload.jti as string | undefined,
        kid: result.protectedHeader.kid as string | undefined,
        iss: result.payload.iss,
        sub: result.payload.sub,
        exp: result.payload.exp,
        iat: result.payload.iat,
      };
    } catch (e) {
      errors.push(e as Error);
    }
  }

  // If we get here, none of the keys worked
  throw new Error(`Token verification failed: ${errors.map(e => e.message).join(", ")}`);
}

/**
 * Revoke a token by its JTI (JWT ID) or slip ID
 */
export function revokeToken(jti: string, reason?: string): void {
  revokedTokens.set(jti, {
    revokedAt: Date.now(),
    reason,
  });
}

/**
 * Check if a token is revoked
 */
export function isTokenRevoked(jti: string): boolean {
  return revokedTokens.has(jti);
}

/**
 * Get revocation info for a token
 */
export function getRevocationInfo(jti: string): { revokedAt: number; reason?: string } | undefined {
  return revokedTokens.get(jti);
}

/**
 * Decode JWT payload without verification (for inspection)
 * WARNING: Does not verify signature!
 */
export function decodeJWTPayload(token: string): OboJWTPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const payload = parts[1];
  // Add padding if needed
  const paddedPayload = payload + "=".repeat((4 - payload.length % 4) % 4);
  const decoded = atob(paddedPayload);
  return JSON.parse(decoded);
}

/**
 * Get information about signing keys
 */
export function getKeyInfo(): Array<{ id: string; createdAt: number; isPrimary: boolean }> {
  const primaryId = keyStore.getPrimarySigningKey().id;
  return keyStore.getKeyMetadata().map(k => ({
    id: k.id,
    createdAt: k.createdAt,
    isPrimary: k.id === primaryId,
  }));
}

/**
 * Estimate key rotation readiness
 * Returns true if multiple keys are configured
 */
export function hasKeyRotationConfigured(): boolean {
  return keyStore.getAllKeys().size > 1;
}

/**
 * Revocation list management
 */
export const revocation = {
  revoke: revokeToken,
  isRevoked: isTokenRevoked,
  getInfo: getRevocationInfo,
  getAll: () => new Map(revokedTokens),
  clear: (jti?: string) => {
    if (jti) {
      revokedTokens.delete(jti);
    } else {
      revokedTokens.clear();
    }
  },
};
