/**
 * Input Validation Helpers for API Endpoints
 *
 * Provides validation and sanitization functions for common inputs
 * Prevents injection attacks and data corruption
 */

/**
 * Sanitize string input - removes/escapes dangerous characters
 *
 * @param {string} value - Input string
 * @param {Object} options - { maxLength: number, allowHtml: boolean }
 * @returns {string} Sanitized string
 */
function sanitizeString(value, options = {}) {
  if (typeof value !== 'string') {
    return '';
  }

  const { maxLength = 1000, allowHtml = false } = options;

  let sanitized = value.trim();

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove HTML if not allowed
  if (!allowHtml) {
    sanitized = sanitized
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Validate email address
 *
 * @param {string} email - Email address to validate
 * @returns {{ valid: boolean, error?: string }}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const sanitized = sanitizeString(email, { maxLength: 254 });

  // RFC 5322 compliant email regex (simplified)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, value: sanitized };
}

/**
 * Validate phone number (international format)
 *
 * @param {string} phone - Phone number to validate
 * @returns {{ valid: boolean, error?: string, normalized?: string }}
 */
function validatePhone(phone) {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }

  const sanitized = String(phone).replace(/\D/g, '');

  if (sanitized.length < 8 || sanitized.length > 15) {
    return { valid: false, error: 'Phone number must be 8-15 digits' };
  }

  return { valid: true, value: phone, normalized: sanitized };
}

/**
 * Validate amount (price, payment)
 *
 * @param {number|string} amount - Amount to validate
 * @param {Object} options - { min: number, max: number }
 * @returns {{ valid: boolean, error?: string, value?: number }}
 */
function validateAmount(amount, options = {}) {
  const { min = 0, max = 999999999 } = options;

  const numAmount = Number(amount);

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Amount must be a number' };
  }

  if (!isFinite(numAmount)) {
    return { valid: false, error: 'Amount must be finite' };
  }

  if (numAmount < min) {
    return { valid: false, error: `Amount must be at least ${min}` };
  }

  if (numAmount > max) {
    return { valid: false, error: `Amount must not exceed ${max}` };
  }

  // Round to integer (smallest currency unit)
  const rounded = Math.round(numAmount);

  return { valid: true, value: rounded };
}

/**
 * Validate order number format
 *
 * @param {string} orderNumber - Order number to validate
 * @returns {{ valid: boolean, error?: string, value?: string }}
 */
function validateOrderNumber(orderNumber) {
  if (!orderNumber || typeof orderNumber !== 'string') {
    return { valid: false, error: 'Order number is required' };
  }

  const sanitized = sanitizeString(orderNumber, { maxLength: 100 });

  // Allow alphanumeric, dashes, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return { valid: false, error: 'Invalid order number format' };
  }

  if (sanitized.length < 3 || sanitized.length > 50) {
    return { valid: false, error: 'Order number must be 3-50 characters' };
  }

  return { valid: true, value: sanitized };
}

/**
 * Validate URL
 *
 * @param {string} url - URL to validate
 * @param {Object} options - { allowedProtocols: string[], requireHttps: boolean }
 * @returns {{ valid: boolean, error?: string, value?: string }}
 */
function validateUrl(url, options = {}) {
  const { allowedProtocols = ['http:', 'https:'], requireHttps = false } = options;

  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const sanitized = sanitizeString(url, { maxLength: 2048 });

  try {
    const parsed = new URL(sanitized);

    if (requireHttps && parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL must use HTTPS' };
    }

    if (!allowedProtocols.includes(parsed.protocol)) {
      return { valid: false, error: `URL protocol must be one of: ${allowedProtocols.join(', ')}` };
    }

    return { valid: true, value: sanitized };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate required fields in object
 *
 * @param {Object} data - Data object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {{ valid: boolean, errors?: Object }}
 */
function validateRequiredFields(data, requiredFields) {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { _general: 'Data must be an object' } };
  }

  const errors = {};

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors[field] = `${field} is required`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Validate and sanitize a batch of inputs
 *
 * @param {Object} schema - Validation schema
 * @param {Object} data - Data to validate
 * @returns {{ valid: boolean, errors?: Object, sanitized?: Object }}
 *
 * Example schema:
 * {
 *   email: { type: 'email', required: true },
 *   amount: { type: 'amount', min: 1000, max: 10000000 },
 *   name: { type: 'string', maxLength: 100, required: true }
 * }
 */
function validateSchema(schema, data) {
  const errors = {};
  const sanitized = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip validation if not required and empty
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Validate by type
    let result;
    switch (rules.type) {
      case 'email':
        result = validateEmail(value);
        break;
      case 'phone':
        result = validatePhone(value);
        break;
      case 'amount':
        result = validateAmount(value, { min: rules.min, max: rules.max });
        break;
      case 'url':
        result = validateUrl(value, { requireHttps: rules.requireHttps });
        break;
      case 'orderNumber':
        result = validateOrderNumber(value);
        break;
      case 'string':
      default:
        sanitized[field] = sanitizeString(value, { maxLength: rules.maxLength });
        continue;
    }

    if (!result.valid) {
      errors[field] = result.error;
    } else {
      sanitized[field] = result.value !== undefined ? result.value : value;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, sanitized };
}

/**
 * Prevent SQL injection in raw queries (use parameterized queries instead!)
 * This is a last resort - always use Supabase's query builder
 *
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeSQL(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return (
    value
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      // eslint-disable-next-line no-control-regex
      .replace(/\x1a/g, '\\Z')
  );
}

module.exports = {
  sanitizeString,
  validateEmail,
  validatePhone,
  validateAmount,
  validateOrderNumber,
  validateUrl,
  validateRequiredFields,
  validateSchema,
  escapeSQL
};
