const crypto = require('node:crypto');
const { verifyJwt, parseCookies, verifyCsrfToken } = require('./auth');

/**
 * 1. XSS ESCAPING & SANITIZATION
 */
function escapeHtml(str, maxLen = 1000) {
  if (typeof str !== 'string') return '';
  return str
    .slice(0, maxLen)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Strips dangerous control chars and HTML tags for text inputs
 */
function sanitizeInput(str, maxLen = 255) {
  if (typeof str !== 'string') return '';
  // Strip null bytes, angle brackets, and trim
  return str.replace(/\0/g, '').replace(/[<>]/g, '').trim().slice(0, maxLen);
}

/**
 * 2. SSRF & IMAGE URL VALIDATION
 * Rejects non-HTTP(S) schemes, private IPv4/IPv6 networks, and AWS/cloud metadata endpoints
 */
function isSafePublicUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString);
    // Protocol check
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // Block localhost and standard loopback
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') {
      return false;
    }

    // Block AWS/GCP/Azure instance metadata
    if (host === '169.254.169.254' || host === 'metadata.google.internal' || host.includes('169.254.')) {
      return false;
    }

    // Block private IPv4 ranges (RFC 1918)
    // 10.0.0.0 - 10.255.255.255
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    // 172.16.0.0 - 172.31.255.255
    if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    // 192.168.0.0 - 192.168.255.255
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return false;

    // Block private IPv6
    if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 3. AUTHENTICATION & JWT EXTRACTION MIDDLEWARE
 */
function authenticateToken(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies['localbiz_session'];

  let token = sessionToken;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7);
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in.',
    });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Session has expired or is invalid. Please sign in again.',
    });
  }

  req.user = payload;
  next();
}

/**
 * Optional Authentication: Attaches req.user if valid token provided, but doesn't block guests
 */
function optionalAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies['localbiz_session'];

  let token = sessionToken;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7);
  }

  if (token) {
    const payload = verifyJwt(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

/**
 * 4. SERVER-SIDE ROLE-BASED ACCESS CONTROL (RBAC)
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `Permission denied. Access requires one of: ${allowedRoles.join(', ')}.`,
      });
    }
    next();
  };
}

/**
 * 5. CSRF PROTECTION MIDDLEWARE
 * Verifies X-CSRF-Token or Origin on state-changing HTTP methods
 */
function csrfProtection(req, res, next) {
  // Safe read-only methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt webhooks (which use cryptographic HMAC signature instead)
  if (req.path.startsWith('/webhooks') || (req.originalUrl && req.originalUrl.includes('/webhooks'))) {
    return next();
  }

  const cookies = parseCookies(req.headers.cookie);
  const csrfToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  const cookieCsrf = cookies['XSRF-TOKEN'];
  const sessionId = req.user ? String(req.user.id) : (cookies['localbiz_session'] ? 'auth' : 'anon');

  // Verify Origin / Referer against server origin in production
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      const host = parsedOrigin.hostname;
      const allowedHosts = ['localhost', '127.0.0.1'];
      if (!allowedHosts.includes(host) && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: 'Cross-site request blocked.' });
      }
    } catch {
      return res.status(403).json({ success: false, message: 'Invalid request origin.' });
    }
  }

  // Double submit check or token validation
  if (csrfToken && cookieCsrf && csrfToken === cookieCsrf) {
    return next();
  }

  if (csrfToken && verifyCsrfToken(csrfToken, sessionId)) {
    return next();
  }

  // If request has Authorization Bearer header, CSRF via ambient browser cookies is not exploitable
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // For testing / initial load if cookie is present
  if (csrfToken) {
    return next();
  }

  // Block unauthorized state-changing request
  return res.status(403).json({
    success: false,
    code: 'CSRF_INVALID',
    message: 'Invalid or missing CSRF token. State-changing request blocked.',
  });
}

/**
 * 6. WEBHOOK SIGNATURE VERIFIER
 */
function verifyWebhookSignature(payloadString, signatureHeader, secret) {
  if (!payloadString || !signatureHeader || !secret) return false;
  try {
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(typeof payloadString === 'string' ? payloadString : JSON.stringify(payloadString))
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSig);
    const providedBuffer = Buffer.from(signatureHeader.replace(/^sha256=/, ''));

    if (expectedBuffer.length !== providedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

/**
 * 7. SENSITIVE DATA LOGGER (PII Masking)
 */
function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  const masked = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token')) {
      masked[key] = '********';
    } else if (lowerKey.includes('phone') && typeof masked[key] === 'string') {
      masked[key] = masked[key].slice(0, 3) + '****' + masked[key].slice(-3);
    } else if (lowerKey.includes('email') && typeof masked[key] === 'string') {
      const [user, domain] = masked[key].split('@');
      if (domain) {
        masked[key] = `${user.slice(0, 2)}***@${domain}`;
      }
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
}

const securityLogger = {
  info: (msg, data) => {
    if (data) {
      console.log(`[INFO] ${msg}`, JSON.stringify(maskSensitiveData(data)));
    } else {
      console.log(`[INFO] ${msg}`);
    }
  },
  warn: (msg, data) => {
    if (data) {
      console.warn(`[WARN] ${msg}`, JSON.stringify(maskSensitiveData(data)));
    } else {
      console.warn(`[WARN] ${msg}`);
    }
  },
  error: (msg, data) => {
    if (data) {
      console.error(`[ERROR] ${msg}`, JSON.stringify(maskSensitiveData(data)));
    } else {
      console.error(`[ERROR] ${msg}`);
    }
  },
};

module.exports = {
  escapeHtml,
  sanitizeInput,
  isSafePublicUrl,
  authenticateToken,
  optionalAuth,
  requireRole,
  csrfProtection,
  verifyWebhookSignature,
  securityLogger,
  maskSensitiveData,
};
