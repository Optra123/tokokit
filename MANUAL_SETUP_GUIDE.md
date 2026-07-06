# 🚀 MANUAL SETUP GUIDE - TokoKit Production Deployment

**Target:** Pemula yang mau deploy TokoKit ke production (Vercel + Supabase)  
**Time:** ~30-45 menit  
**Prerequisites:** GitHub account, Email

---

## 📋 CHECKLIST OVERVIEW

- [ ] Step 1: Supabase Setup (15 min)
- [ ] Step 2: Vercel Deployment (10 min)
- [ ] Step 3: Environment Variables (5 min)
- [ ] Step 4: Testing (10 min)
- [ ] Step 5: (Optional) Payment Gateway (15 min)

---

## 🔥 STEP 1: SUPABASE SETUP

### 1.1 Create Supabase Project

1. Buka https://supabase.com
2. Click **"Start your project"** atau **"New project"**
3. Login dengan GitHub (recommended) atau email
4. Click **"New project"**
5. Isi form:
   - **Name**: `tokokit` (atau nama lain)
   - **Database Password**: Generate strong password → **SIMPAN DI TEMPAT AMAN!**
   - **Region**: Pilih terdekat (Singapore untuk Indonesia)
   - **Pricing Plan**: Free (cukup untuk belajar)
6. Click **"Create new project"**
7. **Tunggu 2-3 menit** sampai setup selesai

---

### 1.2 Run Database Schema

1. Di Supabase dashboard, click **"SQL Editor"** di sidebar kiri
2. Click **"New query"**
3. Buka file `docs/SUPABASE_SCHEMA.sql` di VS Code
4. **Copy SEMUA isi file** (Ctrl+A, Ctrl+C)
5. **Paste** ke SQL Editor Supabase
6. Click **"Run"** (atau Ctrl+Enter)
7. **Tunggu hingga selesai** (no red errors)
8. ✅ Kalau success, Anda akan lihat "Success. No rows returned" atau similar

**Troubleshooting:**

- **Error "bucket already exists"**: Aman, abaikan saja (bucket sudah ada)
- **Error "table already exists"**: Aman, schema sudah jalan sebelumnya
- **Error lain**: Copy error message, google, atau tanya

---

### 1.3 Verify Database Tables

1. Di sidebar, click **"Table Editor"**
2. Anda harus lihat **13 tables**:
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
3. ✅ Kalau semua ada, database ready!

---

### 1.4 Setup Storage Bucket

1. Di sidebar, click **"Storage"**
2. Anda harus lihat bucket **"tokokit-assets"**
3. Click bucket name
4. Click **gear icon** (⚙️) → **"Edit bucket"**
5. Toggle **"Public bucket"** to **ON** (penting!)
6. Set **"File size limit"**: 2 MB
7. Set **"Allowed MIME types"**:
   ```
   image/png, image/jpeg, image/webp, image/gif
   ```
8. Click **"Save"**

**Note:** Public bucket artinya gambar uploaded bisa diakses via URL (untuk product images, logo, dll)

---

### 1.5 Get API Keys

1. Di sidebar, click **"Project Settings"** (gear icon)
2. Click **"API"** di menu
3. Scroll ke **"Project API keys"**
4. Copy **2 keys ini**:

```
Project URL: https://xxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx (secret!)
```

**IMPORTANT:**

- `anon public` = untuk frontend (aman di-commit)
- `service_role` = untuk backend/API (JANGAN di-commit, JANGAN share!)

**SIMPAN keys ini**, Anda perlu nanti.

---

### 1.6 Configure Auth Settings (Optional - Recommended)

1. Di sidebar, click **"Authentication"**
2. Click **"Providers"**
3. Pastikan **"Email"** provider enabled
4. Click **"Email"** untuk config
5. Untuk testing cepat:
   - **Disable** "Confirm email" (supaya bisa langsung login tanpa verifikasi email)
   - Untuk production nanti, enable lagi
6. Click **"Save"**

---

## 🚀 STEP 2: VERCEL DEPLOYMENT

### 2.1 Connect GitHub to Vercel

1. Buka https://vercel.com
2. Click **"Sign Up"** atau **"Log In"**
3. **Login with GitHub** (recommended)
4. Authorize Vercel to access GitHub repos

---

### 2.2 Import TokoKit Repository

1. Di Vercel dashboard, click **"Add New..."** → **"Project"**
2. Cari repository **"tokokit"** atau **"Optra123/tokokit"**
3. Click **"Import"**
4. **Configure Project:**
   - **Project Name**: `tokokit` (atau custom)
   - **Framework Preset**: Other (atau None)
   - **Root Directory**: `./` (default)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install` (default)
5. **Jangan deploy dulu!** Kita perlu set environment variables

---

### 2.3 Set Environment Variables

**BEFORE deploy**, click **"Environment Variables"** tab.

Add **semua variables ini**:

#### Required (Wajib)

```bash
# Supabase (dari Step 1.5)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR...service_role_key

# Public site URL (nanti diisi setelah deploy pertama)
PUBLIC_SITE_URL=https://your-project.vercel.app
```

**Cara add:**

1. Name: `SUPABASE_URL`
2. Value: (paste dari Supabase Step 1.5)
3. Environment: Pilih **"Production", "Preview", "Development"** (all three)
4. Click **"Add"**
5. Repeat untuk `SUPABASE_SERVICE_KEY`

#### Optional (Kalau pakai payment gateway)

```bash
# Midtrans (kalau pakai)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
MIDTRANS_IS_PRODUCTION=false

# Xendit (kalau pakai)
XENDIT_SECRET_KEY=xnd_development_xxxxx
XENDIT_WEBHOOK_TOKEN=xxxxx

# Custom gateway (kalau pakai)
TOKOKIT_GATEWAY_WEBHOOK_SECRET=random-secret-string-here

# Email (kalau mau auto-send digital delivery)
RESEND_API_KEY=re_xxxxx
RESEND_FROM=TokoKit <noreply@yourdomain.com>
```

**Skip dulu payment gateway**, bisa ditambah nanti.

---

### 2.4 Deploy!

1. Setelah env vars diset, click **"Deploy"**
2. **Tunggu 2-3 menit** (Vercel build & deploy)
3. Kalau success, Anda akan lihat 🎉 **"Congratulations!"**
4. Click **"Visit"** untuk buka deployment

---

### 2.5 Update PUBLIC_SITE_URL

1. Copy URL deployment Anda: `https://tokokit-xxxxx.vercel.app`
2. Kembali ke **Vercel dashboard** → **Settings** → **Environment Variables**
3. Find `PUBLIC_SITE_URL`
4. Click **"Edit"**
5. Update value dengan URL Anda
6. Click **"Save"**
7. **Redeploy**: Di **Deployments** tab, click latest deployment → **"Redeploy"**

---

## ✅ STEP 3: FIRST TEST

### 3.1 Test Homepage

1. Buka `https://your-project.vercel.app`
2. ✅ Harus muncul homepage TokoKit
3. ❌ Kalau blank/error, check Vercel logs

---

### 3.2 Register as Seller

1. Click **"Mulai Jualan"** atau buka `/register`
2. Isi form:
   - **Nama Lengkap**: (nama Anda)
   - **Email**: (email valid)
   - **Password**: (min 6 karakter)
3. Click **"Buat Akun"**
4. ✅ Kalau success → redirect ke dashboard
5. ❌ Kalau error:
   - Check console (F12 → Console tab)
   - Kemungkinan: Supabase keys salah atau auth not enabled

---

### 3.3 Setup Store

1. Di dashboard, buka **"Toko Saya"** atau `/app/store`
2. Isi semua field:
   - **Nama Toko**: (contoh: Toko Kopi Saya)
   - **Slug URL**: (contoh: toko-kopi-saya, alphanumeric + dash only)
   - **Jenis Bisnis**: (contoh: Makanan & Minuman)
   - **WhatsApp**: (contoh: 6281234567890, tanpa +)
   - **Email**: (email toko)
   - **Alamat**: (alamat lengkap)
   - **Rekening Bank**: (nama bank, nomor rekening, atas nama)
   - **Instruksi Pembayaran**: (contoh: "Transfer ke BCA 1234567890 a.n. Toko Saya")
   - **Status**: **Published** (toggle ON)
3. (Optional) Upload:
   - **Logo**: Max 2MB, PNG/JPG/WebP
   - **Banner**: Max 2MB, landscape
   - **QRIS**: Kalau punya QRIS image
4. Click **"Simpan"**
5. ✅ Success → toko Anda ready

---

### 3.4 Add First Product

1. Buka **"Produk"** atau `/app/products`
2. Click **"Tambah Produk"**
3. Isi form:
   - **Nama**: (contoh: Kopi Arabica 250g)
   - **SKU**: (contoh: KOP-001, optional)
   - **Kategori**: (contoh: Minuman)
   - **Deskripsi**: (deskripsi produk)
   - **Harga**: (contoh: 50000, tanpa titik/koma)
   - **Compare at Price**: (optional, harga coret)
   - **Stok**: (contoh: 10)
   - **Status**: **Active**
   - **Cara Penjualan**: Pilih salah satu:
     - Digital (tanpa alamat)
     - Ambil di toko
     - Delivery (perlu alamat)
     - Preorder ambil di toko
4. (Optional) Upload **gambar produk**
5. Click **"Simpan Produk"**
6. ✅ Product created

---

### 3.5 Test Storefront as Buyer

1. Buka **"Buka Toko"** (link atau `/store/your-slug`)
2. ✅ Harus lihat:
   - Nama toko
   - Banner (kalau diupload)
   - Produk yang Anda buat
3. Click produk → lihat detail
4. Click **"Tambah Cart"** atau **"Beli Sekarang"**
5. Isi form checkout:
   - **Nama**: (nama pembeli)
   - **WhatsApp**: (nomor pembeli)
   - **Email**: (optional)
   - **Alamat**: (kalau delivery)
   - **Metode Pembayaran**: Manual Transfer atau QRIS
6. Click **"Submit Order"**
7. ✅ Redirect ke `/success/TK-xxxxx`
8. ✅ Lihat instruksi pembayaran

---

### 3.6 Verify Order in Dashboard

1. Balik ke dashboard
2. Buka **"Pesanan"** atau `/app/orders`
3. ✅ Order baru harus muncul
4. Click order → lihat detail
5. Update **Payment Status** → **Paid**
6. Update **Order Status** → **Processing** → **Completed**

---

## 🎯 STEP 4: VERIFY CORE FEATURES

### Checklist Features to Test

```
✅ Homepage loads
✅ Register seller works
✅ Login/logout works
✅ Create store works
✅ Upload logo/banner works (check Supabase Storage)
✅ Add product works
✅ Upload product image works
✅ Public storefront shows products
✅ Add to cart works
✅ Checkout works
✅ Order appears in dashboard
✅ Update order status works
✅ WhatsApp link works (test click tombol)
```

**Kalau semua ✅, TokoKit PRODUCTION READY!** 🎉

---

## 🔧 STEP 5: (OPTIONAL) PAYMENT GATEWAY

### Midtrans Setup

1. Daftar di https://dashboard.midtrans.com
2. Buat merchant account
3. Ambil **Sandbox Server Key** (untuk testing)
4. Add env var di Vercel:
   ```
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
   MIDTRANS_IS_PRODUCTION=false
   ```
5. Set webhook URL di Midtrans:
   ```
   https://your-project.vercel.app/api/webhook-midtrans
   ```
6. Redeploy Vercel
7. Test checkout dengan Midtrans

### Xendit Setup

Similar dengan Midtrans:

1. Daftar https://dashboard.xendit.co
2. Get API keys
3. Add env vars
4. Set webhook URL:
   ```
   https://your-project.vercel.app/api/webhook-xendit
   ```

---

## 🐛 TROUBLESHOOTING

### "Supabase connection failed"

- Check `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `frontend/config.js`
- Pastikan RLS policies enabled di Supabase

### "Upload failed"

- Check storage bucket `tokokit-assets` exists
- Check bucket is PUBLIC
- Check file size < 2MB

### "Order not created"

- Check browser console (F12 → Console)
- Check Vercel logs (Vercel dashboard → Logs)
- Check Supabase logs (Supabase → Logs)

### "Webhook not working"

- Check env vars di Vercel
- Check webhook URL correct
- Check payment gateway dashboard logs

### "Blank page / 404"

- Check `vercel.json` committed
- Check Vercel build logs
- Hard refresh (Ctrl+Shift+R)

---

## 📚 NEXT STEPS

### For Learning:

1. Explore code di `frontend/app.js` (3200 lines!)
2. Understand Supabase RLS policies di `docs/SUPABASE_SCHEMA.sql`
3. Read payment webhook logic di `api/_lib.js`
4. Understand inventory system (digital fulfillment)

### For Production:

1. Get custom domain (Vercel → Domains)
2. Enable email verification (Supabase Auth settings)
3. Set up real payment gateway (Midtrans/Xendit production)
4. Add more products & test real transactions
5. Get feedback from real users

### For Portfolio:

1. Screenshot homepage, dashboard, storefront
2. Write case study (problem → solution → impact)
3. Deploy link di GitHub README
4. Add to LinkedIn/portfolio

---

## ✅ COMPLETION CHECKLIST

Setelah semua selesai, Anda harus punya:

- ✅ TokoKit deployed di Vercel (public URL)
- ✅ Supabase database configured (13 tables)
- ✅ Storage bucket ready (upload images works)
- ✅ First seller account created
- ✅ First store created & published
- ✅ First product added
- ✅ Test order completed
- ✅ Payment flow works (manual/QRIS)
- ✅ Dashboard shows orders
- ✅ WhatsApp integration works

**CONGRATULATIONS! 🎉 TokoKit is LIVE!**

---

## 📞 SUPPORT

**Issues/Bugs:**

- GitHub Issues: https://github.com/Optra123/tokokit/issues
- Check browser console (F12)
- Check Vercel logs
- Check Supabase logs

**Documentation:**

- `README.md` - Project overview
- `SPEC.md` - Product specification
- `docs/DEPLOYMENT_GUIDE.md` - Original deployment guide
- `docs/SUPABASE_SCHEMA.sql` - Database schema
- `docs/API_CONTRACT.md` - API documentation

**Code Review:**

- Run tests: `npm test` (35 tests should pass)
- Run linter: `npm run lint`
- Format code: `npm run format`

---

**Last Updated:** 2026-07-06  
**Version:** 1.0 (Production Ready)  
**Author:** Claude Code (with Optra123)

---

_Good luck with your TokoKit deployment! 🚀_
