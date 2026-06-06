/**
 * TokoKit Backend v1
 * Google Apps Script Web App + Google Sheets Database
 *
 * Cara pakai:
 * 1. Buat Google Sheet baru.
 * 2. Extensions -> Apps Script.
 * 3. Paste file ini ke Code.gs.
 * 4. Jalankan setupDatabase().
 * 5. Deploy -> New deployment -> Web app.
 * 6. Gunakan URL deployment sebagai API endpoint.
 */

const CONFIG = {
  DEFAULT_TENANT_ID: 'tenant_demo_001',
  DEFAULT_STORE_ID: 'store_demo_001',
  SPREADSHEET_ID: '' // Kosongkan jika script bound ke Google Sheet. Isi ID jika standalone.
};

function doGet(e) {
  return handleRequest_('GET', e);
}

function doPost(e) {
  return handleRequest_('POST', e);
}

function handleRequest_(method, e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || '';
    let payload = {};

    if (method === 'GET') {
      payload = params;
    } else {
      payload = parsePostPayload_(e);
    }

    const result = routeRequest(method, action, payload);
    return jsonResponse_(result);
  } catch (error) {
    return jsonResponse_(errorResponse(error.message || 'Server error', 500));
  }
}

function parsePostPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return {};
  }
}

function routeRequest(method, action, payload) {
  switch (action) {
    case 'health':
      return successResponse({ ok: true, time: nowIso() }, 'TokoKit API is running');

    case 'getStore':
      return successResponse(getStore(payload), 'Store loaded');

    case 'updateStore':
      return successResponse(updateStore(payload), 'Store updated');

    case 'listProducts':
      return successResponse(listProducts(payload), 'Products loaded');

    case 'createProduct':
      return successResponse(createProduct(payload), 'Product created');

    case 'updateProduct':
      return successResponse(updateProduct(payload), 'Product updated');

    case 'listOrders':
      return successResponse(listOrders(payload), 'Orders loaded');

    case 'createOrder':
      return successResponse(createOrder(payload), 'Order created');

    case 'updatePaymentStatus':
      return successResponse(updatePaymentStatus(payload), 'Payment status updated');

    case 'updateOrderStatus':
      return successResponse(updateOrderStatus(payload), 'Order status updated');

    default:
      return errorResponse('Unknown action: ' + action, 404);
  }
}

function successResponse(data, message) {
  return {
    success: true,
    message: message || 'Success',
    data: data || null,
    timestamp: nowIso()
  };
}

function errorResponse(message, code) {
  return {
    success: false,
    message: message || 'Error',
    code: code || 400,
    data: null,
    timestamp: nowIso()
  };
}

function jsonResponse_(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}

function nowIso() {
  return new Date().toISOString();
}

function getDatabase_() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(sheetName) {
  const ss = getDatabase_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  return sheet;
}

function getHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
}

function readRows(sheetName) {
  const sheet = getSheet(sheetName);
  const headers = getHeaders_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function(row, index) {
    const object = { _rowNumber: index + 2 };
    headers.forEach(function(header, i) {
      object[header] = row[i];
    });
    return object;
  });
}

function appendRow(sheetName, object) {
  const sheet = getSheet(sheetName);
  const headers = getHeaders_(sheet);
  const row = headers.map(function(header) {
    return object[header] !== undefined ? object[header] : '';
  });
  sheet.appendRow(row);
  return object;
}

function findRows(sheetName, filters) {
  const rows = readRows(sheetName);
  filters = filters || {};

  return rows.filter(function(row) {
    return Object.keys(filters).every(function(key) {
      return String(row[key]) === String(filters[key]);
    });
  });
}

function updateRowById(sheetName, idField, idValue, updates) {
  const sheet = getSheet(sheetName);
  const headers = getHeaders_(sheet);
  const rows = readRows(sheetName);
  const found = rows.find(function(row) {
    return String(row[idField]) === String(idValue);
  });

  if (!found) throw new Error(sheetName + ' record not found: ' + idValue);

  const next = Object.assign({}, found, updates, { updated_at: nowIso() });
  delete next._rowNumber;

  const values = headers.map(function(header) {
    return next[header] !== undefined ? next[header] : '';
  });

  sheet.getRange(found._rowNumber, 1, 1, headers.length).setValues([values]);
  return next;
}

function generateId(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').substring(0, 14);
}

function generateOrderNumber_() {
  const key = 'order_number';
  const sheet = getSheet('Counters');
  const rows = readRows('Counters');
  const row = rows.find(function(item) { return item.counter_key === key; });
  let nextValue = 1;

  if (row) {
    nextValue = Number(row.current_value || 0) + 1;
    updateRowById('Counters', 'counter_key', key, {
      counter_key: key,
      current_value: nextValue,
      updated_at: nowIso()
    });
  } else {
    appendRow('Counters', {
      counter_key: key,
      current_value: nextValue,
      updated_at: nowIso()
    });
  }

  return 'TK-' + String(nextValue).padStart(4, '0');
}

function getTenantId_(payload) {
  return payload.tenant_id || CONFIG.DEFAULT_TENANT_ID;
}

function getStoreId_(payload) {
  return payload.store_id || CONFIG.DEFAULT_STORE_ID;
}

function getStore(payload) {
  const tenantId = getTenantId_(payload || {});
  const storeId = getStoreId_(payload || {});
  const rows = findRows('Stores', { tenant_id: tenantId, store_id: storeId });
  return rows[0] || null;
}

function updateStore(payload) {
  payload = payload || {};
  const tenantId = getTenantId_(payload);
  const storeId = getStoreId_(payload);
  const existing = getStore({ tenant_id: tenantId, store_id: storeId });
  const now = nowIso();

  const record = {
    store_id: storeId,
    tenant_id: tenantId,
    store_slug: payload.store_slug || payload.slug || 'senja-kopi',
    store_name: payload.store_name || payload.name || 'Toko Senja Kopi',
    store_description: payload.store_description || payload.description || '',
    logo_url: payload.logo_url || '',
    banner_url: payload.banner_url || '',
    brand_color: payload.brand_color || '#2563eb',
    whatsapp_number: payload.whatsapp_number || payload.whatsapp || '',
    email: payload.email || '',
    address: payload.address || '',
    payment_instruction: payload.payment_instruction || '',
    qris_image_url: payload.qris_image_url || '',
    is_active: payload.is_active !== undefined ? payload.is_active : true,
    updated_at: now
  };

  if (existing) {
    return updateRowById('Stores', 'store_id', storeId, record);
  }

  record.created_at = now;
  return appendRow('Stores', record);
}

function listProducts(payload) {
  payload = payload || {};
  const tenantId = getTenantId_(payload);
  const storeId = getStoreId_(payload);
  let rows = findRows('Products', { tenant_id: tenantId, store_id: storeId });

  if (payload.status) {
    rows = rows.filter(function(row) { return String(row.status).toLowerCase() === String(payload.status).toLowerCase(); });
  }

  return rows;
}

function createProduct(payload) {
  payload = payload || {};
  validateRequired_(payload, ['name', 'price']);
  const now = nowIso();

  const record = {
    product_id: generateId('prd'),
    tenant_id: getTenantId_(payload),
    store_id: getStoreId_(payload),
    category_id: payload.category_id || '',
    name: payload.name,
    slug: slugify_(payload.slug || payload.name),
    description: payload.description || '',
    price: Number(payload.price || 0),
    compare_at_price: Number(payload.compare_at_price || 0),
    stock: Number(payload.stock || 0),
    sku: payload.sku || '',
    product_type: payload.product_type || 'physical',
    is_preorder: payload.is_preorder || false,
    preorder_note: payload.preorder_note || '',
    status: payload.status || 'active',
    created_at: now,
    updated_at: now
  };

  appendRow('Products', record);
  logAudit_(record.tenant_id, 'createProduct', 'Products', record.product_id, null, record);
  return record;
}

function updateProduct(payload) {
  payload = payload || {};
  validateRequired_(payload, ['product_id']);
  const before = findRows('Products', { product_id: payload.product_id })[0] || null;
  const updates = Object.assign({}, payload);
  delete updates.product_id;
  const after = updateRowById('Products', 'product_id', payload.product_id, updates);
  logAudit_(after.tenant_id, 'updateProduct', 'Products', payload.product_id, before, after);
  return after;
}

function listOrders(payload) {
  payload = payload || {};
  const tenantId = getTenantId_(payload);
  const storeId = getStoreId_(payload);
  let rows = findRows('Orders', { tenant_id: tenantId, store_id: storeId });

  if (payload.payment_status) {
    rows = rows.filter(function(row) { return row.payment_status === payload.payment_status; });
  }
  if (payload.order_status) {
    rows = rows.filter(function(row) { return row.order_status === payload.order_status; });
  }

  return rows;
}

function createOrder(payload) {
  payload = payload || {};
  validateRequired_(payload, ['buyer_name', 'buyer_whatsapp', 'items']);

  const tenantId = getTenantId_(payload);
  const storeId = getStoreId_(payload);
  const now = nowIso();
  const items = payload.items || [];
  const subtotal = items.reduce(function(sum, item) {
    return sum + Number(item.unit_price || item.price || 0) * Number(item.quantity || 1);
  }, 0);
  const shippingFee = Number(payload.shipping_fee || 0);
  const discountAmount = Number(payload.discount_amount || 0);
  const totalAmount = subtotal + shippingFee - discountAmount;

  const customer = createOrFindCustomer_({
    tenant_id: tenantId,
    store_id: storeId,
    name: payload.buyer_name,
    whatsapp_number: payload.buyer_whatsapp,
    email: payload.buyer_email || '',
    address: payload.buyer_address || ''
  });

  const order = {
    order_id: generateId('ord'),
    tenant_id: tenantId,
    store_id: storeId,
    customer_id: customer.customer_id,
    order_number: generateOrderNumber_(),
    buyer_name: payload.buyer_name,
    buyer_whatsapp: payload.buyer_whatsapp,
    buyer_email: payload.buyer_email || '',
    buyer_address: payload.buyer_address || '',
    subtotal: subtotal,
    discount_amount: discountAmount,
    shipping_fee: shippingFee,
    total_amount: totalAmount,
    payment_method: payload.payment_method || 'manual_transfer',
    payment_status: 'unpaid',
    order_status: 'new',
    notes: payload.notes || '',
    created_at: now,
    updated_at: now
  };

  appendRow('Orders', order);

  items.forEach(function(item) {
    appendRow('OrderItems', {
      order_item_id: generateId('item'),
      tenant_id: tenantId,
      store_id: storeId,
      order_id: order.order_id,
      product_id: item.product_id || '',
      product_name: item.product_name || item.name || '',
      variant_label: item.variant_label || '',
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || item.price || 0),
      total_price: Number(item.unit_price || item.price || 0) * Number(item.quantity || 1),
      created_at: now
    });
  });

  appendRow('Payments', {
    payment_id: generateId('pay'),
    tenant_id: tenantId,
    store_id: storeId,
    order_id: order.order_id,
    payment_gateway: 'manual',
    payment_reference: '',
    payment_url: '',
    amount: totalAmount,
    status: 'unpaid',
    paid_at: '',
    raw_payload: '',
    created_at: now,
    updated_at: now
  });

  logAudit_(tenantId, 'createOrder', 'Orders', order.order_id, null, order);
  return order;
}

function updatePaymentStatus(payload) {
  payload = payload || {};
  validateRequired_(payload, ['order_id', 'payment_status']);

  const order = updateRowById('Orders', 'order_id', payload.order_id, {
    payment_status: payload.payment_status,
    updated_at: nowIso()
  });

  const payments = findRows('Payments', { order_id: payload.order_id });
  if (payments[0]) {
    updateRowById('Payments', 'payment_id', payments[0].payment_id, {
      status: payload.payment_status,
      paid_at: payload.payment_status === 'paid' ? nowIso() : '',
      updated_at: nowIso()
    });
  }

  logAudit_(order.tenant_id, 'updatePaymentStatus', 'Orders', order.order_id, null, order);
  return order;
}

function updateOrderStatus(payload) {
  payload = payload || {};
  validateRequired_(payload, ['order_id', 'order_status']);

  const order = updateRowById('Orders', 'order_id', payload.order_id, {
    order_status: payload.order_status,
    updated_at: nowIso()
  });

  logAudit_(order.tenant_id, 'updateOrderStatus', 'Orders', order.order_id, null, order);
  return order;
}

function createOrFindCustomer_(payload) {
  const existing = findRows('Customers', {
    tenant_id: payload.tenant_id,
    store_id: payload.store_id,
    whatsapp_number: payload.whatsapp_number
  })[0];

  if (existing) return existing;

  const now = nowIso();
  const customer = {
    customer_id: generateId('cus'),
    tenant_id: payload.tenant_id,
    store_id: payload.store_id,
    name: payload.name,
    whatsapp_number: payload.whatsapp_number,
    email: payload.email || '',
    address: payload.address || '',
    created_at: now,
    updated_at: now
  };
  appendRow('Customers', customer);
  return customer;
}

function validateRequired_(object, fields) {
  fields.forEach(function(field) {
    if (object[field] === undefined || object[field] === null || object[field] === '') {
      throw new Error('Missing required field: ' + field);
    }
  });
}

function slugify_(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function logAudit_(tenantId, action, entityType, entityId, before, after) {
  try {
    appendRow('AuditLogs', {
      log_id: generateId('log'),
      tenant_id: tenantId || CONFIG.DEFAULT_TENANT_ID,
      user_id: 'system_demo',
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      before_json: before ? JSON.stringify(before) : '',
      after_json: after ? JSON.stringify(after) : '',
      ip_address: '',
      created_at: nowIso()
    });
  } catch (err) {
    // Audit log must not break main operation.
  }
}

function setupDatabase() {
  const ss = getDatabase_();

  const schemas = {
    Tenants: ['tenant_id','plan','owner_user_id','business_type','status','created_at','updated_at'],
    Users: ['user_id','tenant_id','name','email','password_hash','role','status','last_login_at','created_at','updated_at'],
    Stores: ['store_id','tenant_id','store_slug','store_name','store_description','logo_url','banner_url','brand_color','whatsapp_number','email','address','payment_instruction','qris_image_url','is_active','created_at','updated_at'],
    Categories: ['category_id','tenant_id','store_id','name','slug','sort_order','status','created_at','updated_at'],
    Products: ['product_id','tenant_id','store_id','category_id','name','slug','description','price','compare_at_price','stock','sku','product_type','is_preorder','preorder_note','status','created_at','updated_at'],
    ProductImages: ['image_id','tenant_id','store_id','product_id','image_url','alt_text','sort_order','created_at'],
    Customers: ['customer_id','tenant_id','store_id','name','whatsapp_number','email','address','created_at','updated_at'],
    Orders: ['order_id','tenant_id','store_id','customer_id','order_number','buyer_name','buyer_whatsapp','buyer_email','buyer_address','subtotal','discount_amount','shipping_fee','total_amount','payment_method','payment_status','order_status','notes','created_at','updated_at'],
    OrderItems: ['order_item_id','tenant_id','store_id','order_id','product_id','product_name','variant_label','quantity','unit_price','total_price','created_at'],
    Payments: ['payment_id','tenant_id','store_id','order_id','payment_gateway','payment_reference','payment_url','amount','status','paid_at','raw_payload','created_at','updated_at'],
    Notifications: ['notification_id','tenant_id','store_id','order_id','channel','recipient','subject','message','status','sent_at','created_at'],
    Settings: ['setting_id','tenant_id','store_id','key','value','created_at','updated_at'],
    AuditLogs: ['log_id','tenant_id','user_id','action','entity_type','entity_id','before_json','after_json','ip_address','created_at'],
    WebhookLogs: ['webhook_id','tenant_id','gateway','event_type','signature_status','raw_payload','processed_status','created_at'],
    ApiLogs: ['api_log_id','tenant_id','method','action','request_json','response_json','status_code','created_at'],
    Counters: ['counter_key','current_value','updated_at']
  };

  Object.keys(schemas).forEach(function(sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);

    const headers = schemas[sheetName];
    const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const isEmpty = current.every(function(cell) { return cell === ''; });

    if (isEmpty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8f0fe');
  });

  seedDemoData_();
  SpreadsheetApp.getUi().alert('TokoKit database setup selesai.');
}

function seedDemoData_() {
  const now = nowIso();

  if (readRows('Tenants').length === 0) {
    appendRow('Tenants', {
      tenant_id: CONFIG.DEFAULT_TENANT_ID,
      plan: 'demo',
      owner_user_id: 'user_demo_001',
      business_type: 'Makanan & Minuman',
      status: 'active',
      created_at: now,
      updated_at: now
    });
  }

  if (readRows('Users').length === 0) {
    appendRow('Users', {
      user_id: 'user_demo_001',
      tenant_id: CONFIG.DEFAULT_TENANT_ID,
      name: 'Melona Seller',
      email: 'seller@example.com',
      password_hash: '',
      role: 'owner',
      status: 'active',
      last_login_at: '',
      created_at: now,
      updated_at: now
    });
  }

  if (readRows('Stores').length === 0) {
    updateStore({
      tenant_id: CONFIG.DEFAULT_TENANT_ID,
      store_id: CONFIG.DEFAULT_STORE_ID,
      store_slug: 'senja-kopi',
      store_name: 'Toko Senja Kopi',
      store_description: 'Kopi susu, biji kopi pilihan, dan alat seduh untuk pengalaman ngopi harian.',
      whatsapp_number: '6281234567890',
      email: 'halo@senjakopi.id',
      address: 'Jl. Kenangan Indah No. 12, Jakarta Selatan',
      payment_instruction: 'Silakan transfer sesuai nominal total. Setelah membayar, kirim bukti melalui WhatsApp.',
      is_active: true
    });
  }

  if (readRows('Products').length === 0) {
    createProduct({ tenant_id: CONFIG.DEFAULT_TENANT_ID, store_id: CONFIG.DEFAULT_STORE_ID, name: 'Kopi Arabica Gayo 250g', sku: 'SKU-AG250', category_id: 'cat_kopi', description: 'Biji kopi Arabica Gayo.', price: 85000, compare_at_price: 95000, stock: 50, product_type: 'physical', status: 'active' });
    createProduct({ tenant_id: CONFIG.DEFAULT_TENANT_ID, store_id: CONFIG.DEFAULT_STORE_ID, name: 'V60 Ceramic Dripper V02', sku: 'SKU-V60C2', category_id: 'cat_alat', description: 'Dripper keramik V60.', price: 245000, stock: 2, product_type: 'preorder', is_preorder: true, status: 'active' });
    createProduct({ tenant_id: CONFIG.DEFAULT_TENANT_ID, store_id: CONFIG.DEFAULT_STORE_ID, name: 'Kopi Robusta Lampung 500g', sku: 'SKU-RL500', category_id: 'cat_kopi', description: 'Kopi robusta Lampung.', price: 120000, stock: 0, product_type: 'physical', status: 'draft' });
  }
}

function testCreateOrder() {
  const result = createOrder({
    buyer_name: 'Budi Santoso',
    buyer_whatsapp: '6281111111111',
    buyer_email: 'budi@email.com',
    buyer_address: 'Jl. Mawar No. 10, Jakarta Selatan',
    payment_method: 'manual_transfer',
    items: [
      { product_id: 'demo_1', product_name: 'Kopi Arabica Gayo 250g', quantity: 1, unit_price: 85000 },
      { product_id: 'demo_2', product_name: 'Brownies Mini', quantity: 1, unit_price: 45000 }
    ]
  });
  Logger.log(JSON.stringify(result, null, 2));
}
