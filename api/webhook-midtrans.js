const { json, readBody, markOrderPaid, verifyMidtrans, isMidtransPaid } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = await readBody(req);
    if (!verifyMidtrans(body)) return json(res, 401, { error: 'Invalid Midtrans signature.' });

    if (!isMidtransPaid(body)) {
      return json(res, 200, {
        ok: true,
        ignored: true,
        transaction_status: body.transaction_status || null
      });
    }

    const result = await markOrderPaid(body.order_id, body, 'midtrans');
    return json(res, 200, { ok: true, ...result });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Midtrans webhook failed.' });
  }
};
