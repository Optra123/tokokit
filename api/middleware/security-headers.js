/**
 * Security Headers Middleware for Vercel Serverless Functions
 *
 * Adds important security headers to all responses
 * Protects against common web vulnerabilities
 */

/**
 * Apply security headers to response
 *
 * @param {Object} res - Response object
 * @param {Object} options - Configuration options
 */
function applySecurityHeaders(res, options = {}) {
  const {
    csp = true,
    hsts = true,
    noSniff = true,
    frameOptions = true,
    xssProtection = true,
    corsOrigins = process.env.CORS_ORIGINS?.split(',') || []
  } = options;

  // Content Security Policy - prevents XSS attacks
  if (csp) {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.midtrans.com https://api.xendit.co https://api.resend.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ];
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  }

  // HTTP Strict Transport Security - forces HTTPS
  if (hsts) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-Content-Type-Options - prevents MIME type sniffing
  if (noSniff) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }

  // X-Frame-Options - prevents clickjacking
  if (frameOptions) {
    res.setHeader('X-Frame-Options', 'DENY');
  }

  // X-XSS-Protection - enables browser XSS filter (legacy, CSP is better)
  if (xssProtection) {
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }

  // Referrer Policy - controls referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - controls browser features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(self), usb=()');

  // Remove powered-by header (security through obscurity)
  res.removeHeader('X-Powered-By');

  // CORS headers if origins are configured
  if (corsOrigins.length > 0) {
    const origin = res.req?.headers?.origin;
    if (origin && corsOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    }
  }
}

/**
 * Security headers middleware for Vercel functions
 *
 * Usage:
 * const { securityHeaders } = require('./middleware/security-headers');
 *
 * module.exports = async function handler(req, res) {
 *   securityHeaders(req, res);
 *
 *   // Handle OPTIONS preflight for CORS
 *   if (req.method === 'OPTIONS') {
 *     res.status(200).end();
 *     return;
 *   }
 *
 *   // ... your handler code
 * }
 */
function securityHeaders(req, res, options = {}) {
  // Store req on res for CORS origin checking
  res.req = req;

  applySecurityHeaders(res, options);

  // Handle OPTIONS preflight automatically
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return true; // Indicates response was sent
  }

  return false; // Continue processing
}

/**
 * Create custom security headers middleware
 *
 * @param {Object} customOptions - Custom security options
 */
function createSecurityHeaders(customOptions = {}) {
  return function customSecurityHeaders(req, res) {
    return securityHeaders(req, res, customOptions);
  };
}

/**
 * Validate webhook signature helper
 *
 * @param {string} signature - Signature from header
 * @param {string} payload - Raw request body
 * @param {string} secret - Webhook secret
 * @param {string} algorithm - Hash algorithm (default: sha256)
 */
function validateWebhookSignature(signature, payload, secret, algorithm = 'sha256') {
  const crypto = require('crypto');
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  // Timing-safe comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

module.exports = {
  securityHeaders,
  createSecurityHeaders,
  applySecurityHeaders,
  validateWebhookSignature
};
