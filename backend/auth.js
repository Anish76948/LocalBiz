const crypto = require('node:crypto');

// Load or generate persistent JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'localbiz-ultra-secure-256bit-secret-key-prod-2026-tcet-group06';
const CSRF_SECRET = process.env.CSRF_SECRET || 'localbiz-csrf-protection-secret-salt-2026';

/**
 * Base64URL encoding/decoding
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs a JWT payload using HMAC-SHA256
 * @param {object} payload 
 * @param {number} expiresInSeconds (default 1 hour = 3600s)
 */
function signJwt(payload, expiresInSeconds = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies a JWT token with timing-safe comparison
 * @param {string} token 
 */
function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Constant-time compare
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Generates an anti-CSRF token bound to a session/user ID
 */
function generateCsrfToken(sessionId) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const hmac = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId || 'anon'}:${nonce}`)
    .digest('hex');
  return `${nonce}.${hmac}`;
}

/**
 * Validates a CSRF token
 */
function verifyCsrfToken(token, sessionId) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [nonce, providedHmac] = parts;
  const expectedHmac = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId || 'anon'}:${nonce}`)
    .digest('hex');

  const providedBuffer = Buffer.from(providedHmac);
  const expectedBuffer = Buffer.from(expectedHmac);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Cookie Parser helper
 */
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [name, ...valParts] = pair.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(valParts.join('='));
    }
  }
  return cookies;
}

/**
 * Serializes a cookie with security flags
 */
function serializeCookie(name, value, options = {}) {
  const {
    maxAge = 3600,
    httpOnly = true,
    sameSite = 'Strict',
    path = '/',
    secure = false, // Set true in production HTTPS
  } = options;

  let cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=${path}; SameSite=${sameSite}`;
  if (httpOnly) cookie += '; HttpOnly';
  if (secure) cookie += '; Secure';
  return cookie;
}

/**
 * Validates strong password rules:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
function isStrongPassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasDigit && hasSpecial;
}

/**
 * MFA / 2FA Cryptographic One-Time Password utilities
 */
function generateMfaSecret() {
  return crypto.randomBytes(20).toString('hex');
}

/**
 * Generates a 6-digit time-based or counter-based OTP
 * Uses a 3-minute window for human entry tolerance
 */
function generateOtpCode(secret, timeWindowOffset = 0) {
  const timeStep = 180; // 3 minutes
  const counter = Math.floor(Date.now() / 1000 / timeStep) + timeWindowOffset;
  const hmac = crypto.createHmac('sha256', secret).update(String(counter)).digest('hex');
  const code = (parseInt(hmac.slice(-6), 16) % 1000000).toString().padStart(6, '0');
  return code;
}

function verifyOtpCode(providedCode, secret) {
  if (!providedCode || !secret) return false;
  const cleanCode = String(providedCode).trim();
  // Check current window and +/- 1 window (grace period)
  for (const offset of [0, -1, 1]) {
    const expected = generateOtpCode(secret, offset);
    if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}

module.exports = {
  signJwt,
  verifyJwt,
  generateCsrfToken,
  verifyCsrfToken,
  parseCookies,
  serializeCookie,
  isStrongPassword,
  generateMfaSecret,
  generateOtpCode,
  verifyOtpCode,
};
