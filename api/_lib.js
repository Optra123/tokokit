const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.TOKOKIT_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

async function readBody(req) {
  const raw = await readRawBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

async function supabase(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.');
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.error || text || `Supabase request failed: ${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function findOrder(orderNumber) {
  const orders = await supabase(`orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=*`);
  return orders?.[0] || null;
}

async function findStore(storeId) {
  const stores = await supabase(`stores?id=eq.${encodeURIComponent(storeId)}&select=*`);
  return stores?.[0] || null;
}

async function findPayment(orderId) {
  const payments = await supabase(`payments?order_id=eq.${encodeURIComponent(orderId)}&select=*`);
  return payments?.[0] || null;
}

async function createPaymentUrl(store, order) {
  const provider = store.payment_gateway_provider || 'manual';
  const amount = Math.round(Number(order.total_amount || 0));
  const orderId = order.order_number;

  if (provider === 'pakasir') {
    const slug = store.pakasir_slug || store.payment_gateway_project_id;
    if (!slug) return '';
    return `https://app.pakasir.com/pay/${encodeURIComponent(slug)}/${amount}?order_id=${encodeURIComponent(orderId)}`;
  }

  if (provider === 'custom_link') {
    if (!store.payment_gateway_checkout_url) return '';
    const url = new URL(store.payment_gateway_checkout_url);
    url.searchParams.set('order_id', orderId);
    url.searchParams.set('amount', String(amount));
    return url.toString();
  }

  if (provider === 'xendit') {
    return createXenditInvoice(order, store, amount);
  }

  if (provider === 'midtrans') {
    return createMidtransPaymentLink(order, store, amount);
  }

  return '';
}

async function createXenditInvoice(order, store, amount) {
  if (!process.env.XENDIT_SECRET_KEY) return '';
  const response = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      external_id: order.order_number,
      amount,
      description: `${store.name || 'TokoKit'} - ${order.order_number}`,
      invoice_duration: 86400,
      customer: {
        given_names: order.buyer_name || 'Buyer',
        email: order.buyer_email || undefined,
        mobile_number: order.buyer_whatsapp || undefined
      },
      success_redirect_url: process.env.PUBLIC_SITE_URL ? `${process.env.PUBLIC_SITE_URL}/success/${order.order_number}` : undefined
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Gagal membuat invoice Xendit.');
  return data.invoice_url || '';
}

async function createMidtransPaymentLink(order, store, amount) {
  if (!process.env.MIDTRANS_SERVER_KEY) return '';
  const baseUrl = process.env.MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com';
  const response = await fetch(`${baseUrl}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.MIDTRANS_SERVER_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: order.order_number,
        gross_amount: amount
      },
      customer_details: {
        first_name: order.buyer_name || 'Buyer',
        email: order.buyer_email || undefined,
        phone: order.buyer_whatsapp || undefined
      },
      callbacks: {
        finish: process.env.PUBLIC_SITE_URL ? `${process.env.PUBLIC_SITE_URL}/success/${order.order_number}` : undefined
      }
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_messages?.join(' ') || 'Gagal membuat transaksi Midtrans.');
  return data.redirect_url || '';
}

async function updatePaymentLink(order, store, checkoutUrl) {
  const payment = await findPayment(order.id);
  if (!payment) return null;
  const updated = await supabase(`payments?id=eq.${encodeURIComponent(payment.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      gateway_provider: store.payment_gateway_provider || 'manual',
      gateway_reference: order.order_number,
      checkout_url: checkoutUrl,
      updated_at: new Date().toISOString()
    })
  });
  return updated?.[0] || null;
}

async function markOrderPaid(orderNumber, rawPayload = {}, provider = 'gateway') {
  const order = await findOrder(orderNumber);
  if (!order) throw new Error(`Order ${orderNumber} not found.`);

  const now = new Date().toISOString();
  const payment = await findPayment(order.id);
  if (payment) {
    await supabase(`payments?id=eq.${encodeURIComponent(payment.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'paid',
        paid_at: now,
        raw_payload: rawPayload,
        gateway_provider: provider || payment.gateway_provider || 'gateway',
        updated_at: now
      })
    });
  }

  await supabase(`orders?id=eq.${encodeURIComponent(order.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ payment_status: 'paid', order_status: 'processing', updated_at: now })
  });

  await reserveDigitalInventory(order, provider);
  const delivery = await deliverDigitalInventory(order, provider);
  return { order_number: order.order_number, status: 'paid', digital_delivered: delivery.delivered || 0 };
}

async function reserveDigitalInventory(order, provider) {
  const items = await supabase(`order_items?order_id=eq.${encodeURIComponent(order.id)}&select=*`);
  const digitalItems = items.filter((item) => item.fulfillment_type === 'digital');

  for (const orderItem of digitalItems) {
    const existing = await supabase(`inventory_items?order_id=eq.${encodeURIComponent(order.id)}&product_id=eq.${encodeURIComponent(orderItem.product_id)}&select=id`);
    const needed = Number(orderItem.quantity || 1) - (existing?.length || 0);
    if (needed <= 0) continue;

    const available = await supabase(`inventory_items?product_id=eq.${encodeURIComponent(orderItem.product_id)}&status=eq.available&order_id=is.null&select=*&limit=${needed}`);
    if ((available?.length || 0) < needed) {
      await createFulfillmentLog(order, null, 'inventory_shortage', 'failed', `Stok digital ${orderItem.product_name} kurang untuk order paid.`);
      continue;
    }

    for (const inventoryItem of available) {
      await supabase(`inventory_items?id=eq.${encodeURIComponent(inventoryItem.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'reserved',
          order_id: order.id,
          buyer_email: order.buyer_email || '',
          updated_at: new Date().toISOString()
        })
      });
      await createFulfillmentLog(order, inventoryItem.id, 'inventory_reserved', 'reserved', `Reserved by ${provider} webhook.`);
    }

    await supabase('stock_movements', {
      method: 'POST',
      body: JSON.stringify({
        tenant_id: order.tenant_id,
        store_id: order.store_id,
        product_id: orderItem.product_id,
        order_id: order.id,
        movement_type: 'payment_paid',
        quantity_delta: -needed,
        note: `Auto reserve setelah payment paid (${provider})`
      })
    });

    const remaining = await supabase(`inventory_items?product_id=eq.${encodeURIComponent(orderItem.product_id)}&status=eq.available&select=id`);
    await supabase(`products?id=eq.${encodeURIComponent(orderItem.product_id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: remaining?.length || 0, updated_at: new Date().toISOString() })
    });
  }
}

async function createFulfillmentLog(order, inventoryItemId, action, status, message) {
  await supabase('fulfillment_logs', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: order.tenant_id,
      store_id: order.store_id,
      order_id: order.id,
      inventory_item_id: inventoryItemId,
      action,
      status,
      message
    })
  });
}

function shouldAutoDeliverProduct(product) {
  if (!product) return false;
  const isDigital = product.fulfillment_type === 'digital' || product.product_type === 'digital';
  if (!isDigital) return false;
  if (product.digital_delivery_enabled === true) return true;
  if (product.digital_delivery_enabled === false) return false;
  return product.product_type === 'digital';
}

function buildDeliveryText(order, store, deliveries) {
  const lines = deliveries.map((item) => {
    const header = [item.product_name, item.label].filter(Boolean).join(' - ');
    const body = item.message ? `${item.message}\n` : '';
    return `${header}\n${body}${item.payload}`.trim();
  });
  return [
    `Halo ${order.buyer_name || 'Pembeli'},`,
    '',
    `Pesanan ${order.order_number} dari ${store?.name || 'toko'} sudah dibayar.`,
    'Berikut detail produk digital kamu:',
    '',
    lines.join('\n\n---\n\n'),
    '',
    'Terima kasih sudah berbelanja.'
  ].join('\n');
}

function buildDeliveryHtml(order, store, deliveries) {
  const blocks = deliveries.map((item) => `
    <div style="margin:16px 0;padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc">
      <div style="font-weight:700;margin-bottom:6px">${item.product_name || 'Produk digital'}${item.label ? ` - ${item.label}` : ''}</div>
      ${item.message ? `<p style="margin:0 0 8px;color:#475569">${item.message}</p>` : ''}
      <pre style="margin:0;white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:13px">${item.payload || ''}</pre>
    </div>
  `).join('');
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:640px">
      <h2 style="margin:0 0 8px">Pesanan digital kamu sudah siap</h2>
      <p style="color:#475569">Halo ${order.buyer_name || 'Pembeli'}, pesanan <b>${order.order_number}</b> dari <b>${store?.name || 'toko'}</b> sudah dibayar.</p>
      ${blocks}
      <p style="color:#64748b;font-size:13px">Email ini dikirim otomatis oleh TokoKit.</p>
    </div>
  `;
}

async function trySendDeliveryEmail(order, store, deliveries) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'TokoKit <onboarding@resend.dev>';
  if (!order.buyer_email) {
    await createFulfillmentLog(order, null, 'email_skipped', 'pending', 'Buyer tidak punya email, produk digital tersedia di halaman sukses.');
    return false;
  }
  if (!apiKey) {
    await createFulfillmentLog(order, null, 'email_skipped', 'pending', 'RESEND_API_KEY belum diset. Produk digital tetap tersedia di halaman sukses.');
    return false;
  }
  const subject = deliveries[0]?.subject || `Pesanan digital ${order.order_number}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [order.buyer_email],
      subject,
      html: buildDeliveryHtml(order, store, deliveries),
      text: buildDeliveryText(order, store, deliveries)
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    await createFulfillmentLog(order, null, 'email_failed', 'failed', data.message || 'Gagal mengirim email delivery.');
    return false;
  }
  await createFulfillmentLog(order, null, 'email_sent', 'delivered', `Email delivery terkirim ke ${order.buyer_email}.`);
  return true;
}

async function deliverDigitalInventory(order, provider) {
  const items = await supabase(`order_items?order_id=eq.${encodeURIComponent(order.id)}&select=*`);
  const digitalItems = (items || []).filter((item) => item.fulfillment_type === 'digital');
  if (!digitalItems.length) return { delivered: 0, deliveries: [] };

  const store = await findStore(order.store_id);
  const now = new Date().toISOString();
  const deliveries = [];

  for (const orderItem of digitalItems) {
    const productRows = await supabase(`products?id=eq.${encodeURIComponent(orderItem.product_id)}&select=*`);
    const product = productRows?.[0];
    if (!shouldAutoDeliverProduct(product)) continue;

    const reserved = await supabase(
      `inventory_items?order_id=eq.${encodeURIComponent(order.id)}&product_id=eq.${encodeURIComponent(orderItem.product_id)}&status=eq.reserved&select=*`
    );
    for (const inventoryItem of reserved || []) {
      await supabase(`inventory_items?id=eq.${encodeURIComponent(inventoryItem.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'delivered', delivered_at: now, updated_at: now })
      });
      await createFulfillmentLog(order, inventoryItem.id, 'digital_delivered', 'delivered', `Auto-kirim digital via ${provider}: ${inventoryItem.label}`);
      deliveries.push({
        product_id: orderItem.product_id,
        product_name: orderItem.product_name,
        label: inventoryItem.label,
        payload: inventoryItem.payload,
        message: product?.delivery_message || '',
        subject: product?.delivery_subject || `Pesanan digital ${order.order_number}`
      });
    }
  }

  if (deliveries.length) {
    await trySendDeliveryEmail(order, store, deliveries);
    await supabase(`orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        digital_delivery_snapshot: deliveries,
        digital_delivered_at: now,
        order_status: 'completed',
        updated_at: now
      })
    });
  }

  return { delivered: deliveries.length, deliveries };
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

async function getOrderDelivery(orderNumber, buyerWhatsapp) {
  const order = await findOrder(orderNumber);
  if (!order) throw new Error('Pesanan tidak ditemukan.');

  const expected = normalizePhone(buyerWhatsapp);
  const actual = normalizePhone(order.buyer_whatsapp);
  if (expected && actual && expected !== actual) {
    throw new Error('Nomor WhatsApp tidak cocok dengan pesanan ini.');
  }

  let deliveries = order.digital_delivery_snapshot || [];
  if (order.payment_status === 'paid' && !deliveries.length) {
    const deliveredItems = await supabase(
      `inventory_items?order_id=eq.${encodeURIComponent(order.id)}&status=eq.delivered&select=label,payload,product_id`
    );
    if (deliveredItems?.length) {
      const items = await supabase(`order_items?order_id=eq.${encodeURIComponent(order.id)}&select=product_id,product_name`);
      deliveries = (deliveredItems || []).map((item) => ({
        product_id: item.product_id,
        product_name: items?.find((row) => row.product_id === item.product_id)?.product_name || 'Produk digital',
        label: item.label,
        payload: item.payload
      }));
    }
  }

  return {
    order: {
      order_number: order.order_number,
      buyer_name: order.buyer_name,
      buyer_whatsapp: order.buyer_whatsapp,
      buyer_email: order.buyer_email,
      total_amount: order.total_amount,
      payment_status: order.payment_status,
      order_status: order.order_status,
      digital_delivered_at: order.digital_delivered_at || null
    },
    deliveries: order.payment_status === 'paid' ? deliveries : []
  };
}

function verifyMidtrans(body) {
  if (!process.env.MIDTRANS_SERVER_KEY) return false;
  const source = `${body.order_id}${body.status_code}${body.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`;
  const signature = crypto.createHash('sha512').update(source).digest('hex');
  return signature === body.signature_key;
}

function isMidtransPaid(body) {
  return body.transaction_status === 'settlement' || (body.transaction_status === 'capture' && body.fraud_status === 'accept');
}

function verifyXendit(req, rawBody) {
  const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
  const callbackToken = req.headers['x-callback-token'];
  if (webhookToken && callbackToken) return callbackToken === webhookToken;

  const secret = process.env.XENDIT_WEBHOOK_SECRET;
  const signature = req.headers['x-callback-signature'];
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (Buffer.byteLength(hmac) !== Buffer.byteLength(signature)) return false;
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

module.exports = {
  json,
  readRawBody,
  readBody,
  supabase,
  findOrder,
  findStore,
  createPaymentUrl,
  updatePaymentLink,
  markOrderPaid,
  deliverDigitalInventory,
  getOrderDelivery,
  normalizePhone,
  verifyMidtrans,
  isMidtransPaid,
  verifyXendit
};
