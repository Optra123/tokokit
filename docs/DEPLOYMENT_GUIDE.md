# TokoKit Deployment Guide

Panduan ini menjelaskan deployment versi publik TokoKit berbasis Supabase + Vercel.

## 1. Run Local

Jalankan server dari root project:

```bash
node dev-server.js
```

Buka:

```text
http://localhost:8080
```

Tanpa Supabase config, aplikasi berjalan dalam demo mode.

## 2. Setup Supabase

1. Buka `https://supabase.com`.
2. Klik `Start your project` atau `Dashboard`.
3. Login dengan GitHub/email.
4. Klik `New project`.
5. Pilih organization.
6. Isi `Project name`: `tokokit`.
7. Buat database password dan simpan di tempat aman.
8. Pilih region terdekat, misalnya Singapore jika tersedia.
9. Klik `Create new project`.
10. Tunggu sampai project selesai dibuat.
11. Di sidebar kiri, klik `SQL Editor`.
12. Klik `New query`.
13. Buka file lokal `docs/SUPABASE_SCHEMA.sql`.
14. Copy seluruh isi file.
15. Paste ke SQL Editor Supabase.
16. Klik `Run`.
17. Pastikan tidak ada error merah.
    Jika sebelumnya sudah pernah menjalankan schema, tetap boleh klik `Run` lagi untuk menambah kolom baru.
18. Di sidebar kiri, klik `Storage`.
19. Pastikan bucket `tokokit-assets` muncul.
20. Di sidebar kiri, klik `Project Settings`.
21. Klik `API`.
22. Copy `Project URL`.
23. Copy `anon public` key.
24. Isi `frontend/config.js`.

Contoh:

```javascript
window.TOKOKIT_CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  STORAGE_BUCKET: 'tokokit-assets',
  DEMO_STORE_SLUG: 'senja-kopi'
};
```

Jangan memakai service role key di frontend.

## 3. Auth Settings

Untuk testing cepat:

1. Di sidebar kiri Supabase, klik `Authentication`.
2. Klik `Providers`.
3. Klik `Email`.
4. Pastikan `Enable Email provider` aktif.
5. Untuk demo cepat, buka `Authentication -> Settings`.
6. Cari email confirmation atau confirm email setting.
7. Jika ingin langsung login setelah register, nonaktifkan email confirmation untuk fase demo.

Untuk produksi publik, aktifkan email confirmation dan konfigurasi email template/domain.

## 4. Test Local dengan Supabase

1. Kembali ke terminal di folder `tokokit`.
2. Jika server belum jalan, jalankan:

```bash
node dev-server.js
```

3. Buka:

```text
http://localhost:8080/register
```

4. Isi nama, email, password.
5. Klik `Buat Akun`.
6. Login jika diarahkan ke halaman login.
7. Buka `/app/store`.
8. Isi data toko:
   - Nama toko
   - Slug URL
   - WhatsApp
   - Rekening
   - Instruksi pembayaran
   - Status `Published`
   - Mode utama toko
   - Ongkir default jika menjual produk delivery
   - Slug Pakasir jika sudah punya akun/proyek Pakasir
9. Upload logo, banner, dan QRIS jika sudah punya gambar.
10. Klik `Simpan`.
11. Buka `/app/products`.
12. Klik `Tambah Produk`.
13. Isi produk dan upload gambar produk.
14. Pilih status `Active`.
15. Pilih cara penjualan:

- `Digital tanpa alamat`
- `Ambil di toko`
- `Delivery pakai alamat`
- `Preorder ambil di toko`

16. Klik `Simpan Produk`.
17. Klik `Buka Toko`.
18. Klik gambar produk atau tombol `Detail`.
19. Coba `Tambah Cart`.
20. Coba `Beli Sekarang`.
21. Checkout sebagai buyer.
22. Buka `/app/orders`.
23. Pastikan order baru muncul.

## 5. Deploy Frontend ke Vercel

1. Push repo ke GitHub.
2. Import repo di Vercel.
3. Pilih root folder `tokokit`.
4. Deploy.
5. `vercel.json` akan mengarahkan route SPA berikut ke `frontend/index.html`:
   - `/login`
   - `/register`
   - `/app/*`
   - `/store/*`
   - `/checkout/*`
   - `/success/*`

## 6. Setup Vercel Environment Variables

Serverless API `/api/*` butuh environment variables di Vercel.

1. Buka `https://vercel.com/dashboard`.
2. Klik project TokoKit.
3. Klik tab `Settings`.
4. Klik menu `Environment Variables`.
5. Tambahkan variable berikut untuk `Production`, `Preview`, dan `Development` jika ingin:

```text
SUPABASE_URL=https://PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=SUPABASE_SERVICE_ROLE_OR_SECRET_KEY
PUBLIC_SITE_URL=https://domain-tokokit-kamu.vercel.app
```

6. Jika memakai Midtrans, tambahkan:

```text
MIDTRANS_SERVER_KEY=SERVER_KEY_DARI_MIDTRANS
MIDTRANS_IS_PRODUCTION=false
```

Untuk mode live nanti ubah `MIDTRANS_IS_PRODUCTION=true`.

7. Jika memakai Xendit, tambahkan:

```text
XENDIT_SECRET_KEY=SECRET_KEY_DARI_XENDIT
XENDIT_WEBHOOK_TOKEN=WEBHOOK_VERIFICATION_TOKEN_DARI_XENDIT
```

8. Jika memakai provider/custom webhook, tambahkan:

```text
TOKOKIT_GATEWAY_WEBHOOK_SECRET=isi-random-panjang
```

9. Klik `Save`.
10. Buka tab `Deployments`.
11. Klik deployment terbaru.
12. Klik menu tiga titik.
13. Klik `Redeploy`.

Jangan pernah menaruh `SUPABASE_SERVICE_KEY`, `MIDTRANS_SERVER_KEY`, atau `XENDIT_SECRET_KEY` di `frontend/config.js`.

## 7. Setup Webhook Payment Gateway

Webhook membuat status order otomatis berubah ke paid dan stok digital di-reserve.

Midtrans:

1. Buka dashboard Midtrans.
2. Masuk ke project/environment yang dipakai.
3. Buka menu payment notification/webhook settings.
4. Isi notification URL:

```text
https://domain-tokokit-kamu.vercel.app/api/webhook-midtrans
```

5. Simpan.
6. Pastikan `MIDTRANS_SERVER_KEY` di Vercel sama dengan environment Midtrans tersebut.

Xendit:

1. Buka dashboard Xendit.
2. Buka `Developers` atau `Settings`.
3. Buka `Webhooks`.
4. Tambahkan webhook URL:

```text
https://domain-tokokit-kamu.vercel.app/api/webhook-xendit
```

5. Aktifkan event invoice/payment paid.
6. Copy verification token/secret ke Vercel.

Provider custom/Pakasir jika tersedia webhook:

1. Arahkan webhook ke:

```text
https://domain-tokokit-kamu.vercel.app/api/webhook-gateway
```

2. Pastikan request mengirim header:

```text
x-tokokit-secret: nilai_TOKOKIT_GATEWAY_WEBHOOK_SECRET
```

3. Body minimal harus berisi:

```json
{
  "order_number": "TK-123456",
  "status": "paid",
  "provider": "pakasir"
}
```

## 8. Smoke Test

Setelah deploy:

1. Buka `/register`.
2. Buat akun seller.
3. Login ke `/app/dashboard`.
4. Buka `/app/store`, lengkapi data toko, isi WhatsApp, rekening, instruksi pembayaran, dan publish toko.
5. Buka `/app/products`, tambah minimal satu produk active.
6. Buka `/store/{slug}`.
7. Tambahkan produk ke cart.
8. Checkout sebagai buyer.
9. Pastikan order muncul di `/app/orders`.
10. Jika manual payment, ubah payment status menjadi `paid`.
11. Jika gateway aktif, buka payment link dari success page dan bayar di sandbox.
12. Refresh `/app/orders`.
13. Pastikan payment berubah paid otomatis setelah webhook masuk.
14. Untuk produk digital, buka `/app/inventory` dan pastikan stok berubah dari `available` menjadi `reserved`.

Catatan local development: `node dev-server.js` hanya melayani frontend statis, bukan Vercel API `/api/*`. Untuk menguji serverless API secara lokal gunakan Vercel CLI (`vercel dev`) atau langsung test setelah deploy ke Vercel.

## 9. Legacy Apps Script

Folder `apps-script/` tetap disimpan sebagai arsip backend prototype Google Sheets. Jalur deployment utama versi publik adalah Supabase + Vercel.

## 10. Production Notes

- Supabase anon key aman dipakai di frontend selama RLS benar.
- Jangan pernah taruh service role key di frontend.
- Upload logo, produk, banner, dan QRIS sudah memakai bucket Supabase Storage `tokokit-assets`.
- Untuk payment gateway, mulai dari sandbox Xendit/Midtrans setelah manual payment stabil.
- Secret key payment gateway hanya boleh berada di Vercel Environment Variables.
- Uji semua payment gateway di sandbox sebelum live.
