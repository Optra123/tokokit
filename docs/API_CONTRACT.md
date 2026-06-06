# TokoKit API Contract

Versi publik TokoKit memakai Supabase client SDK dari frontend. Tidak ada REST backend custom untuk v1. Kontrak utama adalah tabel Supabase, RLS policy, dan route frontend.

## Frontend Routes

```text
/login
/register
/app/dashboard
/app/store
/app/products
/app/inventory
/app/orders
/app/payments
/app/settings
/store/:slug
/checkout/:slug
/success/:orderNumber
```

## Auth

Supabase Auth email/password.

Flow:

1. Seller register via `supabase.auth.signUp`.
2. Seller login via `supabase.auth.signInWithPassword`.
3. Saat seller pertama kali masuk, frontend membuat:
   - `tenants`
   - `profiles`
   - `stores`

## Seller Data Access

Seller hanya boleh mengakses data tenant sendiri melalui RLS.

Frontend membaca:

```text
profiles by auth.uid()
tenants by profile.tenant_id
stores by profile.tenant_id
products by profile.tenant_id
orders by profile.tenant_id
payments by profile.tenant_id
inventory_items by profile.tenant_id
stock_movements by profile.tenant_id
fulfillment_logs by profile.tenant_id
```

Frontend menulis:

```text
stores update
products insert/update/archive
inventory_items insert/update/delete
orders update payment_status/order_status
payments update status
stock_movements insert
fulfillment_logs insert
```

Inventory import mendukung input frontend:

```text
CSV file upload
Spreadsheet paste
Public CSV URL
```

Header inventory import:

```text
product_sku,product_id,label,payload,status,note
```

## Payment Gateway

Provider yang bisa disimpan di `stores.payment_gateway_provider`:

```text
manual
pakasir
custom_link
midtrans
xendit
```

Frontend dapat membuat payment link untuk:

```text
pakasir
custom_link
```

Midtrans dan Xendit tidak boleh memakai secret key di frontend. Keduanya harus memakai backend/serverless endpoint untuk membuat transaksi dan menerima webhook.

Payment row menyimpan:

```text
gateway_provider
gateway_reference
checkout_url
```

## Public Storefront Access

Public user membaca:

```text
stores where slug = :slug and is_active = true
products where store_id = store.id and status = active
```

Produk digital memakai `products.stock` sebagai angka stok publik. Isi stok rahasia tetap berada di `inventory_items` dan tidak boleh dibaca public user.

Public user menulis saat checkout:

```text
customers insert
orders insert
order_items insert
payments insert
```

RLS memastikan insert hanya valid untuk store aktif.

## Status Values

Product:

```text
active
draft
archived
```

Payment:

```text
unpaid
paid
failed
```

Order:

```text
new
processing
shipped
completed
cancelled
```

Inventory item:

```text
available
reserved
sold
delivered
cancelled
```

Payment method:

```text
manual_transfer
qris
```

## Legacy Apps Script API

Backend Apps Script lama tetap berada di `apps-script/Code.gs` sebagai reference prototype. Endpoint `?action=...` bukan jalur utama versi publik.
