const { json, readRawBody, markOrderPaid, verifyXendit } = require('./_lib');

function parseJson(raw) {
  try {
    return JSON.parse(raw || '{}');
  } catch (_error) {
    return {};
  }
}

function getOrderNumber(body) {
  return body.external_id
    || body.reference_id
    || body.data?.external_id
    || body.data?.reference_id
    || body.payment_request_id
    || '';
}

function isPaid(body) {
  const status = String(body.status || body.data?.status || '').toUpperCase();
  return status === 'PAID' || status === 'SETTLED' || status === 'SUCCEEDED';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const raw = await readRawBody(req);
    if (!verifyXendit(req, raw)) return json(res, 401, { error: 'Invalid Xendit webhook signature.' });

    const body = parseJson(raw);
    const orderNumber = getOrderNumber(body);
    if (!orderNumber) return json(res, 400, { error: 'Order number not found in Xendit payload.' });

    if (!isPaid(body)) {
      return json(res, 200, { ok: true, ignored: true, status: body.status || body.data?.status || null });
    }

    const result = await markOrderPaid(orderNumber, body, 'xendit');
    return json(res, 200, { ok: true, ...result });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Xendit webhook failed.' });
  }
};
