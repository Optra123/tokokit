(function () {
  const config = window.TOKOKIT_CONFIG || {};
  const hasSupabaseConfig = Boolean(
    config.SUPABASE_URL &&
    config.SUPABASE_ANON_KEY &&
    !config.SUPABASE_URL.includes('YOUR_') &&
    !config.SUPABASE_ANON_KEY.includes('YOUR_')
  );
  const supabaseClient = hasSupabaseConfig && window.supabase
    ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    : null;
  const storageBucket = config.STORAGE_BUCKET || 'tokokit-assets';

  const fmt = new Intl.NumberFormat('id-ID');
  const currency = (value) => 'Rp ' + fmt.format(Number(value || 0));
  const today = () => new Date().toISOString();
  const app = document.getElementById('app');

  const demoTenantId = 'tenant_demo_001';
  const demoStoreId = 'store_demo_001';

  const state = {
    loading: true,
    saving: false,
    sidebar: false,
    route: parseRoute(),
    session: null,
    profile: null,
    tenant: null,
    store: null,
    products: [],
    orders: [],
    orderItems: [],
    payments: [],
    inventoryItems: [],
    stockMovements: [],
    fulfillmentLogs: [],
    cart: readCart(),
    publicStore: null,
    publicProducts: [],
    lastOrder: readJson('tokokit:lastOrder', null),
    authForm: { full_name: '', email: '', password: '' },
    inventoryFilters: { search: '', product_id: '', status: '' },
    inventoryImport: { paste: '', url: readJson('tokokit:inventoryCsvUrl', '') },
    notice: '',
    error: '',
    modal: null
  };

  const demo = {
    tenant: { id: demoTenantId, name: 'Demo Tenant', plan: 'demo', owner_user_id: 'demo-user' },
    profile: { id: 'demo-user', tenant_id: demoTenantId, full_name: 'Melona Seller', role: 'owner', email: 'seller@example.com' },
    store: {
      id: demoStoreId,
      tenant_id: demoTenantId,
      slug: 'senja-kopi',
      name: 'Toko Senja Kopi',
      description: 'Kopi susu, biji kopi pilihan, dan alat seduh untuk pengalaman ngopi harian.',
      business_type: 'Makanan & Minuman',
      whatsapp: '6281234567890',
      email: 'halo@senjakopi.id',
      address: 'Jl. Kenangan Indah No. 12, Jakarta Selatan',
      brand_color: '#2563eb',
      logo_url: '',
      banner_url: '',
      bank_name: 'BCA',
      bank_account_number: '1234567890',
      bank_account_name: 'Kopi Senja',
      qris_image_url: '',
      payment_instruction: 'Silakan transfer sesuai nominal total. Setelah membayar, kirim bukti pembayaran melalui WhatsApp.',
      fulfillment_mode: 'pickup',
      shipping_fee: 0,
      pickup_note: 'Ambil pesanan di toko setelah pembayaran dikonfirmasi.',
      pakasir_slug: '',
      payment_gateway_enabled: false,
      payment_gateway_provider: 'manual',
      payment_gateway_project_id: '',
      payment_gateway_checkout_url: '',
      is_active: true
    },
    products: [
      { id: 'prd-demo-1', tenant_id: demoTenantId, store_id: demoStoreId, name: 'Kopi Arabica Gayo 250g', slug: 'kopi-arabica-gayo-250g', sku: 'SKU-AG250', category: 'Biji Kopi', description: 'Biji kopi Arabica Gayo untuk seduhan harian.', price: 85000, compare_at_price: 95000, stock: 50, product_type: 'physical', fulfillment_type: 'pickup', status: 'active', image_url: '' },
      { id: 'prd-demo-2', tenant_id: demoTenantId, store_id: demoStoreId, name: 'V60 Ceramic Dripper V02', slug: 'v60-ceramic-dripper-v02', sku: 'SKU-V60C2', category: 'Alat Seduh', description: 'Dripper keramik untuk manual brew.', price: 245000, compare_at_price: 0, stock: 2, product_type: 'preorder', fulfillment_type: 'preorder_pickup', status: 'active', image_url: '' },
      { id: 'prd-demo-3', tenant_id: demoTenantId, store_id: demoStoreId, name: 'Kopi Robusta Lampung 500g', slug: 'kopi-robusta-lampung-500g', sku: 'SKU-RL500', category: 'Biji Kopi', description: 'Robusta Lampung dengan body tebal.', price: 120000, compare_at_price: 0, stock: 0, product_type: 'physical', fulfillment_type: 'delivery', status: 'draft', image_url: '' },
      { id: 'prd-demo-4', tenant_id: demoTenantId, store_id: demoStoreId, name: 'Voucher Kopi Digital', slug: 'voucher-kopi-digital', sku: 'SKU-VKD', category: 'Voucher', description: 'Voucher digital yang dikirim lewat WhatsApp.', price: 50000, compare_at_price: 0, stock: 100, product_type: 'digital', fulfillment_type: 'digital', status: 'active', image_url: '' }
    ],
    inventoryItems: [
      { id: 'inv-demo-1', tenant_id: demoTenantId, store_id: demoStoreId, product_id: 'prd-demo-4', label: 'Voucher Kopi 50K #001', payload: 'KODE-VOUCHER-001 | berlaku 30 hari', status: 'available', note: 'Demo stok digital', created_at: today(), updated_at: today() },
      { id: 'inv-demo-2', tenant_id: demoTenantId, store_id: demoStoreId, product_id: 'prd-demo-4', label: 'Voucher Kopi 50K #002', payload: 'KODE-VOUCHER-002 | berlaku 30 hari', status: 'available', note: 'Demo stok digital', created_at: today(), updated_at: today() }
    ],
    orders: [
      { id: 'ord-demo-1', tenant_id: demoTenantId, store_id: demoStoreId, order_number: 'TK-0001', buyer_name: 'Budi Santoso', buyer_whatsapp: '6281111111111', buyer_email: 'budi@email.com', buyer_address: 'Jakarta Selatan', subtotal: 150000, shipping_fee: 0, discount_amount: 0, total_amount: 150000, payment_method: 'manual_transfer', payment_status: 'paid', order_status: 'processing', notes: '', created_at: today() },
      { id: 'ord-demo-2', tenant_id: demoTenantId, store_id: demoStoreId, order_number: 'TK-0002', buyer_name: 'Siti Aminah', buyer_whatsapp: '6282222222222', buyer_email: 'siti@email.com', buyer_address: 'Depok', subtotal: 45000, shipping_fee: 0, discount_amount: 0, total_amount: 45000, payment_method: 'qris', payment_status: 'unpaid', order_status: 'new', notes: 'Kirim sore', created_at: today() }
    ],
    payments: [
      { id: 'pay-demo-1', order_id: 'ord-demo-1', tenant_id: demoTenantId, store_id: demoStoreId, amount: 150000, method: 'manual_transfer', status: 'paid' },
      { id: 'pay-demo-2', order_id: 'ord-demo-2', tenant_id: demoTenantId, store_id: demoStoreId, amount: 45000, method: 'qris', status: 'unpaid' }
    ],
    orderItems: [],
    stockMovements: [],
    fulfillmentLogs: []
  };

  const navItems = [
    ['dashboard', 'Dashboard', 'D'],
    ['store', 'Toko Saya', 'T'],
    ['products', 'Produk', 'P'],
    ['inventory', 'Inventori', 'I'],
    ['orders', 'Pesanan', 'O'],
    ['payments', 'Pembayaran', 'B'],
    ['settings', 'Pengaturan', 'S']
  ];

  window.addEventListener('popstate', async () => {
    state.route = parseRoute();
    await bootRoute();
  });

  window.TokoKit = {
    go,
    logout,
    login,
    register,
    updateAuthField,
    saveStore,
    openProductModal,
    closeModal,
    saveProduct,
    archiveProduct,
    openInventoryModal,
    saveInventoryItem,
    deleteInventoryItem,
    updateInventoryFilter,
    handleInventoryImport,
    handleInventoryPaste,
    importInventoryFromUrl,
    updateInventoryImportField,
    exportInventoryCsv,
    downloadInventoryTemplate,
    copyInventoryTemplate,
    openOrderDetail,
    updatePaymentStatus,
    updateOrderStatus,
    addToCart,
    buyNow,
    viewProduct,
    removeCartItem,
    updateCartQty,
    clearCart,
    createPublicOrder,
    openWhatsApp,
    previewPaymentMethod,
    toggleSidebar
  };

  init();

  async function init() {
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      state.session = data.session;
      supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        state.session = session;
        await bootRoute();
      });
    }
    await bootRoute();
  }

  async function bootRoute() {
    state.loading = true;
    state.error = '';
    render();

    try {
      if (isAuthRoute()) {
        if (state.session && supabaseClient) {
          go('/app/dashboard', true);
          return;
        }
        state.loading = false;
        render();
        return;
      }

      if (isPublicRoute()) {
        await loadPublicData();
        state.loading = false;
        render();
        return;
      }

      if (state.route.section === 'home') {
        state.loading = false;
        render();
        return;
      }

      if (supabaseClient && !state.session) {
        go('/login', true);
        return;
      }

      await loadSellerData();
    } catch (error) {
      state.error = error.message || 'Terjadi kesalahan saat memuat data.';
    } finally {
      state.loading = false;
      render();
    }
  }

  function parseRoute() {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return { section: 'home' };
    if (parts[0] === 'login') return { section: 'auth', page: 'login' };
    if (parts[0] === 'register') return { section: 'auth', page: 'register' };
    if (parts[0] === 'app') return { section: 'app', page: parts[1] || 'dashboard' };
    if (parts[0] === 'store') return { section: 'public', page: 'store', slug: parts[1] || config.DEMO_STORE_SLUG || 'senja-kopi' };
    if (parts[0] === 'checkout') return { section: 'public', page: 'checkout', slug: parts[1] || config.DEMO_STORE_SLUG || 'senja-kopi' };
    if (parts[0] === 'success') return { section: 'public', page: 'success', orderNumber: parts[1] || '' };
    return { section: 'home' };
  }

  function isAuthRoute() {
    return state.route.section === 'auth';
  }

  function isPublicRoute() {
    return state.route.section === 'public';
  }

  function go(path, replace) {
    if (replace) history.replaceState({}, '', path);
    else history.pushState({}, '', path);
    state.route = parseRoute();
    state.notice = '';
    state.error = '';
    state.modal = null;
    state.sidebar = false;
    bootRoute();
  }

  async function loadSellerData() {
    if (!supabaseClient) {
      state.profile = demo.profile;
      state.tenant = demo.tenant;
      state.store = readJson('tokokit:demoStore', demo.store);
      state.products = readJson('tokokit:demoProducts', demo.products);
      state.orders = readJson('tokokit:demoOrders', demo.orders);
      state.orderItems = readJson('tokokit:demoOrderItems', demo.orderItems);
      state.payments = readJson('tokokit:demoPayments', demo.payments);
      state.inventoryItems = readJson('tokokit:demoInventoryItems', demo.inventoryItems);
      state.stockMovements = readJson('tokokit:demoStockMovements', demo.stockMovements);
      state.fulfillmentLogs = readJson('tokokit:demoFulfillmentLogs', demo.fulfillmentLogs);
      return;
    }

    const user = state.session.user;
    let { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    if (!profile) {
      const tenantId = crypto.randomUUID();
      const { data: tenant, error: tenantError } = await supabaseClient
        .from('tenants')
        .insert({ id: tenantId, name: user.email, owner_user_id: user.id, plan: 'free', status: 'active' })
        .select()
        .single();
      if (tenantError) throw tenantError;

      const { data: newProfile, error: newProfileError } = await supabaseClient
        .from('profiles')
        .insert({ id: user.id, tenant_id: tenant.id, email: user.email, full_name: user.user_metadata?.full_name || 'Seller', role: 'owner' })
        .select()
        .single();
      if (newProfileError) throw newProfileError;
      profile = newProfile;
    }

    state.profile = profile;

    const [{ data: tenant, error: tenantError }, { data: store, error: storeError }] = await Promise.all([
      supabaseClient.from('tenants').select('*').eq('id', profile.tenant_id).single(),
      supabaseClient.from('stores').select('*').eq('tenant_id', profile.tenant_id).maybeSingle()
    ]);
    if (tenantError) throw tenantError;
    if (storeError) throw storeError;

    state.tenant = tenant;
    if (store) {
      state.store = store;
    } else {
      const { data: createdStore, error } = await supabaseClient
        .from('stores')
        .insert({
          tenant_id: profile.tenant_id,
          slug: uniqueSlug(user.email || 'toko-baru'),
          name: 'Toko Baru',
          description: 'Tulis deskripsi toko Anda.',
          whatsapp: '',
          email: user.email,
          is_active: false,
          brand_color: '#2563eb',
          payment_instruction: 'Silakan transfer sesuai nominal lalu konfirmasi melalui WhatsApp.'
        })
        .select()
        .single();
      if (error) throw error;
      state.store = createdStore;
    }

    const [productsResult, ordersResult, orderItemsResult, paymentsResult] = await Promise.all([
      supabaseClient.from('products').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
      supabaseClient.from('orders').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
      supabaseClient.from('order_items').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
      supabaseClient.from('payments').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false })
    ]);

    if (productsResult.error) throw productsResult.error;
    if (ordersResult.error) throw ordersResult.error;
    if (orderItemsResult.error) throw orderItemsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;

    state.products = productsResult.data || [];
    state.orders = ordersResult.data || [];
    state.orderItems = orderItemsResult.data || [];
    state.payments = paymentsResult.data || [];

    const [inventoryResult, stockMovementsResult, fulfillmentLogsResult] = await Promise.all([
      supabaseClient.from('inventory_items').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
      supabaseClient.from('stock_movements').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
      supabaseClient.from('fulfillment_logs').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false })
    ]);
    const optionalErrors = [inventoryResult.error, stockMovementsResult.error, fulfillmentLogsResult.error].filter(Boolean);
    if (optionalErrors.length) {
      state.inventoryItems = [];
      state.stockMovements = [];
      state.fulfillmentLogs = [];
      state.error = 'Schema inventori belum aktif di Supabase. Jalankan ulang docs/SUPABASE_SCHEMA.sql agar menu Inventori dan fulfillment digital bisa dipakai.';
    } else {
      state.inventoryItems = inventoryResult.data || [];
      state.stockMovements = stockMovementsResult.data || [];
      state.fulfillmentLogs = fulfillmentLogsResult.data || [];
    }
  }

  async function loadPublicData() {
    const lastOrderSlug = state.lastOrder?.store_slug || readJson('tokokit:lastStoreSlug', '');
    const slug = state.route.slug || (state.route.page === 'success' ? lastOrderSlug : '') || config.DEMO_STORE_SLUG || 'senja-kopi';
    if (!supabaseClient) {
      const store = readJson('tokokit:demoStore', demo.store);
      const products = readJson('tokokit:demoProducts', demo.products);
      state.publicStore = store.slug === slug ? store : demo.store;
      state.publicProducts = products.filter((product) => product.status === 'active');
      return;
    }

    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    if (storeError) throw storeError;

    state.publicStore = store;
    if (!store && state.route.page === 'success' && state.lastOrder?.store_id) {
      const { data: successStore, error: successStoreError } = await supabaseClient
        .from('stores')
        .select('*')
        .eq('id', state.lastOrder.store_id)
        .eq('is_active', true)
        .maybeSingle();
      if (successStoreError) throw successStoreError;
      state.publicStore = successStore;
    }
    if (!state.publicStore) {
      state.publicProducts = [];
      return;
    }

    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('store_id', state.publicStore.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (productsError) throw productsError;
    state.publicProducts = products || [];
  }

  function render() {
    if (state.loading) {
      app.innerHTML = `<div class="page"><div class="notice">Memuat TokoKit...</div></div>`;
      return;
    }
    if (isAuthRoute()) {
      app.innerHTML = renderAuth(state.route.page);
      return;
    }

    if (isPublicRoute()) {
      app.innerHTML = renderPublic();
      return;
    }

    if (state.route.section === 'home') {
      app.innerHTML = renderLanding();
      return;
    }

    app.innerHTML = renderAdmin();
  }

  function renderLanding() {
    return `
      <div class="landing-shell">
        <nav class="landing-nav">
          <div class="landing-brand">TokoKit</div>
          <div class="page-actions">
            <button class="btn" onclick="TokoKit.go('/login')">Masuk Seller</button>
            <button class="btn btn-primary" onclick="TokoKit.go('/register')">Buat Toko</button>
          </div>
        </nav>
        <main>
          <section class="landing-hero">
            <div>
              ${badge('Untuk UMKM, digital seller, preorder, dan pickup', 'primary')}
              <h1>Toko online ringan untuk jualan tanpa ribet operasional.</h1>
              <p>TokoKit membantu seller membuat storefront, menerima pesanan, mengatur checkout sesuai jenis produk, dan menyiapkan alur pembayaran manual maupun gateway.</p>
              <div class="page-actions">
                <button class="btn btn-primary" onclick="TokoKit.go('/register')">Mulai Buat Toko</button>
                <button class="btn btn-secondary" onclick="document.getElementById('flow').scrollIntoView({behavior:'smooth'})">Lihat Alur</button>
              </div>
            </div>
            <div class="landing-preview">
              <div class="list">
                <div class="list-row"><span>Produk digital</span>${badge('Tanpa alamat', 'success')}</div>
                <div class="list-row"><span>Makanan pickup</span>${badge('Ambil di toko', 'primary')}</div>
                <div class="list-row"><span>Preorder</span>${badge('Jadwal produksi', 'warning')}</div>
                <div class="list-row"><span>Payment</span>${badge('Manual + gateway ready', 'info')}</div>
              </div>
            </div>
          </section>
          <section id="flow" class="landing-section">
            <div class="page-header">
              <div>
                <h2 class="page-title">Flow Seller</h2>
                <p class="page-subtitle">Dibuat agar seller pemula tetap paham langkah jualannya.</p>
              </div>
            </div>
            <div class="grid grid-4">
              ${landingStep('1', 'Buat toko', 'Daftar seller, isi nama toko, WhatsApp, dan instruksi pembayaran.')}
              ${landingStep('2', 'Tambah produk', 'Pilih jenis penjualan: digital, pickup, delivery, atau preorder.')}
              ${landingStep('3', 'Bagikan link', 'Buyer membuka link toko, melihat detail produk, lalu checkout tanpa akun.')}
              ${landingStep('4', 'Kelola order', 'Seller melihat pesanan, follow-up WhatsApp, dan nanti payment bisa otomatis.')}
            </div>
          </section>
          <section class="landing-section">
            <div class="grid grid-2">
              <div class="card">
                <h3 class="card-title">Siap untuk produk digital</h3>
                <p class="card-desc">Struktur produk sudah disiapkan untuk stok digital dan delivery otomatis setelah payment terdeteksi paid.</p>
              </div>
              <div class="card">
                <h3 class="card-title">Butuh bantuan setup?</h3>
                <p class="card-desc">Gunakan tombol daftar dulu. Kontak admin bisa ditambahkan di konfigurasi saat project siap dibuka publik.</p>
                <div class="page-actions">
                  ${config.ADMIN_WHATSAPP ? `<a class="btn btn-secondary" href="https://wa.me/${escapeAttr(config.ADMIN_WHATSAPP)}" target="_blank" rel="noopener">Hubungi Admin</a>` : ''}
                  ${config.ADMIN_EMAIL ? `<a class="btn" href="mailto:${escapeAttr(config.ADMIN_EMAIL)}">Email Admin</a>` : ''}
                  <button class="btn btn-primary" onclick="TokoKit.go('/register')">Buat Akun Seller</button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    `;
  }

  function landingStep(number, title, desc) {
    return `<div class="card landing-step"><div class="metric-icon">${number}</div><h3 class="card-title">${title}</h3><p class="card-desc">${desc}</p></div>`;
  }

  function renderAuth(page) {
    const isLogin = page === 'login';
    const values = state.authForm;
    const authError = state.error ? friendlyAuthError(state.error) : '';
    return `
      <div class="auth-shell">
        <section class="auth-hero">
          <div class="auth-brand">TokoKit</div>
          <div class="auth-copy">
            <h1>${isLogin ? 'Kelola toko dari satu dashboard.' : 'Mulai jualan online dengan alur yang rapi.'}</h1>
            <p>${isLogin ? 'Masuk hanya untuk seller. Link toko publik tetap terpisah dari area dashboard.' : 'Buat toko, atur produk digital/pickup/preorder, lalu bagikan link checkout ke pembeli.'}</p>
          </div>
          <div class="small-muted" style="color:#bfdbfe">${supabaseClient ? 'Mode Supabase aktif' : 'Mode demo aktif tanpa backend'}</div>
        </section>
        <section class="auth-panel">
          <form class="auth-card" onsubmit="${isLogin ? 'TokoKit.login(event)' : 'TokoKit.register(event)'}">
            <div>
              <h2>${isLogin ? 'Masuk ke Seller Center' : 'Daftar Seller Baru'}</h2>
              <p>${isLogin ? 'Gunakan email dan password yang kamu pakai saat membuat toko.' : 'Setelah daftar, kamu akan mendapat workspace toko dan bisa langsung melengkapi profil toko.'}</p>
            </div>
            ${state.notice ? `<div class="notice success">${escapeHtml(state.notice)}</div>` : ''}
            ${authError ? `<div class="notice error auth-error"><b>${escapeHtml(authError.title)}</b><span>${escapeHtml(authError.message)}</span></div>` : ''}
            ${!isLogin ? `<label class="field"><span class="label">Nama lengkap</span><input class="input" name="full_name" value="${escapeAttr(values.full_name || (!supabaseClient ? 'Melona Seller' : ''))}" autocomplete="name" oninput="TokoKit.updateAuthField('full_name', this.value)" required /></label>` : ''}
            <label class="field"><span class="label">Email</span><input class="input" type="email" name="email" value="${escapeAttr(values.email || (!supabaseClient ? 'seller@example.com' : ''))}" autocomplete="email" oninput="TokoKit.updateAuthField('email', this.value)" required /></label>
            <label class="field"><span class="label">Password</span><input class="input" type="password" name="password" value="${escapeAttr(values.password || (!supabaseClient ? 'password123' : ''))}" autocomplete="${isLogin ? 'current-password' : 'new-password'}" oninput="TokoKit.updateAuthField('password', this.value)" minlength="6" required /></label>
            <button class="btn btn-primary btn-block" ${state.saving ? 'disabled' : ''}>${state.saving ? 'Memproses...' : isLogin ? 'Masuk' : 'Buat Akun'}</button>
            ${!supabaseClient ? `<button type="button" class="btn btn-secondary btn-block" onclick="TokoKit.go('/app/dashboard')">Lihat Demo Tanpa Login</button>` : ''}
            <div class="auth-help">
              <p>${isLogin ? 'Belum punya akun seller?' : 'Sudah punya akun seller?'} <button type="button" class="btn btn-ghost" onclick="TokoKit.go('${isLogin ? '/register' : '/login'}')">${isLogin ? 'Buat akun seller' : 'Masuk'}</button></p>
              <p class="small-muted">${isLogin ? 'Jika lupa password, fitur reset password akan ditambahkan sebelum payment gateway publik.' : 'Gunakan email aktif karena konfirmasi email bisa diminta oleh Supabase.'}</p>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderAdmin() {
    const page = state.route.page || 'dashboard';
    const renderers = {
      dashboard: renderDashboard,
      store: renderStorePage,
      products: renderProductsPage,
      inventory: renderInventoryPage,
      orders: renderOrdersPage,
      payments: renderPaymentsPage,
      settings: renderSettingsPage
    };
    const content = (renderers[page] || renderDashboard)();
    return `
      <div class="app-shell">
        <div class="drawer-backdrop ${state.sidebar ? 'show' : ''}" onclick="TokoKit.toggleSidebar(false)"></div>
        ${renderSidebar(page)}
        <main class="main-area">
          ${renderTopbar(page)}
          ${content}
        </main>
        ${state.modal?.type === 'product' ? renderProductModal() : ''}
        ${state.modal?.type === 'inventory' ? renderInventoryModal() : ''}
        ${state.modal?.type === 'orderDetail' ? renderOrderDetailModal() : ''}
      </div>
    `;
  }

  function renderSidebar(page) {
    const storeUrl = `/store/${state.store?.slug || config.DEMO_STORE_SLUG || 'senja-kopi'}`;
    return `
      <aside class="sidebar ${state.sidebar ? 'open' : ''}">
        <div class="brand">
          <div class="brand-title">TokoKit</div>
          <div class="brand-subtitle">Seller Center</div>
        </div>
        <nav class="nav">
          ${navItems.map(([key, label, icon]) => `
            <button class="nav-item ${page === key ? 'active' : ''}" onclick="TokoKit.go('/app/${key}')">
              <span class="nav-icon">${icon}</span>${label}
            </button>
          `).join('')}
        </nav>
        <div class="sidebar-bottom">
          <button class="btn btn-primary" onclick="TokoKit.go('${storeUrl}')">Buka Toko</button>
          <button class="btn" onclick="TokoKit.logout()">Keluar</button>
        </div>
      </aside>
    `;
  }

  function renderTopbar(page) {
    const title = navItems.find((item) => item[0] === page)?.[1] || 'Dashboard';
    return `
      <header class="topbar">
        <div class="topbar-left">
          <button class="icon-btn mobile-menu" onclick="TokoKit.toggleSidebar(true)">=</button>
          <div>
            <div class="topbar-title">${title}</div>
            <div class="topbar-subtitle">${supabaseClient ? 'Supabase production mode' : 'Demo mode lokal'}</div>
          </div>
        </div>
        <div class="topbar-right">
          <div class="store-pill">${escapeHtml(state.store?.name || 'Toko Baru')}</div>
          <div class="avatar">${initials(state.profile?.full_name || state.profile?.email || 'TK')}</div>
        </div>
      </header>
    `;
  }

  function updateAuthField(field, value) {
    state.authForm[field] = value;
    if (state.error) state.error = '';
  }

  function friendlyAuthError(message) {
    const text = String(message || '').toLowerCase();
    if (text.includes('invalid login credentials')) {
      return {
        title: 'Email atau password belum cocok',
        message: 'Cek lagi email dan password seller kamu. Input yang sudah kamu ketik tetap tersimpan, jadi cukup koreksi bagian yang salah.'
      };
    }
    if (text.includes('email not confirmed')) {
      return {
        title: 'Email belum dikonfirmasi',
        message: 'Buka inbox email kamu, klik link konfirmasi dari Supabase, lalu coba masuk lagi.'
      };
    }
    if (text.includes('already registered') || text.includes('user already registered')) {
      return {
        title: 'Email sudah terdaftar',
        message: 'Gunakan halaman masuk seller. Jika lupa password, fitur reset password akan ditambahkan berikutnya.'
      };
    }
    return {
      title: 'Belum bisa memproses permintaan',
      message: message || 'Coba ulangi beberapa saat lagi.'
    };
  }

  function pageShell(title, subtitle, actions, content) {
    return `
      <section class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title">${title}</h1>
            <p class="page-subtitle">${subtitle}</p>
          </div>
          <div class="page-actions">${actions || ''}</div>
        </div>
        ${state.notice ? `<div class="notice success" style="margin-bottom:16px">${escapeHtml(state.notice)}</div>` : ''}
        ${state.error ? `<div class="notice error" style="margin-bottom:16px">${escapeHtml(state.error)}</div>` : ''}
        ${content}
      </section>
    `;
  }

  function renderDashboard() {
    const paidRevenue = state.orders.filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const unpaid = state.orders.filter((order) => order.payment_status === 'unpaid').length;
    const activeProducts = state.products.filter((product) => product.status === 'active').length;
    const recentOrders = state.orders.slice(0, 6);
    const actions = `<button class="btn btn-secondary" onclick="TokoKit.go('/store/${state.store?.slug || 'senja-kopi'}')">Preview Toko</button><button class="btn btn-primary" onclick="TokoKit.openProductModal()">Tambah Produk</button>`;
    const content = `
      <div class="grid grid-4" style="margin-bottom:16px">
        ${metric('R', 'Omzet paid', currency(paidRevenue), 'Dari pesanan dibayar')}
        ${metric('O', 'Total pesanan', state.orders.length, 'Semua status')}
        ${metric('U', 'Belum dibayar', unpaid, 'Butuh follow-up')}
        ${metric('P', 'Produk aktif', activeProducts, 'Tampil di storefront')}
      </div>
      <div class="grid grid-2">
        <div class="card">
          <h3 class="card-title">Pesanan Terbaru</h3>
          <p class="card-desc">Order yang masuk dari checkout publik.</p>
          ${recentOrders.length ? renderOrdersTable(recentOrders, true) : emptyState('Belum ada pesanan. Bagikan link toko untuk mulai menerima order.')}
        </div>
        <div class="card">
          <h3 class="card-title">Kesiapan Toko</h3>
          <p class="card-desc">Checklist minimum sebelum link toko dibagikan ke calon pembeli.</p>
          <div class="list">
            ${checkRow(Boolean(state.store?.name), 'Nama toko terisi')}
            ${checkRow(Boolean(state.store?.whatsapp), 'Nomor WhatsApp terisi')}
            ${checkRow(Boolean(state.store?.payment_instruction), 'Instruksi pembayaran siap')}
            ${checkRow(activeProducts > 0, 'Ada produk aktif')}
            ${checkRow(Boolean(state.store?.is_active), 'Toko dipublish')}
          </div>
        </div>
      </div>
    `;
    return pageShell('Dashboard', 'Pantau performa toko, pesanan, dan kesiapan untuk jualan online.', actions, content);
  }

  function renderStorePage() {
    const store = state.store || demo.store;
    const actions = `<button class="btn btn-secondary" onclick="TokoKit.go('/store/${store.slug || 'senja-kopi'}')">Preview</button><button class="btn btn-primary" form="storeForm">Simpan</button>`;
    const content = `
      <form id="storeForm" onsubmit="TokoKit.saveStore(event)" class="grid" style="grid-template-columns:minmax(0,2fr) minmax(280px,1fr);align-items:start">
        <div class="grid">
          <div class="card">
            <h3 class="card-title">Profil Toko</h3>
            <p class="card-desc">Data ini tampil di storefront publik.</p>
            <div class="form-grid">
              ${input('name', 'Nama toko', store.name, true)}
              ${input('slug', 'Slug URL', store.slug, true)}
              ${input('business_type', 'Jenis usaha', store.business_type || '')}
              ${input('email', 'Email toko', store.email || '', false, 'email')}
            </div>
            <br>
            ${textarea('description', 'Deskripsi toko', store.description || '')}
          </div>
          <div class="card">
            <h3 class="card-title">Kontak dan Pembayaran</h3>
            <p class="card-desc">Dipakai untuk checkout dan konfirmasi WhatsApp.</p>
            <div class="form-grid">
              ${input('whatsapp', 'Nomor WhatsApp', store.whatsapp || '')}
              ${input('address', 'Alamat toko', store.address || '')}
              ${input('bank_name', 'Nama bank', store.bank_name || '')}
              ${input('bank_account_number', 'Nomor rekening', store.bank_account_number || '')}
              ${input('bank_account_name', 'Nama pemilik rekening', store.bank_account_name || '')}
              ${input('qris_image_url', 'URL gambar QRIS', store.qris_image_url || '')}
              ${fileInput('qris_file', 'Upload QRIS')}
            </div>
            <br>
            ${textarea('payment_instruction', 'Instruksi pembayaran', store.payment_instruction || '')}
          </div>
          <div class="card">
            <h3 class="card-title">Operasional Pesanan</h3>
            <p class="card-desc">Atur apakah toko fokus digital, ambil di toko, delivery, atau preorder.</p>
            <div class="form-grid">
              <label class="field"><span class="label">Mode utama toko</span><select class="select" name="fulfillment_mode">
                <option value="pickup" ${(store.fulfillment_mode || 'pickup') === 'pickup' ? 'selected' : ''}>Ambil di toko</option>
                <option value="digital" ${store.fulfillment_mode === 'digital' ? 'selected' : ''}>Digital</option>
                <option value="delivery" ${store.fulfillment_mode === 'delivery' ? 'selected' : ''}>Delivery</option>
                <option value="preorder_pickup" ${store.fulfillment_mode === 'preorder_pickup' ? 'selected' : ''}>Preorder ambil di toko</option>
              </select></label>
              ${input('shipping_fee', 'Ongkir default', store.shipping_fee || 0, false, 'number')}
              <label class="field"><span class="label">Payment gateway</span><select class="select" name="payment_gateway_provider">
                <option value="manual" ${gatewayProvider(store) === 'manual' ? 'selected' : ''}>Manual: transfer/QRIS statis</option>
                <option value="pakasir" ${gatewayProvider(store) === 'pakasir' ? 'selected' : ''}>Pakasir payment link</option>
                <option value="custom_link" ${gatewayProvider(store) === 'custom_link' ? 'selected' : ''}>Custom payment link</option>
                <option value="midtrans" ${gatewayProvider(store) === 'midtrans' ? 'selected' : ''}>Midtrans (butuh backend)</option>
                <option value="xendit" ${gatewayProvider(store) === 'xendit' ? 'selected' : ''}>Xendit (butuh backend)</option>
              </select></label>
              ${input('pakasir_slug', 'Project/slug Pakasir', store.pakasir_slug || store.payment_gateway_project_id || '')}
              ${input('payment_gateway_checkout_url', 'Base URL custom payment', store.payment_gateway_checkout_url || '')}
              <input type="hidden" name="payment_gateway_enabled" value="${gatewayProvider(store) === 'manual' ? 'false' : 'true'}">
            </div>
            <br>
            <div class="notice">Provider seperti Midtrans/Xendit butuh backend webhook agar status pembayaran bisa otomatis. Jangan pernah menyimpan secret key payment gateway di frontend.</div>
            <br>
            ${textarea('pickup_note', 'Catatan pickup / pengiriman digital', store.pickup_note || '')}
          </div>
        </div>
        <aside class="grid">
          <div class="card">
            <h3 class="card-title">Status Publikasi</h3>
            <p class="card-desc">Toko aktif bisa diakses pembeli lewat slug publik.</p>
            <label class="field">
              <span class="label">Status</span>
              <select class="select" name="is_active">
                <option value="true" ${store.is_active ? 'selected' : ''}>Published</option>
                <option value="false" ${!store.is_active ? 'selected' : ''}>Draft</option>
              </select>
            </label>
            <br>
            <div class="list-row"><span>URL publik</span><b>/store/${escapeHtml(store.slug || 'senja-kopi')}</b></div>
          </div>
          <div class="card">
            <h3 class="card-title">Branding</h3>
            <div class="form-grid" style="grid-template-columns:1fr">
              ${input('brand_color', 'Warna brand', store.brand_color || '#2563eb')}
              ${input('logo_url', 'URL logo', store.logo_url || '')}
              ${fileInput('logo_file', 'Upload logo')}
              ${input('banner_url', 'URL banner', store.banner_url || '')}
              ${fileInput('banner_file', 'Upload banner')}
            </div>
          </div>
        </aside>
      </form>
    `;
    return pageShell('Toko Saya', 'Atur identitas toko, kontak, publikasi, dan pembayaran manual.', actions, content);
  }

  function renderProductsPage() {
    const active = state.products.filter((product) => product.status === 'active').length;
    const draft = state.products.filter((product) => product.status === 'draft').length;
    const lowStock = state.products.filter((product) => Number(product.stock || 0) <= 3 && product.status === 'active').length;
    const actions = `<button class="btn btn-primary" onclick="TokoKit.openProductModal()">Tambah Produk</button>`;
    const content = `
      <div class="grid grid-4" style="margin-bottom:16px">
        ${metric('A', 'Aktif', active, 'Tampil di toko')}
        ${metric('D', 'Draft', draft, 'Belum publik')}
        ${metric('L', 'Stok rendah', lowStock, 'Perlu dicek')}
        ${metric('T', 'Total produk', state.products.length, 'Semua status')}
      </div>
      <div class="card">
        <div class="filters">
          <input class="input" id="productSearch" style="max-width:320px" placeholder="Cari produk..." oninput="TokoKit.go('/app/products')" />
        </div>
        ${state.products.length ? renderProductsTable(state.products) : emptyState('Belum ada produk. Tambahkan produk pertama agar storefront bisa dipakai.')}
      </div>
    `;
    return pageShell('Produk', 'Kelola katalog, harga, stok, dan status publikasi.', actions, content);
  }

  function renderInventoryPage() {
    const digitalProducts = state.products.filter((product) => effectiveFulfillment(product) === 'digital' || product.product_type === 'digital');
    const available = state.inventoryItems.filter((item) => item.status === 'available').length;
    const reserved = state.inventoryItems.filter((item) => item.status === 'reserved').length;
    const sold = state.inventoryItems.filter((item) => item.status === 'sold' || item.status === 'delivered').length;
    const filtered = filteredInventoryItems();
    const actions = `
      <button class="btn btn-secondary" onclick="TokoKit.exportInventoryCsv()">Export CSV</button>
      <button class="btn" onclick="TokoKit.downloadInventoryTemplate()">Template</button>
      <button class="btn btn-primary" onclick="TokoKit.openInventoryModal()">Tambah Stok</button>
    `;
    const content = `
      <div class="grid grid-4" style="margin-bottom:16px">
        ${metric('A', 'Available', available, 'Siap dijual')}
        ${metric('R', 'Reserved', reserved, 'Tertahan order')}
        ${metric('S', 'Sold/Delivered', sold, 'Sudah dipakai')}
        ${metric('P', 'Produk digital', digitalProducts.length, 'Butuh stok siap kirim')}
      </div>
      <div class="grid grid-2" style="align-items:start">
        <div class="card">
          <h3 class="card-title">Stok Digital</h3>
          <p class="card-desc">Simpan kode voucher, akun, license key, atau data digital lain. Payload hanya tampil untuk seller.</p>
          <div class="filters">
            <input class="input" style="max-width:260px" placeholder="Cari label, payload, atau catatan..." value="${escapeAttr(state.inventoryFilters.search)}" oninput="TokoKit.updateInventoryFilter('search', this.value)" />
            <select class="select" style="max-width:220px" onchange="TokoKit.updateInventoryFilter('product_id', this.value)">
              <option value="">Semua produk</option>
              ${digitalProducts.map((product) => `<option value="${product.id}" ${state.inventoryFilters.product_id === product.id ? 'selected' : ''}>${escapeHtml(product.name)}</option>`).join('')}
            </select>
            <select class="select" style="max-width:180px" onchange="TokoKit.updateInventoryFilter('status', this.value)">
              <option value="">Semua status</option>
              ${['available', 'reserved', 'sold', 'delivered', 'cancelled'].map((status) => `<option value="${status}" ${state.inventoryFilters.status === status ? 'selected' : ''}>${inventoryStatusLabel(status)}</option>`).join('')}
            </select>
          </div>
          ${filtered.length ? renderInventoryTable(filtered) : emptyState('Belum ada stok digital yang cocok dengan filter. Tambahkan stok atau import CSV.')}
        </div>
        <div class="grid">
          <div class="card">
            <h3 class="card-title">Import dari Spreadsheet</h3>
            <p class="card-desc">Kelola stok di Excel/Google Sheets, lalu import ke TokoKit saat stok siap dijual.</p>
            <div class="notice">Kolom wajib: product_sku atau product_id, label, payload. Kolom opsional: status, note. Status kosong otomatis menjadi available.</div>
            <br>
            <div class="grid">
              <label class="field">
                <span class="label">Upload CSV dari Excel/Google Sheets</span>
                <input class="input" type="file" accept=".csv,text/csv" onchange="TokoKit.handleInventoryImport(event)">
              </label>
              <label class="field">
                <span class="label">Paste tabel dari spreadsheet</span>
                <textarea class="textarea spreadsheet-paste" placeholder="product_sku,label,payload,status,note&#10;SKU-DIGI-1,Akun #001,email@example.com | pass123,available,stok batch juni" oninput="TokoKit.updateInventoryImportField('paste', this.value)">${escapeHtml(state.inventoryImport.paste)}</textarea>
              </label>
              <button class="btn btn-secondary btn-block" onclick="TokoKit.handleInventoryPaste()">Import dari Paste</button>
              <label class="field">
                <span class="label">URL CSV publik opsional</span>
                <input class="input" placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" value="${escapeAttr(state.inventoryImport.url)}" oninput="TokoKit.updateInventoryImportField('url', this.value)">
              </label>
              <button class="btn btn-secondary btn-block" onclick="TokoKit.importInventoryFromUrl()">Import dari URL CSV</button>
              <div class="page-actions">
                <button class="btn" onclick="TokoKit.downloadInventoryTemplate()">Download Template</button>
                <button class="btn" onclick="TokoKit.copyInventoryTemplate()">Copy Header</button>
              </div>
            </div>
          </div>
          <div class="card">
            <h3 class="card-title">Cara Pakai Google Sheets</h3>
            <div class="list">
              <div class="list-row"><span>1. Buat sheet stok</span><b>Kolom template</b></div>
              <div class="list-row"><span>2. Isi product_sku sesuai SKU produk digital</span><b>Wajib cocok</b></div>
              <div class="list-row"><span>3. Publish CSV atau export CSV</span><b>Import</b></div>
              <div class="list-row"><span>4. Stok available otomatis tampil di storefront</span><b>Sync</b></div>
            </div>
          </div>
          <div class="card">
            <h3 class="card-title">Riwayat Stok</h3>
            <p class="card-desc">Perubahan stok penting akan tercatat untuk audit ringan.</p>
            ${state.stockMovements.length ? renderStockMovements(state.stockMovements.slice(0, 8)) : emptyState('Belum ada riwayat stok.')}
          </div>
        </div>
      </div>
    `;
    return pageShell('Inventori', 'Kelola stok digital siap kirim dan riwayat fulfillment.', actions, content);
  }

  function renderOrdersPage() {
    const actions = `<button class="btn btn-secondary" onclick="location.reload()">Refresh</button>`;
    const content = `
      <div class="grid grid-4" style="margin-bottom:16px">
        ${metric('N', 'Baru', state.orders.filter((o) => o.order_status === 'new').length, 'Perlu diproses')}
        ${metric('U', 'Unpaid', state.orders.filter((o) => o.payment_status === 'unpaid').length, 'Butuh konfirmasi')}
        ${metric('P', 'Paid', state.orders.filter((o) => o.payment_status === 'paid').length, 'Siap diproses')}
        ${metric('C', 'Selesai', state.orders.filter((o) => o.order_status === 'completed').length, 'Tuntas')}
      </div>
      <div class="card">
        ${state.orders.length ? renderOrdersTable(state.orders, false) : emptyState('Belum ada pesanan. Coba checkout dari halaman toko publik.')}
      </div>
    `;
    return pageShell('Pesanan', 'Pantau pesanan masuk dan update status secara manual.', actions, content);
  }

  function renderPaymentsPage() {
    const unpaidOrders = state.orders.filter((order) => order.payment_status === 'unpaid');
    const paidAmount = state.orders.filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const content = `
      <div class="grid grid-4" style="margin-bottom:16px">
        ${metric('M', 'Metode aktif', 'Manual', 'Transfer + QRIS')}
        ${metric('U', 'Menunggu', unpaidOrders.length, 'Perlu dicek')}
        ${metric('P', 'Paid amount', currency(paidAmount), 'Total dibayar')}
        ${metric('G', 'Gateway', 'Roadmap', 'Xendit/Midtrans nanti')}
      </div>
      <div class="grid grid-2">
        <div class="card">
          <h3 class="card-title">Instruksi Pembayaran</h3>
          <p class="card-desc">Diambil dari halaman Toko Saya.</p>
          <div class="list">
            <div class="list-row"><span>Bank</span><b>${escapeHtml(state.store?.bank_name || '-')}</b></div>
            <div class="list-row"><span>Rekening</span><b>${escapeHtml(state.store?.bank_account_number || '-')}</b></div>
            <div class="list-row"><span>Atas nama</span><b>${escapeHtml(state.store?.bank_account_name || '-')}</b></div>
          </div>
        </div>
        <div class="card">
          <h3 class="card-title">Konfirmasi Pembayaran</h3>
          ${unpaidOrders.length ? renderOrdersTable(unpaidOrders, true) : emptyState('Tidak ada pembayaran yang menunggu konfirmasi.')}
        </div>
      </div>
    `;
    return pageShell('Pembayaran', 'Kelola pembayaran manual, QRIS statis, dan konfirmasi order.', '', content);
  }

  function renderSettingsPage() {
    const content = `
      <div class="grid grid-2">
        <div class="card">
          <h3 class="card-title">Konfigurasi Backend</h3>
          <p class="card-desc">Nilai ini dibaca dari frontend/config.js.</p>
          <div class="list">
            <div class="list-row"><span>Mode</span><b>${supabaseClient ? 'Supabase' : 'Demo lokal'}</b></div>
            <div class="list-row"><span>URL Supabase</span><b>${supabaseClient ? 'Terisi' : 'Belum diisi'}</b></div>
            <div class="list-row"><span>Auth</span><b>${supabaseClient ? 'Aktif' : 'Demo bypass'}</b></div>
          </div>
        </div>
        <div class="card">
          <h3 class="card-title">Distribusi</h3>
          <p class="card-desc">Siap untuk Vercel static hosting. Gunakan Supabase anon key, bukan service role key.</p>
          <div class="notice">Setelah deploy, jalankan SQL schema di Supabase, isi config.js, lalu test register dan checkout publik.</div>
        </div>
      </div>
    `;
    return pageShell('Pengaturan', 'Konfigurasi aplikasi, backend, dan readiness produksi.', '', content);
  }

  function renderPublic() {
    if (!state.publicStore) {
      return renderStoreShell(`<div class="notice error">Toko tidak ditemukan atau belum dipublish.</div>`);
    }
    if (state.route.page === 'checkout') return renderCheckout();
    if (state.route.page === 'success') return renderSuccess();
    return renderStorefront();
  }

  function renderStoreShell(content) {
    const store = state.publicStore || demo.store;
    return `
      <div class="store-shell">
        <nav class="store-nav">
          <div class="store-brand">
            <div class="store-logo">${store.logo_url ? `<img src="${escapeAttr(store.logo_url)}" alt="">` : initials(store.name || 'TK')}</div>
            <div style="min-width:0">
              <div class="row-title">${escapeHtml(store.name || 'TokoKit Store')}</div>
              <div class="small-muted">Powered by TokoKit</div>
            </div>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="TokoKit.go('/checkout/${store.slug}')">Cart (${cartCount()})</button>
          </div>
        </nav>
        <main class="store-main">
          ${state.error ? `<div class="notice error" style="margin-bottom:16px">${escapeHtml(state.error)}</div>` : ''}
          ${content}
        </main>
        ${state.modal?.type === 'publicProduct' ? renderPublicProductModal() : ''}
      </div>
    `;
  }

  function renderStorefront() {
    const store = state.publicStore;
    const products = state.publicProducts;
    const content = `
      <section class="hero" style="background:${escapeAttr(store.brand_color || '#0f172a')}">
        <div>
          ${badge('Published', 'success')}
          <h1>${escapeHtml(store.name)}</h1>
          <p>${escapeHtml(store.description || 'Pilih produk, checkout tanpa akun, lalu konfirmasi pembayaran melalui WhatsApp.')}</p>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})">Lihat Produk</button>
            <button class="btn" onclick="TokoKit.openWhatsApp()">Chat WhatsApp</button>
          </div>
        </div>
        <div class="hero-panel">
          <div>
            <div style="font-size:44px;font-weight:950">${escapeHtml(store.business_type || 'UMKM')}</div>
            <div style="color:#dbeafe;margin-top:10px">${escapeHtml(store.address || 'Indonesia')}</div>
          </div>
        </div>
      </section>
      <section id="products" class="product-grid">
        ${products.length ? products.map(renderPublicProduct).join('') : `<div class="empty">Toko ini belum punya produk aktif.</div>`}
      </section>
      ${cartCount() ? `<button class="cart-floating" onclick="TokoKit.go('/checkout/${store.slug}')">Cart (${cartCount()}) - ${currency(cartTotal())}</button>` : ''}
    `;
    return renderStoreShell(content);
  }

  function renderCheckout() {
    const store = state.publicStore;
    const requiresAddress = cartRequiresAddress();
    const shippingFee = requiresAddress ? Number(store.shipping_fee || 0) : 0;
    const total = cartTotal() + shippingFee;
    const checkoutNote = requiresAddress
      ? 'Cart berisi produk delivery, jadi alamat pengiriman wajib diisi.'
      : 'Cart hanya berisi produk digital, jasa, atau pickup. Alamat pengiriman tidak diperlukan.';
    const content = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Checkout</h1>
          <p class="page-subtitle">${checkoutNote}</p>
        </div>
      </div>
      ${!state.cart.length ? `<div class="empty">Keranjang masih kosong. <button class="btn btn-primary" onclick="TokoKit.go('/store/${store.slug}')">Pilih produk</button></div>` : `
      <form class="checkout-layout" onsubmit="TokoKit.createPublicOrder(event)">
        <div class="grid">
          <div class="card">
            <h3 class="card-title">Data Pembeli</h3>
            <div class="form-grid">
              ${input('buyer_name', 'Nama lengkap', '', true)}
              ${input('buyer_whatsapp', 'Nomor WhatsApp', '', true)}
              ${input('buyer_email', 'Email opsional', '', false, 'email')}
              <label class="field"><span class="label">Metode pembayaran</span><select class="select" name="payment_method" onchange="TokoKit.previewPaymentMethod(this.value)"><option value="manual_transfer">Transfer Bank</option><option value="qris">QRIS Manual</option></select></label>
            </div>
            <br>
            ${requiresAddress ? `${textarea('buyer_address', 'Alamat pengiriman', '')}<br>` : `<input type="hidden" name="buyer_address" value=""><div class="notice">Alamat tidak dibutuhkan untuk digital, jasa, atau ambil di toko.</div><br>`}
            ${textarea('notes', 'Catatan pesanan', '')}
          </div>
          <div class="card">
            <h3 class="card-title">Instruksi Pembayaran</h3>
            <div id="paymentPreview">${renderPaymentInstruction(store, { payment_method: 'manual_transfer' }, 'checkout')}</div>
          </div>
        </div>
        <aside class="card">
          <h3 class="card-title">Ringkasan Pesanan</h3>
          <div class="list">
            ${state.cart.map((item) => `
              <div class="list-row">
                <div class="row-main"><div class="thumb">${productInitial(item.name)}</div><div><div class="row-title">${escapeHtml(item.name)}</div><div class="row-meta">${currency(item.price)} x ${item.qty} - ${fulfillmentLabel(item.fulfillment_type || 'pickup')}</div></div></div>
                <div class="page-actions"><button type="button" class="btn btn-small" onclick="TokoKit.updateCartQty('${item.id}', -1)">-</button><button type="button" class="btn btn-small" onclick="TokoKit.updateCartQty('${item.id}', 1)">+</button></div>
              </div>
            `).join('')}
            <div class="list-row"><span>Subtotal</span><b>${currency(cartTotal())}</b></div>
            <div class="list-row"><span>Ongkir</span><b>${currency(shippingFee)}</b></div>
            <div class="list-row" style="background:#eaf1ff"><span>Total</span><b>${currency(total)}</b></div>
          </div>
          <br>
          <button type="button" class="btn btn-danger btn-block" onclick="TokoKit.clearCart()">Kosongkan Cart</button>
          <br>
          <button class="btn btn-primary btn-block" ${state.saving ? 'disabled' : ''}>${state.saving ? 'Membuat pesanan...' : 'Buat Pesanan'}</button>
        </aside>
      </form>`}
    `;
    return renderStoreShell(content);
  }

  function renderSuccess() {
    const store = state.publicStore || demo.store;
    const order = state.lastOrder || { order_number: state.route.orderNumber, buyer_name: '-', total_amount: cartTotal(), payment_status: 'unpaid' };
    const content = `
      <div class="card" style="max-width:860px;margin:0 auto;text-align:center">
        <div class="success-icon">OK</div>
        <h1 class="page-title">Pesanan Berhasil Dibuat</h1>
        <p class="page-subtitle">Simpan nomor pesanan dan lakukan pembayaran sesuai instruksi toko.</p>
        <br>
        <div class="grid grid-2" style="text-align:left">
          <div class="card">
            <h3 class="card-title">Informasi Pesanan</h3>
            <div class="list">
              <div class="list-row"><span>Nomor</span><b>${escapeHtml(order.order_number || '-')}</b></div>
              <div class="list-row"><span>Pembeli</span><b>${escapeHtml(order.buyer_name || '-')}</b></div>
              <div class="list-row"><span>Total</span><b>${currency(order.total_amount)}</b></div>
              <div class="list-row"><span>Status</span>${statusBadge(order.payment_status, 'payment')}</div>
            </div>
          </div>
          <div class="card">
            <h3 class="card-title">Pembayaran</h3>
            ${renderPaymentInstruction(store, order, 'success')}
          </div>
        </div>
        <br>
        <div class="page-actions" style="justify-content:center">
          <button class="btn" onclick="TokoKit.go('/store/${store.slug}')">Kembali ke Toko</button>
          ${gatewayPaymentUrl(store, order) ? `<a class="btn btn-secondary" href="${escapeAttr(gatewayPaymentUrl(store, order))}" target="_blank" rel="noopener">Bayar via ${escapeHtml(gatewayLabel(gatewayProvider(store)))}</a>` : ''}
          <button class="btn btn-primary" onclick="TokoKit.openWhatsApp('${escapeAttr(order.order_number || '')}')">Konfirmasi via WhatsApp</button>
        </div>
      </div>
    `;
    return renderStoreShell(content);
  }

  function renderPublicProduct(product) {
    const digitalOut = effectiveFulfillment(product) === 'digital' && Number(product.stock || 0) <= 0;
    return `
      <article class="product-card">
        <button class="product-img product-img-button" onclick="TokoKit.viewProduct('${product.id}')" aria-label="Lihat detail ${escapeAttr(product.name)}">${product.image_url ? `<img src="${escapeAttr(product.image_url)}" alt="">` : productInitial(product.name)}</button>
        <div class="product-body">
          <div class="page-actions">${statusBadge(product.product_type, 'type')}${statusBadge(effectiveFulfillment(product), 'fulfillment')}${digitalOut ? badge('Stok digital habis', 'danger') : Number(product.stock || 0) <= 3 ? badge('Stok terbatas', 'warning') : badge('Ready', 'success')}</div>
          <div>
            <h3 class="card-title">${escapeHtml(product.name)}</h3>
            <p class="card-desc">${escapeHtml(product.description || product.category || '')}</p>
          </div>
          <div class="price">${currency(product.price)}</div>
          <div class="product-actions">
            <button class="btn" onclick="TokoKit.viewProduct('${product.id}')">Detail</button>
            <button class="btn btn-secondary" onclick="TokoKit.addToCart('${product.id}')" ${digitalOut ? 'disabled' : ''}>Tambah Cart</button>
            <button class="btn btn-primary" onclick="TokoKit.buyNow('${product.id}')" ${digitalOut ? 'disabled' : ''}>Beli Sekarang</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderPublicProductModal() {
    const product = state.modal.product;
    if (!product) return '';
    const digitalOut = effectiveFulfillment(product) === 'digital' && Number(product.stock || 0) <= 0;
    return `
      <div class="modal-backdrop">
        <div class="modal product-detail-modal">
          <div class="modal-header">
            <div>
              <h3 class="card-title">${escapeHtml(product.name)}</h3>
              <p class="card-desc">${escapeHtml(product.category || 'Produk toko')}</p>
            </div>
            <button type="button" class="btn btn-ghost" onclick="TokoKit.closeModal()">Tutup</button>
          </div>
          <div class="product-detail-layout">
            <div class="product-detail-image">${product.image_url ? `<img src="${escapeAttr(product.image_url)}" alt="">` : productInitial(product.name)}</div>
            <div class="grid">
              <div class="page-actions">
                ${statusBadge(product.product_type, 'type')}
                ${statusBadge(effectiveFulfillment(product), 'fulfillment')}
                ${digitalOut ? badge('Stok digital habis', 'danger') : Number(product.stock || 0) <= 3 ? badge('Stok terbatas', 'warning') : badge('Ready', 'success')}
              </div>
              <div>
                <div class="price">${currency(product.price)}</div>
                ${Number(product.compare_at_price || 0) ? `<div class="small-muted"><s>${currency(product.compare_at_price)}</s></div>` : ''}
              </div>
              <p class="card-desc" style="font-size:15px">${escapeHtml(product.description || 'Tidak ada deskripsi produk.')}</p>
              <div class="list">
                <div class="list-row"><span>Stok</span><b>${Number(product.stock || 0)}</b></div>
                <div class="list-row"><span>SKU</span><b>${escapeHtml(product.sku || '-')}</b></div>
                <div class="list-row"><span>Penjualan</span><b>${fulfillmentLabel(effectiveFulfillment(product))}</b></div>
              </div>
              <div class="product-actions">
                <button class="btn btn-secondary" onclick="TokoKit.addToCart('${product.id}')" ${digitalOut ? 'disabled' : ''}>Tambah ke Cart</button>
                <button class="btn btn-primary" onclick="TokoKit.buyNow('${product.id}')" ${digitalOut ? 'disabled' : ''}>Beli Sekarang</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderProductsTable(products) {
    return `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Tipe</th><th>Penjualan</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${products.map((product) => `
              <tr>
                <td><div class="row-main"><div class="thumb">${product.image_url ? `<img src="${escapeAttr(product.image_url)}" alt="">` : productInitial(product.name)}</div><div><div class="row-title">${escapeHtml(product.name)}</div><div class="row-meta">${escapeHtml(product.sku || product.slug || '-')}</div></div></div></td>
                <td>${escapeHtml(product.category || '-')}</td>
                <td><b>${currency(product.price)}</b>${Number(product.compare_at_price || 0) ? `<div class="row-meta"><s>${currency(product.compare_at_price)}</s></div>` : ''}</td>
                <td>${Number(product.stock || 0)}</td>
                <td>${statusBadge(product.product_type, 'type')}</td>
                <td>${statusBadge(effectiveFulfillment(product), 'fulfillment')}</td>
                <td>${statusBadge(product.status, 'product')}</td>
                <td><div class="page-actions"><button class="btn btn-small" onclick="TokoKit.openProductModal('${product.id}')">Edit</button><button class="btn btn-danger btn-small" onclick="TokoKit.archiveProduct('${product.id}')">Archive</button></div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderInventoryTable(items) {
    return `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Produk</th><th>Payload</th><th>Status</th><th>Order</th><th>Aksi</th></tr></thead>
          <tbody>
            ${items.map((item) => {
              const product = productById(item.product_id);
              return `
                <tr>
                  <td><b>${escapeHtml(item.label || '-')}</b><div class="row-meta">${escapeHtml(item.note || '-')}</div></td>
                  <td>${escapeHtml(product?.name || item.product_id || '-')}<div class="row-meta">${escapeHtml(product?.sku || '-')}</div></td>
                  <td><code class="inline-code">${escapeHtml(maskPayload(item.payload))}</code></td>
                  <td>${statusBadge(item.status, 'inventory')}</td>
                  <td>${escapeHtml(orderNumberById(item.order_id) || '-')}</td>
                  <td><div class="page-actions"><button class="btn btn-small" onclick="TokoKit.openInventoryModal('${item.id}')">Edit</button><button class="btn btn-danger btn-small" onclick="TokoKit.deleteInventoryItem('${item.id}')">Hapus</button></div></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderStockMovements(items) {
    return `
      <div class="list">
        ${items.map((item) => `
          <div class="list-row">
            <div>
              <b>${escapeHtml(stockMovementLabel(item.movement_type))}</b>
              <div class="row-meta">${escapeHtml(productById(item.product_id)?.name || '-')} - ${formatDate(item.created_at)}</div>
            </div>
            <b>${Number(item.quantity_delta || 0) > 0 ? '+' : ''}${Number(item.quantity_delta || 0)}</b>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderOrdersTable(orders, compact) {
    return `
      <div class="table-wrap">
        <table>
          <thead><tr><th>No.</th><th>Pembeli</th><th>Total</th><th>Metode</th><th>Bayar</th><th>Pesanan</th>${compact ? '' : '<th>Aksi</th>'}</tr></thead>
          <tbody>
            ${orders.map((order) => `
              <tr>
                <td><b>${escapeHtml(order.order_number || '-')}</b><div class="row-meta">${formatDate(order.created_at)}</div></td>
                <td><b>${escapeHtml(order.buyer_name || '-')}</b><div class="row-meta">${escapeHtml(order.buyer_whatsapp || '-')}</div></td>
                <td><b>${currency(order.total_amount)}</b></td>
                <td>${statusBadge(order.payment_method, 'method')}</td>
                <td>${statusBadge(order.payment_status, 'payment')}</td>
                <td>${statusBadge(order.order_status, 'order')}</td>
                ${compact ? '' : `<td><div class="page-actions">
                  <button class="btn btn-small" onclick="TokoKit.openOrderDetail('${order.id}')">Detail</button>
                  <select class="select" style="width:145px" onchange="TokoKit.updatePaymentStatus('${order.id}', this.value)"><option value="unpaid" ${order.payment_status === 'unpaid' ? 'selected' : ''}>Unpaid</option><option value="paid" ${order.payment_status === 'paid' ? 'selected' : ''}>Paid</option><option value="failed" ${order.payment_status === 'failed' ? 'selected' : ''}>Failed</option></select>
                  <select class="select" style="width:160px" onchange="TokoKit.updateOrderStatus('${order.id}', this.value)"><option value="new" ${order.order_status === 'new' ? 'selected' : ''}>Baru</option><option value="processing" ${order.order_status === 'processing' ? 'selected' : ''}>Diproses</option><option value="shipped" ${order.order_status === 'shipped' ? 'selected' : ''}>Dikirim</option><option value="completed" ${order.order_status === 'completed' ? 'selected' : ''}>Selesai</option><option value="cancelled" ${order.order_status === 'cancelled' ? 'selected' : ''}>Batal</option></select>
                </div></td>`}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderProductModal() {
    const product = state.modal.product || {};
    return `
      <div class="modal-backdrop">
        <form class="modal" onsubmit="TokoKit.saveProduct(event)">
          <div class="modal-header">
            <div>
              <h3 class="card-title">${product.id ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <p class="card-desc">Produk aktif akan tampil di storefront publik.</p>
            </div>
            <button type="button" class="btn btn-ghost" onclick="TokoKit.closeModal()">Tutup</button>
          </div>
          <input type="hidden" name="id" value="${escapeAttr(product.id || '')}">
          <div class="form-grid">
            ${input('name', 'Nama produk', product.name || '', true)}
            ${input('sku', 'SKU', product.sku || '')}
            ${input('category', 'Kategori', product.category || '')}
            ${input('price', 'Harga', product.price || 0, true, 'number')}
            ${input('compare_at_price', 'Harga coret', product.compare_at_price || 0, false, 'number')}
            ${input('stock', 'Stok manual (non-digital)', effectiveFulfillment(product) === 'digital' ? digitalAvailableCount(product.id) : product.stock || 0, true, 'number')}
            <label class="field"><span class="label">Tipe produk</span><select class="select" name="product_type"><option value="physical" ${product.product_type === 'physical' ? 'selected' : ''}>Physical</option><option value="preorder" ${product.product_type === 'preorder' ? 'selected' : ''}>Preorder</option><option value="digital" ${product.product_type === 'digital' ? 'selected' : ''}>Digital</option><option value="service" ${product.product_type === 'service' ? 'selected' : ''}>Service</option></select></label>
            <label class="field"><span class="label">Cara penjualan</span><select class="select" name="fulfillment_type">
              <option value="pickup" ${effectiveFulfillment(product) === 'pickup' ? 'selected' : ''}>Ambil di toko</option>
              <option value="delivery" ${effectiveFulfillment(product) === 'delivery' ? 'selected' : ''}>Delivery pakai alamat</option>
              <option value="digital" ${effectiveFulfillment(product) === 'digital' ? 'selected' : ''}>Digital tanpa alamat</option>
              <option value="preorder_pickup" ${effectiveFulfillment(product) === 'preorder_pickup' ? 'selected' : ''}>Preorder ambil di toko</option>
            </select></label>
            <label class="field"><span class="label">Status</span><select class="select" name="status"><option value="active" ${product.status === 'active' ? 'selected' : ''}>Active</option><option value="draft" ${product.status === 'draft' ? 'selected' : ''}>Draft</option><option value="archived" ${product.status === 'archived' ? 'selected' : ''}>Archived</option></select></label>
            ${input('image_url', 'URL gambar produk', product.image_url || '')}
            ${fileInput('image_file', 'Upload gambar produk')}
          </div>
          <p class="small-muted">Untuk produk digital, stok publik tidak diambil dari field ini. Stok digital dihitung dari item available di menu Inventori.</p>
          <br>
          ${textarea('description', 'Deskripsi', product.description || '')}
          <br>
          <div class="card" style="box-shadow:none">
            <h3 class="card-title">Pengiriman Digital Otomatis</h3>
            <p class="card-desc">Diisi untuk produk digital seperti voucher, akun, license key, top up, atau file. Nanti setelah payment dinamis terdeteksi paid, isi ini bisa dikirim ke email pembeli.</p>
            <div class="form-grid">
              <label class="field"><span class="label">Status auto-delivery</span><select class="select" name="digital_delivery_enabled"><option value="false" ${!product.digital_delivery_enabled ? 'selected' : ''}>Nonaktif</option><option value="true" ${product.digital_delivery_enabled ? 'selected' : ''}>Aktif untuk produk digital</option></select></label>
              ${input('delivery_subject', 'Subject email', product.delivery_subject || 'Pesanan digital kamu dari TokoKit')}
            </div>
            <br>
            ${textarea('delivery_message', 'Pesan email / instruksi', product.delivery_message || 'Terima kasih. Berikut detail pesanan digital kamu:')}
            <br>
            ${textarea('digital_stock_notes', 'Catatan stok legacy', product.digital_stock_notes || '')}
            <p class="small-muted">Stok siap kirim sekarang dikelola di menu Inventori agar bisa import/export CSV dan di-reserve per order.</p>
          </div>
          <br>
          <button class="btn btn-primary btn-block" ${state.saving ? 'disabled' : ''}>${state.saving ? 'Menyimpan...' : 'Simpan Produk'}</button>
        </form>
      </div>
    `;
  }

  function renderInventoryModal() {
    const item = state.modal.item || {};
    const digitalProducts = state.products.filter((product) => effectiveFulfillment(product) === 'digital' || product.product_type === 'digital');
    return `
      <div class="modal-backdrop">
        <form class="modal" onsubmit="TokoKit.saveInventoryItem(event)">
          <div class="modal-header">
            <div>
              <h3 class="card-title">${item.id ? 'Edit Stok Digital' : 'Tambah Stok Digital'}</h3>
              <p class="card-desc">Isi payload hanya terlihat seller. Jangan taruh data sensitif di nama produk publik.</p>
            </div>
            <button type="button" class="btn btn-ghost" onclick="TokoKit.closeModal()">Tutup</button>
          </div>
          <input type="hidden" name="id" value="${escapeAttr(item.id || '')}">
          <div class="form-grid">
            <label class="field"><span class="label">Produk digital</span><select class="select" name="product_id" required>
              <option value="">Pilih produk</option>
              ${digitalProducts.map((product) => `<option value="${product.id}" ${item.product_id === product.id ? 'selected' : ''}>${escapeHtml(product.name)}${product.sku ? ` (${escapeHtml(product.sku)})` : ''}</option>`).join('')}
            </select></label>
            ${input('label', 'Label item', item.label || '', true)}
            <label class="field"><span class="label">Status</span><select class="select" name="status">
              ${['available', 'reserved', 'sold', 'delivered', 'cancelled'].map((status) => `<option value="${status}" ${(item.status || 'available') === status ? 'selected' : ''}>${inventoryStatusLabel(status)}</option>`).join('')}
            </select></label>
            ${input('note', 'Catatan internal', item.note || '')}
          </div>
          <br>
          ${textarea('payload', 'Payload siap kirim', item.payload || '')}
          <p class="small-muted">Contoh payload: email akun, password, license key, link file, PIN voucher, atau instruksi khusus.</p>
          <br>
          <button class="btn btn-primary btn-block" ${state.saving ? 'disabled' : ''}>${state.saving ? 'Menyimpan...' : 'Simpan Stok'}</button>
        </form>
      </div>
    `;
  }

  function renderOrderDetailModal() {
    const order = state.modal.order;
    if (!order) return '';
    const items = state.orderItems.filter((item) => item.order_id === order.id);
    const reservedItems = state.inventoryItems.filter((item) => item.order_id === order.id);
    const logs = state.fulfillmentLogs.filter((log) => log.order_id === order.id).slice(0, 8);
    return `
      <div class="modal-backdrop">
        <div class="modal order-detail-modal">
          <div class="modal-header">
            <div>
              <h3 class="card-title">Detail Pesanan ${escapeHtml(order.order_number || '-')}</h3>
              <p class="card-desc">${escapeHtml(order.buyer_name || '-')} - ${escapeHtml(order.buyer_whatsapp || '-')}</p>
            </div>
            <button type="button" class="btn btn-ghost" onclick="TokoKit.closeModal()">Tutup</button>
          </div>
          <div class="grid grid-2">
            <div class="card" style="box-shadow:none">
              <h3 class="card-title">Ringkasan</h3>
              <div class="list">
                <div class="list-row"><span>Total</span><b>${currency(order.total_amount)}</b></div>
                <div class="list-row"><span>Pembayaran</span>${statusBadge(order.payment_status, 'payment')}</div>
                <div class="list-row"><span>Pesanan</span>${statusBadge(order.order_status, 'order')}</div>
                <div class="list-row"><span>Metode</span>${statusBadge(order.payment_method, 'method')}</div>
                <div class="list-row"><span>Fulfillment</span>${statusBadge(order.fulfillment_type, 'fulfillment')}</div>
              </div>
            </div>
            <div class="card" style="box-shadow:none">
              <h3 class="card-title">Data Buyer</h3>
              <div class="list">
                <div class="list-row"><span>Email</span><b>${escapeHtml(order.buyer_email || '-')}</b></div>
                <div class="list-row"><span>Alamat</span><b>${escapeHtml(order.buyer_address || '-')}</b></div>
                <div class="list-row"><span>Catatan</span><b>${escapeHtml(order.notes || '-')}</b></div>
              </div>
            </div>
          </div>
          <br>
          <div class="card" style="box-shadow:none">
            <h3 class="card-title">Item Pesanan</h3>
            ${items.length ? renderOrderItemsList(items) : emptyState('Item pesanan belum termuat. Refresh data jika baru membuat order.')}
          </div>
          <br>
          <div class="grid grid-2">
            <div class="card" style="box-shadow:none">
              <h3 class="card-title">Stok Digital Terpakai</h3>
              ${reservedItems.length ? renderReservedInventory(reservedItems) : emptyState('Belum ada stok digital yang di-reserve untuk order ini.')}
            </div>
            <div class="card" style="box-shadow:none">
              <h3 class="card-title">Log Fulfillment</h3>
              ${logs.length ? renderFulfillmentLogs(logs) : emptyState('Belum ada log fulfillment.')}
            </div>
          </div>
          <br>
          <div class="page-actions">
            <button class="btn btn-secondary" onclick="TokoKit.updatePaymentStatus('${order.id}', 'paid')">Mark Paid & Reserve Digital</button>
            <button class="btn" onclick="TokoKit.updateOrderStatus('${order.id}', 'processing')">Proses</button>
            <button class="btn btn-primary" onclick="TokoKit.updateOrderStatus('${order.id}', 'completed')">Selesai</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderOrderItemsList(items) {
    return `<div class="list">${items.map((item) => `<div class="list-row"><span>${escapeHtml(item.product_name)}<div class="row-meta">${fulfillmentLabel(item.fulfillment_type)}</div></span><b>${item.quantity} x ${currency(item.unit_price)}</b></div>`).join('')}</div>`;
  }

  function renderReservedInventory(items) {
    return `<div class="list">${items.map((item) => `<div class="list-row"><span><b>${escapeHtml(item.label)}</b><div class="row-meta"><code class="inline-code">${escapeHtml(item.payload || '-')}</code></div></span>${statusBadge(item.status, 'inventory')}</div>`).join('')}</div>`;
  }

  function renderFulfillmentLogs(logs) {
    return `<div class="list">${logs.map((log) => `<div class="list-row"><span><b>${escapeHtml(fulfillmentActionLabel(log.action))}</b><div class="row-meta">${escapeHtml(log.message || '-')}</div></span>${statusBadge(log.status, 'inventory')}</div>`).join('')}</div>`;
  }

  async function login(event) {
    event.preventDefault();
    const payload = formValues(event.target);
    state.authForm = { ...state.authForm, email: payload.email || '', password: payload.password || '' };
    state.saving = true;
    state.error = '';
    render();
    try {
      if (!supabaseClient) {
        go('/app/dashboard');
        return;
      }
      const { error } = await supabaseClient.auth.signInWithPassword({ email: payload.email, password: payload.password });
      if (error) throw error;
      state.authForm = { full_name: '', email: '', password: '' };
      go('/app/dashboard');
    } catch (error) {
      state.saving = false;
      state.error = error.message;
    } finally {
      state.saving = false;
      render();
    }
  }

  async function register(event) {
    event.preventDefault();
    const payload = formValues(event.target);
    state.authForm = { full_name: payload.full_name || '', email: payload.email || '', password: payload.password || '' };
    state.saving = true;
    state.error = '';
    render();
    try {
      if (!supabaseClient) {
        go('/app/dashboard');
        return;
      }
      const { error } = await supabaseClient.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: { data: { full_name: payload.full_name } }
      });
      if (error) throw error;
      state.notice = 'Akun dibuat. Jika email confirmation aktif, cek inbox sebelum login.';
      state.authForm = { full_name: '', email: payload.email || '', password: '' };
      history.pushState({}, '', '/login');
      state.route = parseRoute();
    } catch (error) {
      state.saving = false;
      state.error = error.message;
    } finally {
      state.saving = false;
      render();
    }
  }

  async function logout() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    state.session = null;
    go('/login');
  }

  async function saveStore(event) {
    event.preventDefault();
    const form = event.target;
    const values = formValues(event.target);
    state.saving = true;
    state.error = '';
    render();
    try {
      values.logo_url = await maybeUploadFile(form.elements.logo_file?.files?.[0], 'logos', values.logo_url);
      values.banner_url = await maybeUploadFile(form.elements.banner_file?.files?.[0], 'banners', values.banner_url);
      values.qris_image_url = await maybeUploadFile(form.elements.qris_file?.files?.[0], 'qris', values.qris_image_url);
    } catch (error) {
      state.error = error.message;
      state.saving = false;
      render();
      return;
    }
    const payload = {
      name: values.name,
      slug: slugify(values.slug),
      business_type: values.business_type,
      email: values.email,
      description: values.description,
      whatsapp: values.whatsapp,
      address: values.address,
      bank_name: values.bank_name,
      bank_account_number: values.bank_account_number,
      bank_account_name: values.bank_account_name,
      qris_image_url: values.qris_image_url,
      payment_instruction: values.payment_instruction,
      fulfillment_mode: values.fulfillment_mode,
      shipping_fee: Number(values.shipping_fee || 0),
      pickup_note: values.pickup_note,
      pakasir_slug: values.pakasir_slug,
      payment_gateway_provider: values.payment_gateway_provider || 'manual',
      payment_gateway_project_id: values.pakasir_slug,
      payment_gateway_checkout_url: values.payment_gateway_checkout_url,
      payment_gateway_enabled: (values.payment_gateway_provider || 'manual') !== 'manual',
      brand_color: values.brand_color,
      logo_url: values.logo_url,
      banner_url: values.banner_url,
      is_active: values.is_active === 'true',
      updated_at: today()
    };
    await saveRecord('stores', state.store.id, payload, (record) => {
      state.store = { ...state.store, ...record };
      writeJson('tokokit:demoStore', state.store);
    });
    state.notice = 'Toko berhasil disimpan.';
    render();
  }

  function openProductModal(id) {
    const product = id ? state.products.find((item) => item.id === id) : null;
    state.modal = { type: 'product', product: product || { status: 'active', product_type: 'physical', stock: 0, price: 0 } };
    render();
  }

  function closeModal() {
    state.modal = null;
    render();
  }

  async function saveProduct(event) {
    event.preventDefault();
    const form = event.target;
    const values = formValues(event.target);
    try {
      values.image_url = await maybeUploadFile(form.elements.image_file?.files?.[0], 'products', values.image_url);
    } catch (error) {
      state.error = error.message;
      render();
      return;
    }
    const id = values.id;
    const fulfillmentType = values.fulfillment_type || fallbackFulfillment({ product_type: values.product_type });
    const isDigitalProduct = values.product_type === 'digital' || fulfillmentType === 'digital';
    const payload = {
      tenant_id: state.store.tenant_id,
      store_id: state.store.id,
      name: values.name,
      slug: slugify(values.name),
      sku: values.sku,
      category: values.category,
      description: values.description,
      price: Number(values.price || 0),
      compare_at_price: Number(values.compare_at_price || 0),
      stock: isDigitalProduct ? digitalAvailableCount(id) : Number(values.stock || 0),
      product_type: values.product_type,
      fulfillment_type: fulfillmentType,
      status: values.status,
      image_url: values.image_url,
      digital_delivery_enabled: values.digital_delivery_enabled === 'true',
      delivery_subject: values.delivery_subject,
      delivery_message: values.delivery_message,
      digital_stock_notes: values.digital_stock_notes,
      updated_at: today()
    };

    state.saving = true;
    render();
    try {
      if (supabaseClient) {
        if (id) {
          const { data, error } = await supabaseClient.from('products').update(payload).eq('id', id).select().single();
          if (error) throw error;
          state.products = state.products.map((product) => product.id === id ? data : product);
        } else {
          const { data, error } = await supabaseClient.from('products').insert(payload).select().single();
          if (error) throw error;
          state.products.unshift(data);
        }
      } else {
        if (id) state.products = state.products.map((product) => product.id === id ? { ...product, ...payload } : product);
        else state.products.unshift({ ...payload, id: 'prd-' + Date.now(), created_at: today() });
        writeJson('tokokit:demoProducts', state.products);
      }
      state.modal = null;
      state.notice = 'Produk berhasil disimpan.';
    } catch (error) {
      state.error = error.message;
    } finally {
      state.saving = false;
      render();
    }
  }

  async function archiveProduct(id) {
    await saveRecord('products', id, { status: 'archived', updated_at: today() }, (record) => {
      state.products = state.products.map((product) => product.id === id ? { ...product, ...record } : product);
      writeJson('tokokit:demoProducts', state.products);
    });
    state.notice = 'Produk diarsipkan.';
    render();
  }

  function openInventoryModal(id) {
    const item = id ? state.inventoryItems.find((record) => record.id === id) : null;
    state.modal = { type: 'inventory', item: item || { status: 'available', product_id: state.products.find((product) => effectiveFulfillment(product) === 'digital')?.id || '' } };
    render();
  }

  async function saveInventoryItem(event) {
    event.preventDefault();
    const values = formValues(event.target);
    const id = values.id;
    const product = productById(values.product_id);
    if (!product) {
      state.error = 'Pilih produk digital yang valid.';
      render();
      return;
    }
    const payload = {
      tenant_id: state.store.tenant_id,
      store_id: state.store.id,
      product_id: values.product_id,
      label: values.label,
      payload: values.payload,
      status: values.status || 'available',
      note: values.note,
      updated_at: today()
    };
    state.saving = true;
    state.error = '';
    render();
    try {
      if (supabaseClient) {
        if (id) {
          const { data, error } = await supabaseClient.from('inventory_items').update(payload).eq('id', id).select().single();
          if (error) throw error;
          state.inventoryItems = state.inventoryItems.map((item) => item.id === id ? data : item);
        } else {
          const { data, error } = await supabaseClient.from('inventory_items').insert(payload).select().single();
          if (error) throw error;
          state.inventoryItems.unshift(data);
          await createStockMovement(values.product_id, 'manual_adjustment', payload.status === 'available' ? 1 : 0, 'Tambah stok digital manual');
        }
      } else {
        if (id) state.inventoryItems = state.inventoryItems.map((item) => item.id === id ? { ...item, ...payload } : item);
        else state.inventoryItems.unshift({ ...payload, id: 'inv-' + Date.now(), created_at: today() });
        writeJson('tokokit:demoInventoryItems', state.inventoryItems);
      }
      await syncDigitalProductStock(values.product_id);
      state.modal = null;
      state.notice = 'Stok digital berhasil disimpan.';
    } catch (error) {
      state.error = error.message;
    } finally {
      state.saving = false;
      render();
    }
  }

  async function deleteInventoryItem(id) {
    const item = state.inventoryItems.find((record) => record.id === id);
    if (!item) return;
    if (!['available', 'cancelled'].includes(item.status)) {
      state.error = 'Stok yang sudah reserved, sold, atau delivered tidak boleh dihapus agar riwayat order tetap aman.';
      render();
      return;
    }
    if (!confirm('Hapus stok digital ini? Payload tidak bisa dikembalikan setelah dihapus.')) return;
    state.saving = true;
    state.error = '';
    try {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('inventory_items').delete().eq('id', id);
        if (error) throw error;
      }
      state.inventoryItems = state.inventoryItems.filter((record) => record.id !== id);
      writeJson('tokokit:demoInventoryItems', state.inventoryItems);
      await createStockMovement(item.product_id, 'manual_adjustment', item.status === 'available' ? -1 : 0, 'Hapus stok digital');
      await syncDigitalProductStock(item.product_id);
      state.notice = 'Stok digital dihapus.';
    } catch (error) {
      state.error = error.message;
    } finally {
      state.saving = false;
      render();
    }
  }

  function updateInventoryFilter(field, value) {
    state.inventoryFilters[field] = value;
    render();
  }

  async function handleInventoryImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importInventoryText(text, `Upload CSV ${file.name}`);
    } catch (error) {
      state.error = error.message;
    } finally {
      event.target.value = '';
      render();
    }
  }

  async function handleInventoryPaste() {
    try {
      if (!String(state.inventoryImport.paste || '').trim()) throw new Error('Paste data spreadsheet dulu.');
      await importInventoryText(state.inventoryImport.paste, 'Paste spreadsheet');
      state.inventoryImport.paste = '';
    } catch (error) {
      state.error = error.message;
    } finally {
      render();
    }
  }

  async function importInventoryFromUrl() {
    try {
      const url = String(state.inventoryImport.url || '').trim();
      if (!url) throw new Error('Isi URL CSV publik dulu.');
      writeJson('tokokit:inventoryCsvUrl', url);
      state.saving = true;
      render();
      const response = await fetch(url);
      if (!response.ok) throw new Error('Gagal mengambil CSV. Pastikan Google Sheet sudah Publish to web sebagai CSV.');
      const text = await response.text();
      await importInventoryText(text, 'Import URL CSV');
    } catch (error) {
      state.error = error.message;
    } finally {
      state.saving = false;
      render();
    }
  }

  function updateInventoryImportField(field, value) {
    state.inventoryImport[field] = value;
    if (field === 'url') writeJson('tokokit:inventoryCsvUrl', value);
  }

  async function importInventoryText(text, sourceLabel) {
    state.saving = true;
    state.error = '';
    render();
    const rows = parseCsv(normalizeSpreadsheetText(text));
    if (!rows.length) throw new Error('Data kosong. Pastikan baris pertama berisi header.');
    const headers = rows[0].map((cell) => normalizeHeader(cell));
    const required = headers.includes('product_id') || headers.includes('product_sku') || headers.includes('sku');
    if (!required || !headers.includes('label') || !headers.includes('payload')) {
      throw new Error('Header wajib: product_sku atau product_id, label, payload. Kolom opsional: status, note.');
    }
    const body = rows.slice(1).filter((row) => row.some((cell) => String(cell || '').trim()));
    const imported = [];
    const errors = [];
    const seen = new Set(state.inventoryItems.map((item) => duplicateInventoryKey(item.product_id, item.label, item.payload)));
    body.forEach((row, index) => {
      const record = Object.fromEntries(headers.map((header, idx) => [header, row[idx] || '']));
      const product = findProductForImport(record.product_id, record.product_sku || record.sku);
      if (!product) {
        errors.push(`Baris ${index + 2}: produk tidak ditemukan.`);
        return;
      }
      if (effectiveFulfillment(product) !== 'digital' && product.product_type !== 'digital') {
        errors.push(`Baris ${index + 2}: ${product.name} bukan produk digital.`);
        return;
      }
      if (!record.label || !record.payload) {
        errors.push(`Baris ${index + 2}: label dan payload wajib diisi.`);
        return;
      }
      const key = duplicateInventoryKey(product.id, record.label, record.payload);
      if (seen.has(key)) {
        errors.push(`Baris ${index + 2}: stok duplikat dilewati.`);
        return;
      }
      seen.add(key);
      imported.push({
        tenant_id: state.store.tenant_id,
        store_id: state.store.id,
        product_id: product.id,
        label: record.label,
        payload: record.payload,
        status: ['available', 'reserved', 'sold', 'delivered', 'cancelled'].includes(record.status) ? record.status : 'available',
        note: record.note || sourceLabel || '',
        created_at: today(),
        updated_at: today()
      });
    });
    if (!imported.length) throw new Error(errors.slice(0, 5).join(' ') || 'Tidak ada baris valid untuk diimport.');
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('inventory_items').insert(imported).select();
      if (error) throw error;
      state.inventoryItems = [...(data || []), ...state.inventoryItems];
    } else {
      state.inventoryItems = imported.map((item, index) => ({ ...item, id: 'inv-import-' + Date.now() + '-' + index })).concat(state.inventoryItems);
      writeJson('tokokit:demoInventoryItems', state.inventoryItems);
    }
    const affectedProducts = [...new Set(imported.map((item) => item.product_id))];
    await Promise.all(affectedProducts.map((productId) => syncDigitalProductStock(productId)));
    await Promise.all(affectedProducts.map((productId) => createStockMovement(productId, 'manual_adjustment', imported.filter((item) => item.product_id === productId && item.status === 'available').length, sourceLabel || 'Import stok digital')));
    state.notice = `${imported.length} stok digital berhasil diimport.${errors.length ? ` ${errors.length} baris dilewati.` : ''}`;
    if (errors.length) state.error = errors.slice(0, 3).join(' ');
    state.saving = false;
  }

  function exportInventoryCsv() {
    const rows = [
      ['product_sku', 'product_id', 'label', 'payload', 'status', 'note'],
      ...state.inventoryItems.map((item) => {
        const product = productById(item.product_id);
        return [product?.sku || '', item.product_id || '', item.label || '', item.payload || '', item.status || 'available', item.note || ''];
      })
    ];
    downloadCsv(rows, 'tokokit-inventory.csv');
  }

  function downloadInventoryTemplate() {
    const digitalProduct = state.products.find((product) => effectiveFulfillment(product) === 'digital' || product.product_type === 'digital');
    const sku = digitalProduct?.sku || 'SKU-DIGITAL-1';
    const rows = [
      ['product_sku', 'product_id', 'label', 'payload', 'status', 'note'],
      [sku, digitalProduct?.id || '', 'Item digital #001', 'email@example.com | password123 | catatan kirim', 'available', 'contoh stok siap jual'],
      [sku, digitalProduct?.id || '', 'Item digital #002', 'KODE-VOUCHER-002', 'available', 'contoh voucher']
    ];
    downloadCsv(rows, 'tokokit-inventory-template.csv');
  }

  async function copyInventoryTemplate() {
    const text = 'product_sku,product_id,label,payload,status,note';
    try {
      await navigator.clipboard.writeText(text);
      state.notice = 'Header template berhasil dicopy.';
    } catch (_error) {
      state.error = 'Browser tidak mengizinkan copy otomatis. Copy manual: ' + text;
    }
    render();
  }

  function downloadCsv(rows, filename) {
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openOrderDetail(orderId) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return;
    state.modal = { type: 'orderDetail', order };
    render();
  }

  async function updatePaymentStatus(orderId, paymentStatus) {
    state.saving = true;
    state.error = '';
    render();
    if (paymentStatus === 'paid') {
      const reserved = await reserveDigitalInventoryForOrder(orderId);
      if (!reserved.ok) {
        state.saving = false;
        state.error = reserved.message;
        render();
        return;
      }
    }
    await saveRecord('orders', orderId, { payment_status: paymentStatus, updated_at: today() }, (record) => {
      state.orders = state.orders.map((order) => order.id === orderId ? { ...order, ...record } : order);
      if (state.modal?.type === 'orderDetail' && state.modal.order?.id === orderId) state.modal.order = { ...state.modal.order, ...record };
      writeJson('tokokit:demoOrders', state.orders);
    });
    const payment = state.payments.find((item) => item.order_id === orderId);
    if (payment) {
      await saveRecord('payments', payment.id, { status: paymentStatus, paid_at: paymentStatus === 'paid' ? today() : null, updated_at: today() }, (record) => {
        state.payments = state.payments.map((item) => item.id === payment.id ? { ...item, ...record } : item);
        writeJson('tokokit:demoPayments', state.payments);
      });
    }
    if (paymentStatus === 'paid') {
      await updateOrderStatus(orderId, 'processing', true);
      await createFulfillmentLog(orderId, 'manual_paid', 'success', 'Pembayaran ditandai lunas dan stok digital diproses.');
    }
    state.notice = paymentStatus === 'paid' ? 'Pembayaran ditandai lunas. Stok digital sudah di-reserve jika diperlukan.' : 'Status pembayaran diperbarui.';
    render();
  }

  async function updateOrderStatus(orderId, orderStatus, silent) {
    if (orderStatus === 'completed') {
      const delivered = await markReservedInventoryDelivered(orderId);
      if (!delivered.ok) {
        state.error = delivered.message;
        render();
        return;
      }
    }
    await saveRecord('orders', orderId, { order_status: orderStatus, updated_at: today() }, (record) => {
      state.orders = state.orders.map((order) => order.id === orderId ? { ...order, ...record } : order);
      if (state.modal?.type === 'orderDetail' && state.modal.order?.id === orderId) state.modal.order = { ...state.modal.order, ...record };
      writeJson('tokokit:demoOrders', state.orders);
    });
    if (!silent) {
      state.notice = 'Status pesanan diperbarui.';
      render();
    }
  }

  async function markReservedInventoryDelivered(orderId) {
    const reserved = state.inventoryItems.filter((item) => item.order_id === orderId && item.status === 'reserved');
    for (const item of reserved) {
      const payload = { status: 'delivered', delivered_at: today(), updated_at: today() };
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('inventory_items').update(payload).eq('id', item.id).select().single();
        if (error) {
          return { ok: false, message: error.message };
        }
        state.inventoryItems = state.inventoryItems.map((record) => record.id === item.id ? data : record);
      } else {
        state.inventoryItems = state.inventoryItems.map((record) => record.id === item.id ? { ...record, ...payload } : record);
        writeJson('tokokit:demoInventoryItems', state.inventoryItems);
      }
      await createFulfillmentLog(orderId, 'manual_fulfill', 'delivered', `Stok digital ${item.label} ditandai delivered.`, item.id);
    }
    return { ok: true };
  }

  async function reserveDigitalInventoryForOrder(orderId) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return { ok: false, message: 'Order tidak ditemukan.' };
    const items = state.orderItems.filter((item) => item.order_id === orderId && (item.fulfillment_type === 'digital' || productById(item.product_id)?.product_type === 'digital'));
    if (!items.length) return { ok: true };
    for (const orderItem of items) {
      const existingReserved = state.inventoryItems.filter((item) => item.order_id === orderId && item.product_id === orderItem.product_id).length;
      const needed = Number(orderItem.quantity || 1) - existingReserved;
      if (needed <= 0) continue;
      const available = state.inventoryItems
        .filter((item) => item.product_id === orderItem.product_id && item.status === 'available' && !item.order_id)
        .slice(0, needed);
      if (available.length < needed) {
        return { ok: false, message: `Stok digital untuk ${orderItem.product_name} kurang. Tambahkan stok available dulu di menu Inventori.` };
      }
      for (const inventoryItem of available) {
        const payload = { status: 'reserved', order_id: orderId, buyer_email: order.buyer_email || '', updated_at: today() };
        if (supabaseClient) {
          const { data, error } = await supabaseClient.from('inventory_items').update(payload).eq('id', inventoryItem.id).select().single();
          if (error) return { ok: false, message: error.message };
          state.inventoryItems = state.inventoryItems.map((item) => item.id === inventoryItem.id ? data : item);
        } else {
          state.inventoryItems = state.inventoryItems.map((item) => item.id === inventoryItem.id ? { ...item, ...payload } : item);
          writeJson('tokokit:demoInventoryItems', state.inventoryItems);
        }
        await createFulfillmentLog(orderId, 'inventory_reserved', 'reserved', `Stok digital ${inventoryItem.label} di-reserve untuk order ${order.order_number}.`, inventoryItem.id);
      }
      await createStockMovement(orderItem.product_id, 'payment_paid', -needed, `Reserve stok untuk order ${order.order_number}`, orderId);
      await syncDigitalProductStock(orderItem.product_id);
    }
    return { ok: true };
  }

  async function createStockMovement(productId, movementType, quantityDelta, note, orderId) {
    if (!quantityDelta) return;
    const payload = {
      tenant_id: state.store?.tenant_id || state.publicStore?.tenant_id,
      store_id: state.store?.id || state.publicStore?.id,
      product_id: productId,
      order_id: orderId || null,
      movement_type: movementType,
      quantity_delta: quantityDelta,
      note: note || '',
      created_at: today()
    };
    if (supabaseClient && state.session) {
      const { data, error } = await supabaseClient.from('stock_movements').insert(payload).select().single();
      if (!error && data) state.stockMovements.unshift(data);
    } else {
      state.stockMovements.unshift({ ...payload, id: 'mov-' + Date.now() + Math.random() });
      writeJson('tokokit:demoStockMovements', state.stockMovements);
    }
  }

  async function createFulfillmentLog(orderId, action, status, message, inventoryItemId) {
    const order = state.orders.find((item) => item.id === orderId);
    const payload = {
      tenant_id: order?.tenant_id || state.store?.tenant_id,
      store_id: order?.store_id || state.store?.id,
      order_id: orderId,
      inventory_item_id: inventoryItemId || null,
      action,
      status,
      message,
      created_at: today()
    };
    if (supabaseClient && state.session) {
      const { data, error } = await supabaseClient.from('fulfillment_logs').insert(payload).select().single();
      if (!error && data) state.fulfillmentLogs.unshift(data);
    } else {
      state.fulfillmentLogs.unshift({ ...payload, id: 'ful-' + Date.now() + Math.random() });
      writeJson('tokokit:demoFulfillmentLogs', state.fulfillmentLogs);
    }
  }

  async function syncDigitalProductStock(productId) {
    const product = productById(productId);
    if (!product || effectiveFulfillment(product) !== 'digital') return;
    const availableCount = state.inventoryItems.filter((item) => item.product_id === productId && item.status === 'available').length;
    const payload = { stock: availableCount, updated_at: today() };
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('products').update(payload).eq('id', productId).select().single();
      if (error) throw error;
      state.products = state.products.map((item) => item.id === productId ? data : item);
    } else {
      state.products = state.products.map((item) => item.id === productId ? { ...item, ...payload } : item);
      writeJson('tokokit:demoProducts', state.products);
    }
  }

  async function saveRecord(table, id, payload, updateLocal) {
    state.saving = true;
    state.error = '';
    try {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from(table).update(payload).eq('id', id).select().single();
        if (error) throw error;
        updateLocal(data);
      } else {
        updateLocal(payload);
      }
    } catch (error) {
      state.error = error.message;
    } finally {
      state.saving = false;
    }
  }

  function addToCart(productId) {
    const product = state.publicProducts.find((item) => item.id === productId);
    if (!product) return;
    const existing = state.cart.find((item) => item.id === productId);
    const nextQty = (existing?.qty || 0) + 1;
    if (!canAddProductToCart(product, nextQty)) {
      state.error = `Stok digital ${product.name} sedang habis atau tidak cukup.`;
      render();
      return;
    }
    if (existing) existing.qty += 1;
    else state.cart.push({ id: product.id, name: product.name, price: Number(product.price || 0), qty: 1, product_id: product.id, fulfillment_type: effectiveFulfillment(product) });
    persistCart();
    render();
  }

  function buyNow(productId) {
    const product = state.publicProducts.find((item) => item.id === productId);
    if (!product) return;
    if (!canAddProductToCart(product, 1)) {
      state.error = `Stok digital ${product.name} sedang habis.`;
      render();
      return;
    }
    state.cart = [{ id: product.id, name: product.name, price: Number(product.price || 0), qty: 1, product_id: product.id, fulfillment_type: effectiveFulfillment(product) }];
    state.modal = null;
    persistCart();
    go(`/checkout/${state.publicStore?.slug || config.DEMO_STORE_SLUG || 'senja-kopi'}`);
  }

  function viewProduct(productId) {
    const product = state.publicProducts.find((item) => item.id === productId);
    if (!product) return;
    state.modal = { type: 'publicProduct', product };
    render();
  }

  function clearCart() {
    state.cart = [];
    persistCart();
    render();
  }

  function removeCartItem(productId) {
    state.cart = state.cart.filter((item) => item.id !== productId);
    persistCart();
    render();
  }

  function updateCartQty(productId, delta) {
    const item = state.cart.find((cartItem) => cartItem.id === productId);
    if (!item) return;
    if (delta > 0) {
      const product = state.publicProducts.find((record) => record.id === productId);
      if (product && !canAddProductToCart(product, item.qty + delta)) {
        state.error = `Stok digital ${product.name} tidak cukup untuk jumlah tersebut.`;
        render();
        return;
      }
    }
    item.qty += delta;
    if (item.qty <= 0) removeCartItem(productId);
    persistCart();
    render();
  }

  async function createPublicOrder(event) {
    event.preventDefault();
    if (!state.cart.length) return;
    const values = formValues(event.target);
    const store = state.publicStore;
    const subtotal = cartTotal();
    const requiresAddress = cartRequiresAddress();
    const shippingFee = requiresAddress ? Number(store.shipping_fee || 0) : 0;
    const fulfillmentType = cartFulfillmentSummary();
    const stockCheck = validateCartStock();
    if (!stockCheck.ok) {
      state.error = stockCheck.message;
      render();
      return;
    }
    if (requiresAddress && !String(values.buyer_address || '').trim()) {
      state.error = 'Alamat pengiriman wajib diisi untuk produk delivery.';
      render();
      return;
    }
    const order = {
      tenant_id: store.tenant_id,
      store_id: store.id,
      order_number: 'TK-' + String(Date.now()).slice(-6),
      buyer_name: values.buyer_name,
      buyer_whatsapp: values.buyer_whatsapp,
      buyer_email: values.buyer_email,
      buyer_address: values.buyer_address,
      subtotal,
      discount_amount: 0,
      shipping_fee: shippingFee,
      total_amount: subtotal + shippingFee,
      fulfillment_type: fulfillmentType,
      payment_method: values.payment_method,
      payment_status: 'unpaid',
      order_status: 'new',
      notes: values.notes,
      created_at: today(),
      updated_at: today()
    };
    state.saving = true;
    render();
    try {
      let createdOrder;
      if (supabaseClient) {
        const { data: customer, error: customerError } = await supabaseClient
          .from('customers')
          .insert({ tenant_id: store.tenant_id, store_id: store.id, name: values.buyer_name, whatsapp: values.buyer_whatsapp, email: values.buyer_email, address: values.buyer_address })
          .select()
          .single();
        if (customerError) throw customerError;

        const { data: orderData, error: orderError } = await supabaseClient
          .from('orders')
          .insert({ ...order, customer_id: customer.id })
          .select()
          .single();
        if (orderError) throw orderError;
        createdOrder = { ...orderData, store_slug: store.slug };

        const items = state.cart.map((item) => ({
          tenant_id: store.tenant_id,
          store_id: store.id,
          order_id: createdOrder.id,
          product_id: item.product_id,
          product_name: item.name,
          fulfillment_type: item.fulfillment_type || 'pickup',
          quantity: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty
        }));
        const { data: insertedItems, error: itemsError } = await supabaseClient.from('order_items').insert(items).select();
        if (itemsError) throw itemsError;
        state.orderItems = [...(insertedItems || []), ...state.orderItems];

        const { error: paymentError } = await supabaseClient.from('payments').insert({
          tenant_id: store.tenant_id,
          store_id: store.id,
          order_id: createdOrder.id,
          method: values.payment_method,
          amount: createdOrder.total_amount,
          status: 'unpaid',
          gateway_provider: gatewayProvider(store),
          gateway_reference: createdOrder.order_number,
          checkout_url: gatewayPaymentUrl(store, createdOrder)
        });
        if (paymentError) throw paymentError;
      } else {
        createdOrder = { ...order, id: 'ord-' + Date.now(), store_slug: store.slug };
        const orders = readJson('tokokit:demoOrders', demo.orders);
        orders.unshift(createdOrder);
        writeJson('tokokit:demoOrders', orders);
        const orderItems = readJson('tokokit:demoOrderItems', demo.orderItems);
        state.cart.forEach((item, index) => {
          orderItems.unshift({
            id: 'itm-' + Date.now() + '-' + index,
            tenant_id: store.tenant_id,
            store_id: store.id,
            order_id: createdOrder.id,
            product_id: item.product_id,
            product_name: item.name,
            fulfillment_type: item.fulfillment_type || 'pickup',
            quantity: item.qty,
            unit_price: item.price,
            total_price: item.price * item.qty,
            created_at: today()
          });
        });
        writeJson('tokokit:demoOrderItems', orderItems);
      }

      state.lastOrder = createdOrder;
      writeJson('tokokit:lastOrder', createdOrder);
      writeJson('tokokit:lastStoreSlug', store.slug);
      state.cart = [];
      persistCart();
      go(`/success/${createdOrder.order_number}`);
    } catch (error) {
      state.error = error.message;
      render();
    } finally {
      state.saving = false;
    }
  }

  function openWhatsApp(orderNumber) {
    const store = state.publicStore || state.store || demo.store;
    const number = (store.whatsapp || '').replace(/\D/g, '');
    if (!number) {
      alert('Nomor WhatsApp toko belum diisi.');
      return;
    }
    const message = orderNumber
      ? `Halo, saya ingin konfirmasi pembayaran pesanan ${orderNumber} di ${store.name}.`
      : `Halo, saya ingin bertanya tentang produk di ${store.name}.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  }

  function previewPaymentMethod(method) {
    const target = document.getElementById('paymentPreview');
    if (!target) return;
    target.innerHTML = renderPaymentInstruction(state.publicStore || demo.store, { payment_method: method }, 'checkout');
  }

  function renderPaymentInstruction(store, order, context) {
    const method = order?.payment_method || 'manual_transfer';
    const gateway = gatewayProvider(store);
    if (context === 'success' && gateway !== 'manual') {
      const url = gatewayPaymentUrl(store, order);
      return `
        <p class="card-desc">${gatewayCopy(gateway, Boolean(url))}</p>
        <div class="list">
          <div class="list-row"><span>Provider</span><b>${escapeHtml(gatewayLabel(gateway))}</b></div>
          <div class="list-row"><span>Total</span><b>${currency(order.total_amount)}</b></div>
          <div class="list-row"><span>Order ID</span><b>${escapeHtml(order.order_number || '-')}</b></div>
        </div>
        ${!url ? `<div class="notice" style="margin-top:12px">Gateway ini belum punya checkout link frontend. Gunakan instruksi manual dulu atau hubungkan backend webhook.</div>` : ''}
        <p class="card-desc" style="margin-top:12px">${escapeHtml(store.payment_instruction || 'Setelah membayar, status akan dikonfirmasi oleh toko.')}</p>
      `;
    }
    if (method === 'qris') {
      return `
        <p class="card-desc">Scan QRIS berikut, bayar sesuai total, lalu konfirmasi ke WhatsApp toko.</p>
        ${store.qris_image_url ? `<img src="${escapeAttr(store.qris_image_url)}" alt="QRIS" class="payment-qr">` : `<div class="empty">QRIS belum diunggah seller. Pilih Transfer Bank atau hubungi toko.</div>`}
        ${context === 'success' ? `<div class="list" style="margin-top:12px"><div class="list-row"><span>Metode</span><b>QRIS Manual</b></div><div class="list-row"><span>Total</span><b>${currency(order.total_amount)}</b></div></div>` : ''}
        <p class="card-desc" style="margin-top:12px">${escapeHtml(store.payment_instruction || 'Setelah membayar, kirim bukti pembayaran melalui WhatsApp.')}</p>
      `;
    }
    return `
      <div class="list">
        <div class="list-row"><span>Bank</span><b>${escapeHtml(store.bank_name || '-')}</b></div>
        <div class="list-row"><span>Rekening</span><b>${escapeHtml(store.bank_account_number || '-')}</b></div>
        <div class="list-row"><span>Atas nama</span><b>${escapeHtml(store.bank_account_name || '-')}</b></div>
        ${context === 'success' ? `<div class="list-row"><span>Total</span><b>${currency(order.total_amount)}</b></div>` : ''}
      </div>
      <p class="card-desc" style="margin-top:12px">${escapeHtml(store.payment_instruction || 'Transfer sesuai nominal lalu konfirmasi via WhatsApp.')}</p>
    `;
  }

  function gatewayPaymentUrl(store, order) {
    const provider = gatewayProvider(store);
    if (!store?.payment_gateway_enabled || provider === 'manual' || !order?.total_amount) return '';
    if (provider === 'pakasir') return pakasirPaymentUrl(store, order);
    if (provider === 'custom_link') return customPaymentUrl(store, order);
    return '';
  }

  function pakasirPaymentUrl(store, order) {
    if (!store?.pakasir_slug && !store?.payment_gateway_project_id) return '';
    const slug = encodeURIComponent(store.pakasir_slug || store.payment_gateway_project_id);
    const amount = Math.round(Number(order.total_amount || 0));
    const orderId = encodeURIComponent(order.order_number || order.id || String(Date.now()));
    return `https://app.pakasir.com/pay/${slug}/${amount}?order_id=${orderId}`;
  }

  function customPaymentUrl(store, order) {
    if (!store?.payment_gateway_checkout_url) return '';
    try {
      const url = new URL(store.payment_gateway_checkout_url);
      url.searchParams.set('order_id', order.order_number || order.id || '');
      url.searchParams.set('amount', Math.round(Number(order.total_amount || 0)));
      return url.toString();
    } catch (_error) {
      return '';
    }
  }

  function gatewayProvider(store) {
    if (store?.payment_gateway_provider) return store.payment_gateway_provider;
    if (store?.payment_gateway_enabled && store?.pakasir_slug) return 'pakasir';
    return 'manual';
  }

  function gatewayLabel(provider) {
    return ({ manual: 'Manual', pakasir: 'Pakasir', custom_link: 'Custom Link', midtrans: 'Midtrans', xendit: 'Xendit' })[provider] || 'Manual';
  }

  function gatewayCopy(provider, hasUrl) {
    if (provider === 'pakasir') return hasUrl ? 'Klik tombol bayar untuk membuka payment link Pakasir dengan nominal dan order ID pesanan ini.' : 'Lengkapi project/slug Pakasir di halaman Toko Saya.';
    if (provider === 'custom_link') return hasUrl ? 'Klik tombol bayar untuk membuka payment link custom seller.' : 'Lengkapi base URL custom payment di halaman Toko Saya.';
    if (provider === 'midtrans' || provider === 'xendit') return 'Provider ini butuh backend webhook/serverless agar order bisa dibuat dan status paid bisa diverifikasi otomatis.';
    return 'Gunakan transfer bank atau QRIS manual sesuai instruksi toko.';
  }

  function toggleSidebar(force) {
    state.sidebar = typeof force === 'boolean' ? force : !state.sidebar;
    render();
  }

  function metric(icon, label, value, note) {
    return `<div class="card metric"><div><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></div><div class="metric-icon">${icon}</div></div>`;
  }

  function checkRow(ok, label) {
    return `<div class="list-row"><span>${escapeHtml(label)}</span>${ok ? badge('OK', 'success') : badge('Perlu isi', 'warning')}</div>`;
  }

  function emptyState(text) {
    return `<div class="empty">${escapeHtml(text)}</div>`;
  }

  function input(name, label, value, required, type) {
    return `<label class="field"><span class="label">${label}</span><input class="input" type="${type || 'text'}" name="${name}" value="${escapeAttr(value || '')}" ${required ? 'required' : ''}></label>`;
  }

  function textarea(name, label, value) {
    return `<label class="field"><span class="label">${label}</span><textarea class="textarea" name="${name}">${escapeHtml(value || '')}</textarea></label>`;
  }

  function fileInput(name, label) {
    return `<label class="field"><span class="label">${label}</span><input class="input" type="file" name="${name}" accept="image/png,image/jpeg,image/webp,image/gif"></label>`;
  }

  function badge(text, tone) {
    const map = { success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger', info: 'badge-info', primary: 'badge-primary', neutral: 'badge-neutral' };
    return `<span class="badge ${map[tone] || map.neutral}">${escapeHtml(text || '-')}</span>`;
  }

  function statusBadge(value, type) {
    const labels = {
      active: ['Aktif', 'success'], draft: ['Draft', 'neutral'], archived: ['Archived', 'danger'],
      unpaid: ['Belum Dibayar', 'warning'], paid: ['Dibayar', 'success'], failed: ['Gagal', 'danger'],
      new: ['Baru', 'warning'], processing: ['Diproses', 'info'], shipped: ['Dikirim', 'primary'], completed: ['Selesai', 'success'], cancelled: ['Batal', 'danger'],
      manual_transfer: ['Transfer', 'primary'], qris: ['QRIS', 'primary'],
      physical: ['Physical', 'info'], preorder: ['Preorder', 'warning'], digital: ['Digital', 'primary'], service: ['Service', 'neutral'],
      pickup: ['Pickup', 'success'], delivery: ['Delivery', 'info'], preorder_pickup: ['Preorder Pickup', 'warning'], mixed: ['Mixed', 'primary'],
      available: ['Available', 'success'], reserved: ['Reserved', 'warning'], sold: ['Sold', 'primary'], delivered: ['Delivered', 'success']
    };
    const pair = labels[value] || [value || '-', 'neutral'];
    return badge(pair[0], pair[1]);
  }

  function filteredInventoryItems() {
    const search = String(state.inventoryFilters.search || '').toLowerCase();
    return state.inventoryItems.filter((item) => {
      const product = productById(item.product_id);
      const matchesSearch = !search || [item.label, item.payload, item.note, product?.name, product?.sku].some((value) => String(value || '').toLowerCase().includes(search));
      const matchesProduct = !state.inventoryFilters.product_id || item.product_id === state.inventoryFilters.product_id;
      const matchesStatus = !state.inventoryFilters.status || item.status === state.inventoryFilters.status;
      return matchesSearch && matchesProduct && matchesStatus;
    });
  }

  function productById(id) {
    return state.products.find((product) => product.id === id) || state.publicProducts.find((product) => product.id === id);
  }

  function digitalAvailableCount(productId) {
    if (!productId) return 0;
    return state.inventoryItems.filter((item) => item.product_id === productId && item.status === 'available').length;
  }

  function orderNumberById(id) {
    return state.orders.find((order) => order.id === id)?.order_number || '';
  }

  function maskPayload(value) {
    const text = String(value || '');
    if (text.length <= 18) return text || '-';
    return text.slice(0, 10) + '...' + text.slice(-5);
  }

  function inventoryStatusLabel(status) {
    return ({ available: 'Available', reserved: 'Reserved', sold: 'Sold', delivered: 'Delivered', cancelled: 'Cancelled' })[status] || status || '-';
  }

  function stockMovementLabel(type) {
    return ({ manual_adjustment: 'Manual adjustment', checkout_reserved: 'Checkout reserved', payment_paid: 'Payment paid', cancelled: 'Cancelled', refund: 'Refund' })[type] || type || '-';
  }

  function fulfillmentActionLabel(action) {
    return ({ manual_paid: 'Manual paid', inventory_reserved: 'Inventory reserved', manual_fulfill: 'Manual fulfill', email_pending: 'Email pending', email_sent: 'Email sent', email_failed: 'Email failed' })[action] || action || '-';
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === ',' && !quoted) {
        row.push(cell.trim());
        cell = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell.trim());
        if (row.some((part) => part !== '')) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    row.push(cell.trim());
    if (row.some((part) => part !== '')) rows.push(row);
    return rows;
  }

  function normalizeSpreadsheetText(text) {
    const raw = String(text || '').replace(/^\uFEFF/, '').trim();
    if (!raw.includes('\t')) return raw;
    return raw.split(/\r?\n/).map((line) => line.split('\t').map(csvCell).join(',')).join('\n');
  }

  function normalizeHeader(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function findProductForImport(productId, sku) {
    return state.products.find((product) => product.id === productId) || state.products.find((product) => String(product.sku || '').toLowerCase() === String(sku || '').toLowerCase());
  }

  function duplicateInventoryKey(productId, label, payload) {
    return [productId || '', String(label || '').trim().toLowerCase(), String(payload || '').trim().toLowerCase()].join('|');
  }

  function csvCell(value) {
    const text = String(value ?? '');
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function formValues(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  async function maybeUploadFile(file, folder, fallbackUrl) {
    if (!file || !file.name) return fallbackUrl || '';
    if (!supabaseClient) {
      throw new Error('Upload gambar butuh Supabase. Isi frontend/config.js dulu, atau gunakan URL gambar manual untuk demo mode.');
    }
    if (!file.type.startsWith('image/')) {
      throw new Error('File harus berupa gambar.');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Ukuran gambar maksimal 2MB.');
    }
    const tenantId = state.store?.tenant_id || state.publicStore?.tenant_id || 'public';
    const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const filePath = `${tenantId}/${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const { error } = await supabaseClient.storage
      .from(storageBucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(storageBucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  function cartTotal() {
    return state.cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  }

  function canAddProductToCart(product, requestedQty) {
    if (effectiveFulfillment(product) !== 'digital') return true;
    return Number(product.stock || 0) >= Number(requestedQty || 1);
  }

  function validateCartStock() {
    for (const item of state.cart) {
      const product = state.publicProducts.find((record) => record.id === item.product_id || record.id === item.id);
      if (!product) return { ok: false, message: `${item.name} tidak ditemukan di toko. Hapus dari cart lalu pilih ulang.` };
      if (effectiveFulfillment(product) === 'digital' && Number(product.stock || 0) < Number(item.qty || 1)) {
        return { ok: false, message: `Stok digital ${product.name} tidak cukup. Tersedia ${Number(product.stock || 0)}, cart kamu ${Number(item.qty || 1)}.` };
      }
    }
    return { ok: true };
  }

  function cartRequiresAddress() {
    return state.cart.some((item) => (item.fulfillment_type || 'pickup') === 'delivery');
  }

  function cartFulfillmentSummary() {
    const types = [...new Set(state.cart.map((item) => item.fulfillment_type || 'pickup'))];
    return types.length === 1 ? types[0] : 'mixed';
  }

  function fallbackFulfillment(product) {
    if (product.product_type === 'digital' || product.product_type === 'service') return 'digital';
    if (product.product_type === 'preorder') return 'preorder_pickup';
    return state.store?.fulfillment_mode || state.publicStore?.fulfillment_mode || 'pickup';
  }

  function effectiveFulfillment(product) {
    const explicit = product.fulfillment_type;
    if ((product.product_type === 'digital' || product.product_type === 'service') && (!explicit || explicit === 'pickup')) return 'digital';
    if (product.product_type === 'preorder' && (!explicit || explicit === 'pickup')) return 'preorder_pickup';
    return explicit || fallbackFulfillment(product);
  }

  function fulfillmentLabel(value) {
    const labels = {
      digital: 'Digital tanpa alamat',
      pickup: 'Ambil di toko',
      delivery: 'Delivery pakai alamat',
      preorder_pickup: 'Preorder ambil di toko',
      mixed: 'Campuran'
    };
    return labels[value] || labels.pickup;
  }

  function cartCount() {
    return state.cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  }

  function persistCart() {
    writeJson('tokokit:cart', state.cart);
  }

  function readCart() {
    return readJson('tokokit:cart', []);
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function initials(value) {
    return String(value || 'TK').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  function productInitial(name) {
    return escapeHtml(String(name || 'P').charAt(0).toUpperCase());
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function uniqueSlug(value) {
    return slugify(String(value || 'toko-baru').split('@')[0]) + '-' + String(Date.now()).slice(-4);
  }

  function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }
})();
