# TokoKit Database Schema

Database utama versi publik menggunakan Supabase Postgres. SQL lengkap ada di `docs/SUPABASE_SCHEMA.sql`.

## Core Tables

### tenants

Menyimpan organisasi/seller workspace.

Field utama: `id`, `name`, `owner_user_id`, `plan`, `status`, `created_at`, `updated_at`.

### profiles

Profil user Supabase Auth yang terhubung ke tenant.

Field utama: `id`, `tenant_id`, `email`, `full_name`, `role`, `created_at`, `updated_at`.

### stores

Data toko publik dan pengaturan pembayaran manual.

Field utama: `id`, `tenant_id`, `slug`, `name`, `description`, `business_type`, `whatsapp`, `email`, `address`, `brand_color`, `logo_url`, `banner_url`, `bank_name`, `bank_account_number`, `bank_account_name`, `qris_image_url`, `payment_instruction`, `is_active`.

Field operasional: `fulfillment_mode`, `shipping_fee`, `pickup_note`, `pakasir_slug`, `payment_gateway_enabled`.

### products

Katalog produk seller.

Field utama: `id`, `tenant_id`, `store_id`, `name`, `slug`, `sku`, `category`, `description`, `price`, `compare_at_price`, `stock`, `product_type`, `fulfillment_type`, `status`, `image_url`.

Field digital delivery: `digital_delivery_enabled`, `delivery_subject`, `delivery_message`, `digital_stock_notes`.

Untuk produk digital, `stock` dipakai sebagai angka stok publik yang disinkronkan dari jumlah `inventory_items` berstatus `available`.

Enum:

- `product_type`: `physical`, `preorder`, `digital`, `service`
- `fulfillment_type`: `digital`, `pickup`, `delivery`, `preorder_pickup`
- `status`: `active`, `draft`, `archived`

### customers

Data pembeli yang dibuat saat checkout publik.

Field utama: `id`, `tenant_id`, `store_id`, `name`, `whatsapp`, `email`, `address`.

### orders

Header pesanan.

Field utama: `id`, `tenant_id`, `store_id`, `customer_id`, `order_number`, `buyer_name`, `buyer_whatsapp`, `buyer_email`, `buyer_address`, `subtotal`, `discount_amount`, `shipping_fee`, `total_amount`, `fulfillment_type`, `payment_method`, `payment_status`, `order_status`, `notes`.

Enum:

- `payment_method`: `manual_transfer`, `qris`
- `payment_status`: `unpaid`, `paid`, `failed`
- `order_status`: `new`, `processing`, `shipped`, `completed`, `cancelled`

### order_items

Snapshot produk dalam pesanan.

Field utama: `id`, `tenant_id`, `store_id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `total_price`.

### payments

Status pembayaran manual/QRIS.

Field utama: `id`, `tenant_id`, `store_id`, `order_id`, `method`, `amount`, `status`, `paid_at`, `raw_payload`.

### inventory_items

Stok digital siap kirim seperti voucher, akun, license key, atau payload digital lain.

Field utama: `id`, `tenant_id`, `store_id`, `product_id`, `order_id`, `label`, `payload`, `status`, `buyer_email`, `note`, `delivered_at`.

Enum:

- `status`: `available`, `reserved`, `sold`, `delivered`, `cancelled`

Public buyer tidak boleh membaca tabel ini. Storefront hanya memakai angka `products.stock`.

### stock_movements

Riwayat perubahan stok untuk audit ringan.

Field utama: `id`, `tenant_id`, `store_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `note`, `created_at`.

### fulfillment_logs

Catatan proses fulfillment order, termasuk reserve stok digital dan status pengiriman manual/otomatis.

Field utama: `id`, `tenant_id`, `store_id`, `order_id`, `inventory_item_id`, `action`, `status`, `message`, `created_at`.

### settings

Key-value setting per tenant/store untuk fitur lanjutan.

### audit_logs

Log perubahan penting untuk kebutuhan debugging dan compliance ringan.

## Row Level Security

RLS diaktifkan untuk semua tabel.

- Seller hanya bisa membaca/mengubah data dengan `tenant_id` miliknya.
- Public user hanya bisa membaca store aktif dan produk aktif.
- Public user hanya bisa membuat customer, order, order items, dan payment untuk store aktif.
- Public user tidak bisa update/delete data setelah checkout.
- Public user tidak bisa membaca inventory digital, stock movements, atau fulfillment logs.

## Legacy Schema

Schema Google Sheets lama masih tercermin di `apps-script/Code.gs`, tetapi bukan backend utama untuk versi publik.
