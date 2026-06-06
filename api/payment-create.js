const { json, readBody, findOrder, findStore, createPaymentUrl, updatePaymentLink } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = await readBody(req);
    const orderNumber = body.order_number || body.orderNumber;
    if (!orderNumber) return json(res, 400, { error: 'order_number wajib diisi.' });

    const order = await findOrder(orderNumber);
    if (!order) return json(res, 404, { error: 'Order tidak ditemukan.' });

    const store = await findStore(order.store_id);
    if (!store) return json(res, 404, { error: 'Store tidak ditemukan.' });

    const checkoutUrl = await createPaymentUrl(store, order);
    const payment = checkoutUrl ? await updatePaymentLink(order, store, checkoutUrl) : null;

    return json(res, 200, {
      ok: true,
      provider: store.payment_gateway_provider || 'manual',
      checkout_url: checkoutUrl,
      payment
    });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Gagal membuat payment link.' });
  }
};
