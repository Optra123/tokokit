// Jest globals (describe, test, expect, jest, beforeEach) are automatically available
// We'll need to mock some Node.js built-ins and environment
const crypto = require('crypto');

// Mock environment variables for tests
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

// Mock fetch globally
global.fetch = jest.fn();

// Import the module under test
const _lib = require('../_lib.js');

describe('Payment Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('createPaymentUrl', () => {
    test('should create Pakasir payment URL correctly', async () => {
      const store = {
        payment_gateway_provider: 'pakasir',
        pakasir_slug: 'test-store'
      };
      const order = {
        order_number: 'TK-12345',
        total_amount: 150000
      };

      const url = await _lib.createPaymentUrl(store, order);

      expect(url).toBe('https://app.pakasir.com/pay/test-store/150000?order_id=TK-12345');
    });

    test('should create custom link payment URL correctly', async () => {
      const store = {
        payment_gateway_provider: 'custom_link',
        payment_gateway_checkout_url: 'https://payment.example.com/checkout'
      };
      const order = {
        order_number: 'TK-67890',
        total_amount: 250000
      };

      const url = await _lib.createPaymentUrl(store, order);

      expect(url).toContain('https://payment.example.com/checkout');
      expect(url).toContain('order_id=TK-67890');
      expect(url).toContain('amount=250000');
    });

    test('should return empty string for manual payment', async () => {
      const store = {
        payment_gateway_provider: 'manual'
      };
      const order = {
        order_number: 'TK-11111',
        total_amount: 100000
      };

      const url = await _lib.createPaymentUrl(store, order);

      expect(url).toBe('');
    });

    test('should handle missing pakasir slug gracefully', async () => {
      const store = {
        payment_gateway_provider: 'pakasir',
        pakasir_slug: ''
      };
      const order = {
        order_number: 'TK-22222',
        total_amount: 100000
      };

      const url = await _lib.createPaymentUrl(store, order);

      expect(url).toBe('');
    });

    test('should round decimal amounts to integer', async () => {
      const store = {
        payment_gateway_provider: 'pakasir',
        pakasir_slug: 'test-store'
      };
      const order = {
        order_number: 'TK-33333',
        total_amount: 150000.75
      };

      const url = await _lib.createPaymentUrl(store, order);

      expect(url).toBe('https://app.pakasir.com/pay/test-store/150001?order_id=TK-33333');
    });
  });

  describe('normalizePhone', () => {
    test('should remove all non-digit characters', () => {
      expect(_lib.normalizePhone('62-812-3456-7890')).toBe('6281234567890');
      expect(_lib.normalizePhone('+62 812 3456 7890')).toBe('6281234567890');
      expect(_lib.normalizePhone('(081) 2345-6789')).toBe('08123456789');
    });

    test('should handle empty or null input', () => {
      expect(_lib.normalizePhone('')).toBe('');
      expect(_lib.normalizePhone(null)).toBe('');
      expect(_lib.normalizePhone(undefined)).toBe('');
    });

    test('should handle numeric input', () => {
      expect(_lib.normalizePhone(628123456789)).toBe('628123456789');
    });

    test('should handle phone numbers with parentheses and dashes', () => {
      expect(_lib.normalizePhone('+1 (555) 123-4567')).toBe('15551234567');
    });
  });
});

describe('Webhook Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyMidtrans', () => {
    test('should return false when server key is missing', () => {
      const originalKey = process.env.MIDTRANS_SERVER_KEY;
      delete process.env.MIDTRANS_SERVER_KEY;

      const body = {
        order_id: 'TK-12345',
        status_code: '200',
        gross_amount: '150000.00',
        signature_key: 'invalid'
      };

      const result = _lib.verifyMidtrans(body);
      expect(result).toBe(false);

      // Restore
      if (originalKey) {
        process.env.MIDTRANS_SERVER_KEY = originalKey;
      }
    });

    test('should verify signature with correct server key', () => {
      process.env.MIDTRANS_SERVER_KEY = 'test-server-key';

      // Create expected signature
      const orderId = 'TK-12345';
      const statusCode = '200';
      const grossAmount = '150000.00';
      const source = `${orderId}${statusCode}${grossAmount}test-server-key`;
      const expectedSignature = crypto.createHash('sha512').update(source).digest('hex');

      const body = {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: expectedSignature
      };

      const result = _lib.verifyMidtrans(body);
      expect(result).toBe(true);
    });

    test('should reject invalid signature', () => {
      process.env.MIDTRANS_SERVER_KEY = 'test-server-key';

      const body = {
        order_id: 'TK-12345',
        status_code: '200',
        gross_amount: '150000.00',
        signature_key: 'invalid-signature-here'
      };

      const result = _lib.verifyMidtrans(body);
      expect(result).toBe(false);
    });
  });

  describe('isMidtransPaid', () => {
    test('should return true for settlement status', () => {
      const body = { transaction_status: 'settlement' };
      expect(_lib.isMidtransPaid(body)).toBe(true);
    });

    test('should return true for capture with accept fraud status', () => {
      const body = {
        transaction_status: 'capture',
        fraud_status: 'accept'
      };
      expect(_lib.isMidtransPaid(body)).toBe(true);
    });

    test('should return false for capture with challenge fraud status', () => {
      const body = {
        transaction_status: 'capture',
        fraud_status: 'challenge'
      };
      expect(_lib.isMidtransPaid(body)).toBe(false);
    });

    test('should return false for capture with deny fraud status', () => {
      const body = {
        transaction_status: 'capture',
        fraud_status: 'deny'
      };
      expect(_lib.isMidtransPaid(body)).toBe(false);
    });

    test('should return false for pending status', () => {
      const body = { transaction_status: 'pending' };
      expect(_lib.isMidtransPaid(body)).toBe(false);
    });

    test('should return false for deny status', () => {
      const body = { transaction_status: 'deny' };
      expect(_lib.isMidtransPaid(body)).toBe(false);
    });

    test('should return false for cancel status', () => {
      const body = { transaction_status: 'cancel' };
      expect(_lib.isMidtransPaid(body)).toBe(false);
    });

    test('should return false for expire status', () => {
      const body = { transaction_status: 'expire' };
      expect(_lib.isMidtransPaid(body)).toBe(false);
    });
  });

  describe('verifyXendit', () => {
    test('should verify with callback token', () => {
      process.env.XENDIT_WEBHOOK_TOKEN = 'test-webhook-token';

      const req = {
        headers: {
          'x-callback-token': 'test-webhook-token'
        }
      };
      const rawBody = '{"external_id":"TK-12345"}';

      const result = _lib.verifyXendit(req, rawBody);
      expect(result).toBe(true);
    });

    test('should reject invalid callback token', () => {
      process.env.XENDIT_WEBHOOK_TOKEN = 'correct-token';

      const req = {
        headers: {
          'x-callback-token': 'wrong-token'
        }
      };
      const rawBody = '{"external_id":"TK-12345"}';

      const result = _lib.verifyXendit(req, rawBody);
      expect(result).toBe(false);
    });

    test('should return false when no verification method available', () => {
      delete process.env.XENDIT_WEBHOOK_TOKEN;
      delete process.env.XENDIT_WEBHOOK_SECRET;

      const req = { headers: {} };
      const rawBody = '{"external_id":"TK-12345"}';

      const result = _lib.verifyXendit(req, rawBody);
      expect(result).toBe(false);
    });
  });
});

describe('Request Helpers', () => {
  describe('json', () => {
    test('should set correct status code and content type', () => {
      const mockRes = {
        statusCode: 0,
        setHeader: jest.fn(),
        end: jest.fn()
      };

      _lib.json(mockRes, 200, { success: true });

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify({ success: true }));
    });

    test('should handle error responses', () => {
      const mockRes = {
        statusCode: 0,
        setHeader: jest.fn(),
        end: jest.fn()
      };

      _lib.json(mockRes, 404, { error: 'Not found' });

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Not found' }));
    });

    test('should handle null body', () => {
      const mockRes = {
        statusCode: 0,
        setHeader: jest.fn(),
        end: jest.fn()
      };

      _lib.json(mockRes, 204, null);

      expect(mockRes.statusCode).toBe(204);
      expect(mockRes.end).toHaveBeenCalledWith('null');
    });
  });

  describe('readBody', () => {
    test('should parse JSON body', async () => {
      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler('{"key":"value"}');
          }
          if (event === 'end') {
            handler();
          }
        })
      };

      const body = await _lib.readBody(mockReq);
      expect(body).toEqual({ key: 'value' });
    });

    test('should parse URL encoded body', async () => {
      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler('key1=value1&key2=value2');
          }
          if (event === 'end') {
            handler();
          }
        })
      };

      const body = await _lib.readBody(mockReq);
      expect(body).toEqual({ key1: 'value1', key2: 'value2' });
    });

    test('should return empty object for empty body', async () => {
      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'end') {
            handler();
          }
        })
      };

      const body = await _lib.readBody(mockReq);
      expect(body).toEqual({});
    });

    test('should handle malformed JSON gracefully', async () => {
      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler('{invalid json');
          }
          if (event === 'end') {
            handler();
          }
        })
      };

      const body = await _lib.readBody(mockReq);
      // Should fall back to URL params parsing, which returns empty for invalid input
      expect(body).toBeDefined();
    });
  });

  describe('readRawBody', () => {
    test('should reject body larger than 1MB', async () => {
      const largeData = 'x'.repeat(1024 * 1024 + 1);
      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler(largeData);
          }
        }),
        destroy: jest.fn()
      };

      await expect(_lib.readBody(mockReq)).rejects.toThrow('Request body too large');
      expect(mockReq.destroy).toHaveBeenCalled();
    });
  });
});

describe('Input Validation and Edge Cases', () => {
  describe('Order number validation', () => {
    test('should handle various order number formats in URLs', () => {
      const orderNumbers = ['TK-12345', 'TK-00001', 'TK-99999', 'ORDER-123', 'INV-2024-001'];

      orderNumbers.forEach((orderNumber) => {
        const encoded = encodeURIComponent(orderNumber);
        expect(encoded).toBeTruthy();
        expect(decodeURIComponent(encoded)).toBe(orderNumber);
      });
    });

    test('should handle special characters in order numbers', () => {
      const specialOrders = ['TK 12345', 'TK/12345', 'TK&12345', 'TK#12345'];

      specialOrders.forEach((orderNumber) => {
        const encoded = encodeURIComponent(orderNumber);
        expect(decodeURIComponent(encoded)).toBe(orderNumber);
      });
    });
  });

  describe('Amount validation', () => {
    test('should round decimal amounts correctly', () => {
      const testCases = [
        { input: 150000, expected: 150000 },
        { input: 150000.5, expected: 150001 },
        { input: 150000.49, expected: 150000 },
        { input: '150000', expected: 150000 },
        { input: '150000.99', expected: 150001 }
      ];

      testCases.forEach(({ input, expected }) => {
        const rounded = Math.round(Number(input));
        expect(rounded).toBe(expected);
      });
    });

    test('should handle edge case amounts', () => {
      expect(Math.round(Number(0))).toBe(0);
      expect(Math.round(Number(0.5))).toBe(1);
      expect(Math.round(Number(-100))).toBe(-100);
      expect(Math.round(Number(Infinity))).toBe(Infinity);
    });
  });
});
