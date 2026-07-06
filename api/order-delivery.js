const { json, getOrderDelivery } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    const orderNumber = url.searchParams.get('order_number') || url.searchParams.get('orderNumber');
    const whatsapp = url.searchParams.get('whatsapp') || url.searchParams.get('buyer_whatsapp') || '';

    if (!orderNumber) {
      return json(res, 400, { error: 'order_number wajib diisi.' });
    }

    const result = await getOrderDelivery(orderNumber, whatsapp);
    return json(res, 200, { ok: true, ...result });
  } catch (error) {
    const status = /tidak ditemukan|tidak cocok/i.test(error.message || '') ? 404 : 500;
    return json(res, status, { ok: false, error: error.message || 'Gagal memuat delivery order.' });
  }
};
