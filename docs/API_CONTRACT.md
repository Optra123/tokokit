# TokoKit API Contract

Versi publik TokoKit memakai Supabase client SDK dari frontend. Tidak ada REST backend custom untuk v1. Kontrak utama adalah tabel Supabase, RLS policy, dan route frontend.

## Frontend Routes

```text
/login
/register
/app/dashboard
/app/store
/app/products
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
```

Frontend menulis:

```text
stores update
products insert/update/archive
orders update payment_status/order_status
payments update status
```

## Public Storefront Access

Public user membaca:

```text
stores where slug = :slug and is_active = true
products where store_id = store.id and status = active
```

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

Payment method:

```text
manual_transfer
qris
```

## Legacy Apps Script API

Backend Apps Script lama tetap berada di `apps-script/Code.gs` sebagai reference prototype. Endpoint `?action=...` bukan jalur utama versi publik.
