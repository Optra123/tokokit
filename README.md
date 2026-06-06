# TokoKit

TokoKit adalah web app pembuat toko online untuk UMKM Indonesia. Seller dapat daftar/login, membuat toko, mengelola produk, menerima pesanan, mengatur pembayaran manual/QRIS, dan membagikan link toko publik ke pembeli.

Project ini sekarang diarahkan sebagai produk publik berbasis:

- Frontend SPA: HTML, CSS, Vanilla JavaScript
- Hosting: Vercel static hosting
- Backend: Supabase Auth + Supabase Postgres
- Payment v1: transfer manual, QRIS statis, konfirmasi WhatsApp
- Legacy reference: Google Apps Script tetap disimpan di `apps-script/`

## Struktur Project

```text
tokokit/
+-- frontend/
|   +-- index.html
|   +-- styles.css
|   +-- config.js
|   +-- app.js
+-- docs/
|   +-- SUPABASE_SCHEMA.sql
|   +-- API_CONTRACT.md
|   +-- DATABASE_SCHEMA.md
|   +-- DEPLOYMENT_GUIDE.md
|   +-- INVENTORY_SPREADSHEET_GUIDE.md
|   +-- VISUAL_SETUP_GUIDE.md
|   +-- PORTFOLIO_CASE_STUDY.md
|   +-- CODEX_PROMPTS.md
+-- apps-script/
|   +-- Code.gs
|   +-- appsscript.json
+-- vercel.json
+-- dev-server.js
+-- SPEC.md
+-- README.md
```

## Fitur Saat Ini

Seller app:

- Register/login via Supabase Auth
- Landing page publik di `/` untuk pengenalan produk dan CTA seller
- Homepage visual dengan hero image, logo integrasi, dashboard preview, feature cards, dan animasi ringan
- Auto-create tenant, profile, dan toko awal
- Dashboard metrik pesanan/produk
- Edit profil toko dan publish/unpublish toko
- CRUD produk
- Inventori stok digital dengan tabel seller, filter, CSV import/export, dan audit ringan
- Import inventori dari upload CSV, paste spreadsheet, atau URL CSV publik Google Sheets
- Daftar pesanan
- Detail pesanan dengan item, buyer, fulfillment, dan stok digital yang di-reserve
- Update status pembayaran dan status pesanan
- Pilihan payment gateway: manual, Pakasir, custom link, Midtrans, Xendit
- Pengaturan backend/deployment

Public storefront:

- Route `/store/:slug`
- Produk aktif saja yang tampil
- Cart berbasis browser
- Checkout tanpa akun pembeli
- Create customer, order, order items, dan payment row di Supabase
- Success page dengan nomor order, instruksi pembayaran, QRIS, dan tombol WhatsApp
- Upload logo, banner, gambar produk, dan QRIS ke Supabase Storage
- Cara penjualan per produk: digital, pickup, delivery, atau preorder pickup
- Checkout adaptif: alamat hanya diminta jika ada produk delivery
- Produk digital diblokir checkout jika stok siap kirim tidak cukup
- Stok produk digital dihitung dari Inventori, bukan input stok manual di form produk
- Detail produk popup, tambah cart, dan beli sekarang
- Storefront visual dengan banner hero, kategori, store info band, dan product card animatif
- Pondasi auto-delivery produk digital: template email, inventory item, dan fulfillment log
- Payment link dinamis untuk Pakasir/custom link; Midtrans/Xendit butuh backend webhook sebelum auto-paid

Fallback:

- Jika `frontend/config.js` belum berisi Supabase URL/key, app berjalan dalam demo mode memakai sample data dan `localStorage`.

## Menjalankan Lokal

Jalankan dari root repo agar SPA fallback bekerja:

```bash
node dev-server.js
```

Buka:

```text
http://localhost:8080
```

Route penting:

```text
/login
/register
/app/dashboard
/app/store
/app/products
/app/inventory
/app/orders
/app/payments
/store/senja-kopi
```

## Setup Supabase

1. Buat project Supabase baru.
2. Buka SQL Editor.
3. Jalankan isi `docs/SUPABASE_SCHEMA.sql`.
   Jalankan ulang file ini juga setiap ada update schema; file memakai `if not exists` dan `drop policy if exists` agar aman untuk migrasi ringan.
4. Buka `frontend/config.js`.
5. Isi:

```javascript
window.TOKOKIT_CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  STORAGE_BUCKET: 'tokokit-assets',
  ADMIN_WHATSAPP: '',
  ADMIN_EMAIL: '',
  DEMO_STORE_SLUG: 'senja-kopi'
};
```

Gunakan anon key Supabase, bukan service role key.

## Deploy ke Vercel

1. Push project ke GitHub.
2. Import repo di Vercel.
3. Deploy dari root folder `tokokit`.
4. Pastikan `vercel.json` ikut terdeploy.
5. Setelah deploy, buka `/register`, buat akun seller, lengkapi toko, publish, lalu test `/store/{slug}`.

## Status Apps Script

`apps-script/Code.gs` sekarang dianggap legacy/reference dari backend prototype Google Sheets. Backend utama versi publik adalah Supabase.

## Roadmap Berikutnya

- Order number generator berbasis database function
- Webhook payment gateway untuk auto-mark paid dan auto-fulfillment digital
- Endpoint serverless untuk Midtrans/Xendit
- Email notification
- WhatsApp template management
- Xendit/Midtrans sandbox
- Subscription/billing untuk seller
