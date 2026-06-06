# TokoKit Product Specification

## 1. Product Summary

TokoKit adalah online store builder ringan untuk UMKM Indonesia.

Seller dapat daftar, membuat toko, mengelola produk, menerima pesanan, mengatur pembayaran manual/QRIS, dan membagikan link toko publik. Buyer dapat checkout tanpa akun lalu konfirmasi pembayaran via WhatsApp.

## 2. Target v1

Versi pertama harus bisa dipakai sebagai produk publik sederhana:

- Seller app berjalan di `/app/*`
- Public storefront berjalan di `/store/:slug`
- Backend utama memakai Supabase Auth dan Supabase Postgres
- Asset upload memakai Supabase Storage
- Frontend dideploy ke Vercel
- Landing page utama `/` memperkenalkan TokoKit untuk seller.
- Storefront buyer tidak menampilkan tombol seller login/register.
- Payment v1 memakai transfer manual dan QRIS statis

## 3. User Roles

### Seller

Pemilik toko yang login ke dashboard.

Seller dapat:

- Register/login
- Membuat toko awal
- Mengatur profil toko
- Publish/unpublish toko
- Mengelola produk
- Mengelola stok digital siap kirim
- Melihat pesanan
- Mengubah status pembayaran
- Mengubah status pesanan
- Mengatur rekening, QRIS URL, dan instruksi pembayaran
- Memilih provider payment gateway: manual, Pakasir, custom link, Midtrans, atau Xendit

### Buyer

Pembeli yang membuka toko publik.

Buyer dapat:

- Melihat toko aktif
- Melihat produk aktif
- Menambah produk ke cart
- Checkout tanpa akun
- Melihat instruksi pembayaran
- Konfirmasi via WhatsApp

## 4. Seller Pages

### Dashboard

Content:

- Revenue paid
- Total orders
- Unpaid orders
- Active products
- Recent orders
- Store readiness checklist

### Toko Saya

Content:

- Store identity
- Slug
- Business type
- Description
- WhatsApp
- Email
- Address
- Brand color
- Logo URL atau upload logo
- Banner URL atau upload banner
- Bank account
- QRIS image URL
- QRIS image upload
- Payment instruction
- Payment gateway provider
- Pakasir project/slug atau custom checkout URL
- Publish status

### Produk

Content:

- Product metrics
- Product table
- Add/edit product modal
- Archive product action
- Status: active, draft, archived

### Inventori

Content:

- Stok digital per produk
- Status inventory: available, reserved, sold, delivered, cancelled
- Tambah/edit/hapus stok digital
- CSV import/export untuk spreadsheet
- Riwayat perubahan stok

### Pesanan

Content:

- Order metrics
- Orders table
- Order detail modal
- Order items dan data buyer
- Stok digital yang di-reserve untuk order
- Fulfillment logs
- Payment status selector
- Order status selector

### Pembayaran

Content:

- Manual bank details
- QRIS readiness
- Unpaid confirmation table
- Gateway roadmap note

### Pengaturan

Content:

- Supabase mode status
- Deployment readiness
- Safety notes

## 5. Public Pages

### Storefront

Route: `/store/:slug`

Content:

- Store name
- Description
- Business type
- Address
- WhatsApp action
- Active product grid
- Cart button

### Checkout

Route: `/checkout/:slug`

Content:

- Buyer name
- Buyer WhatsApp
- Buyer email optional
- Buyer address
- Notes
- Payment method: manual_transfer or qris
- Order summary
- Submit order
- Payment link dinamis jika toko memakai Pakasir atau custom link

Checkout memblokir pembelian produk digital jika stok available tidak cukup.

### Success

Route: `/success/:orderNumber`

Content:

- Order number
- Buyer name
- Total payment
- Payment status
- Payment instruction
- QRIS image if configured
- WhatsApp confirmation button

## 6. Data Model

Supabase tables:

- tenants
- profiles
- stores
- products
- customers
- orders
- order_items
- payments
- inventory_items
- stock_movements
- fulfillment_logs
- settings
- audit_logs

Full SQL lives in `docs/SUPABASE_SCHEMA.sql`.

## 7. Definition of Done

Frontend v1 dianggap selesai jika:

- App berjalan tanpa backend dalam demo mode.
- App berjalan dengan Supabase jika `frontend/config.js` diisi.
- Seller bisa upload logo, banner, produk, dan QRIS ke Supabase Storage.
- Seller bisa mengatur cara penjualan per produk: digital, ambil di toko, delivery, atau preorder pickup.
- Checkout hanya meminta alamat jika cart berisi produk delivery.
- Buyer bisa lihat detail produk, tambah ke cart, atau beli langsung.
- Produk digital punya field persiapan auto-delivery dan stok rahasia di inventory seller.
- Seller bisa import/export stok digital CSV.
- Checkout digital memblokir order jika stok siap kirim tidak cukup.
- Seller mark paid bisa me-reserve stok digital dan membuat fulfillment log.
- Produk digital tidak bisa memakai stok manual dari form produk; stok publik berasal dari inventory item `available`.
- Pakasir/custom payment link bisa muncul di success page. Verifikasi paid otomatis untuk gateway penuh butuh backend webhook.
- Seller bisa register/login.
- Seller bisa publish toko.
- Seller bisa CRUD produk.
- Public storefront hanya menampilkan toko aktif dan produk aktif.
- Buyer checkout membuat customer, order, order items, dan payment row.
- Seller bisa melihat order dan update status.
- Vercel SPA routes bekerja untuk `/app/*`, `/store/*`, `/checkout/*`, dan `/success/*`.
