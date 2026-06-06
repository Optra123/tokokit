# Portfolio Case Study: TokoKit

## 1. Problem Statement

Banyak UMKM masih menerima order lewat chat, mencatat produk di spreadsheet, dan mengirim instruksi pembayaran manual satu per satu. Proses ini lambat, rawan salah input, dan sulit dipantau saat order mulai bertambah.

TokoKit dibuat untuk memberi seller link toko sederhana yang bisa langsung dipakai berjualan tanpa akun pembeli.

## 2. Target Users

- UMKM makanan dan minuman
- Seller pre-order
- Toko kecil berbasis Instagram/WhatsApp
- Penjual produk digital sederhana
- Freelancer jasa

## 3. Product Goals

- Seller bisa membuat toko online dengan cepat.
- Seller bisa mengelola produk, harga, stok, dan status publikasi.
- Buyer bisa checkout tanpa akun.
- Order masuk ke dashboard seller.
- Payment v1 tetap realistis: transfer manual, QRIS statis, dan WhatsApp confirmation.
- Arsitektur siap dikembangkan ke payment gateway.

## 4. Core Features

### Seller Dashboard

Menampilkan omzet paid, total pesanan, unpaid orders, produk aktif, pesanan terbaru, dan checklist kesiapan toko.

### Store Setup

Seller dapat mengatur nama toko, slug, deskripsi, kontak, branding, rekening bank, QRIS URL, instruksi pembayaran, dan status publish.

### Product Management

Seller dapat tambah, edit, dan archive produk. Storefront hanya menampilkan produk active.

### Order Management

Seller dapat melihat pesanan, mengubah payment status, dan mengubah order status.

### Public Storefront

Buyer dapat membuka `/store/:slug`, melihat produk aktif, menambah ke cart, checkout, dan mendapat halaman sukses.

## 5. System Architecture

```text
Vercel Static SPA
HTML/CSS/Vanilla JS
        |
        | Supabase JS Client
        v
Supabase Auth + Postgres + Storage + RLS
        |
        v
Manual Transfer / QRIS / WhatsApp Confirmation
```

## 6. Database Design

Database menggunakan Supabase Postgres:

- tenants
- profiles
- stores
- products
- customers
- orders
- order_items
- payments
- settings
- audit_logs

RLS memastikan seller hanya mengakses tenant sendiri, sedangkan public buyer hanya bisa membaca toko/produk aktif dan membuat data checkout untuk toko aktif.

## 7. Frontend Design

Frontend tetap sederhana tanpa framework agar mudah dipahami, mudah dideploy, dan cocok untuk portfolio. Struktur sudah dipisah menjadi:

- `frontend/index.html`
- `frontend/styles.css`
- `frontend/config.js`
- `frontend/app.js`

Admin seller memakai shell sidebar/topbar bersama. Public storefront memakai shell berbeda agar pengalaman pembeli lebih ringan.

## 8. Backend Design

Backend utama adalah Supabase:

- Auth untuk seller
- Postgres untuk data utama
- RLS untuk isolasi tenant
- Anon access terbatas untuk storefront dan checkout
- Storage untuk logo, banner, gambar produk, dan QRIS

Apps Script lama tetap disimpan sebagai arsip prototype Google Sheets, bukan backend utama.

## 9. Payment Roadmap

v1:

- Manual transfer
- Static QRIS image URL
- WhatsApp confirmation

v2:

- Supabase Storage untuk bukti pembayaran
- Email notification
- Reminder unpaid order

v3:

- Xendit Payment Link sandbox
- Midtrans Snap sandbox
- Webhook payment status

## 10. What This Demonstrates

- Product thinking untuk kebutuhan UMKM nyata
- Multi-tenant data model
- Supabase Auth + RLS
- Public checkout tanpa akun
- SPA routing siap Vercel
- Payment flow manual yang realistis sebelum gateway
