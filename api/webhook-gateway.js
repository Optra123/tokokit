const { json, readBody, markOrderPaid } = require('./_lib');

function isPaidStatus(value) {
  const status = String(value || '').toLowerCase();
  return ['paid', 'settlement', 'settled', 'success', 'succeeded', 'completed', 'capture'].includes(status);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const secret = process.env.TOKOKIT_GATEWAY_WEBHOOK_SECRET;
    if (!secret) {
      return json(res, 501, { error: 'TOKOKIT_GATEWAY_WEBHOOK_SECRET belum diset.' });
    }

    const received = req.headers['x-tokokit-secret'] || req.headers['x-webhook-secret'];
    if (received !== secret) {
      return json(res, 401, { error: 'Invalid gateway webhook secret.' });
    }

    const body = await readBody(req);
    const orderNumber = body.order_number || body.order_id || body.reference || body.external_id;
    const status = body.status || body.payment_status || body.transaction_status;
    if (!orderNumber) {
      return json(res, 400, { error: 'order_number/order_id wajib ada.' });
    }

    if (!isPaidStatus(status)) {
      return json(res, 200, { ok: true, ignored: true, status: status || null });
    }

    const result = await markOrderPaid(orderNumber, body, body.provider || 'gateway');
    return json(res, 200, { ok: true, ...result });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Gateway webhook failed.' });
  }
};
