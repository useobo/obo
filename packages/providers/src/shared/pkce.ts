/**
 * Shared PKCE (Proof Key for Code Exchange) Flow Utilities
 *
 * PKCE is an OAuth extension (RFC 7636) that enables secure
 * authorization code flows without requiring a client secret.
 *
 * This is the standard flow for most modern OAuth providers.
 *
 * Flow:
 * 1. Generate code_verifier (random string)
 * 2. Generate code_challenge = BASE64URL(SHA256(code_verifier))
 * 3. Send user to auth URL with challenge
 * 4. Provider redirects to callback with code
 * 5. Exchange code + verifier for access token
 */

import { createHash, randomBytes } from "crypto";

export interface PKCEStartRequest {
  /** Provider/service identifier */
  service: string;
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret (optional, some providers don't use it) */
  clientSecret?: string;
  /** Authorization URL */
  authUrl: string;
  /** Token URL */
  tokenUrl: string;
  /** Scopes to request */
  scopes: string[];
  /** Callback URL (e.g., https://useobo.com/callback/stripe) */
  callbackUrl: string;
  /** State parameter for CSRF protection */
  state: string;
  /** Additional params to send to auth URL */
  extraAuthParams?: Record<string, string>;
  /** Additional params to send to token request */
  extraTokenParams?: Record<string, string>;
}

export interface PKCEStartResponse {
  /** The URL to send the user to */
  authorizationUrl: string;
  /** The code verifier (store this for later) */
  codeVerifier: string;
  /** The state (store this for verification) */
  state: string;
}

export interface PKCEExchangeRequest {
  /** Token URL */
  tokenUrl: string;
  /** The authorization code from callback */
  code: string;
  /** The code verifier generated earlier */
  codeVerifier: string;
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret (optional) */
  clientSecret?: string;
  /** Callback URL used in the auth request */
  callbackUrl: string;
  /** Additional params to send to token request */
  extraParams?: Record<string, string>;
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
  scope?: string;
  refresh_token?: string;
  expires_in?: number;
  [key: string]: unknown;
}

/**
 * Generate a PKCE code verifier
 * Random string 43-128 characters, using [A-Z][a-z][0-9]-._~
 */
export function generateCodeVerifier(): string {
  const bytes = randomBytes(32);
  return bytes.toString('base64url')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generate code challenge from verifier
 * challenge = BASE64URL(SHA256(verifier))
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = createHash('sha256').update(verifier).digest();
  return hash.toString('base64url')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Start a PKCE flow - generate the authorization URL
 */
export function startPKCEFlow(request: PKCEStartRequest): PKCEStartResponse {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: request.clientId,
    redirect_uri: request.callbackUrl,
    scope: request.scopes.join(' '),
    state: request.state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    ...request.extraAuthParams,
  });

  const authorizationUrl = `${request.authUrl}?${params.toString()}`;

  console.log('[PKCE] Authorization URL generated:', {
    callbackUrl: request.callbackUrl,
    clientId: request.clientId,
    url: authorizationUrl.substring(0, 200) + '...',
  });

  return {
    authorizationUrl,
    codeVerifier: verifier,
    state: request.state,
  };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  request: PKCEExchangeRequest
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: request.code,
    redirect_uri: request.callbackUrl,
    client_id: request.clientId,
    code_verifier: request.codeVerifier,
    ...request.extraParams,
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  };

  // Discord requires HTTP Basic Auth even with PKCE
  // But we also include client_id in the body
  if (request.clientSecret) {
    const basicAuth = Buffer.from(`${request.clientId}:${request.clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${basicAuth}`;
    console.log('[PKCE] Using HTTP Basic Authentication');
    console.log('[PKCE] Basic auth payload:', `${request.clientId}:${request.clientSecret.substring(0, 5)}...`);
  } else {
    console.log('[PKCE] No client secret provided (PKCE public client)');
  }

  // Debug logging
  console.log('[PKCE] Token exchange request:', {
    url: request.tokenUrl,
    clientId: request.clientId,
    hasClientSecret: !!request.clientSecret,
    callbackUrl: request.callbackUrl,
    hasCodeVerifier: !!request.codeVerifier,
  });

  const response = await fetch(request.tokenUrl, {
    method: 'POST',
    headers,
    body: params,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[PKCE] Token exchange failed:', {
      status: response.status,
      response: text,
      requestBody: params.toString(),
    });
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  const data = await response.json() as TokenResponse | { error: string; error_description?: string };

  if ('error' in data) {
    throw new Error(`Token error: ${data.error}${data.error_description ? ` - ${data.error_description}` : ''}`);
  }

  return data as TokenResponse;
}

/**
 * Build an authorization URL for PKCE flow
 * Convenience function that combines everything
 */
export function buildAuthorizationUrl(config: {
  authUrl: string;
  clientId: string;
  callbackUrl: string;
  scopes: string[];
  state: string;
  codeChallenge: string;
  extraParams?: Record<string, string>;
}): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    scope: config.scopes.join(' '),
    state: config.state,
    code_challenge: config.codeChallenge,
    code_challenge_method: 'S256',
    ...config.extraParams,
  });

  return `${config.authUrl}?${params.toString()}`;
}
