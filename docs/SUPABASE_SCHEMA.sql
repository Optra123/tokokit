create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tokokit-assets',
  'tokokit-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null,
  plan text not null default 'free',
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  business_type text,
  whatsapp text,
  email text,
  address text,
  brand_color text default '#2563eb',
  logo_url text,
  banner_url text,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  qris_image_url text,
  payment_instruction text,
  fulfillment_mode text not null default 'pickup',
  shipping_fee numeric(14,2) not null default 0,
  pickup_note text,
  pakasir_slug text,
  payment_gateway_enabled boolean not null default false,
  payment_gateway_provider text not null default 'manual' check (payment_gateway_provider in ('manual', 'pakasir', 'custom_link', 'midtrans', 'xendit')),
  payment_gateway_project_id text,
  payment_gateway_checkout_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  sku text,
  category text,
  description text,
  price numeric(14,2) not null default 0,
  compare_at_price numeric(14,2) not null default 0,
  stock integer not null default 0,
  product_type text not null default 'physical' check (product_type in ('physical', 'preorder', 'digital', 'service')),
  fulfillment_type text not null default 'pickup',
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  image_url text,
  digital_delivery_enabled boolean not null default false,
  delivery_subject text,
  delivery_message text,
  digital_stock_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  whatsapp text not null,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  order_number text not null unique,
  buyer_name text not null,
  buyer_whatsapp text not null,
  buyer_email text,
  buyer_address text,
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  shipping_fee numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  fulfillment_type text not null default 'pickup',
  payment_method text not null default 'manual_transfer' check (payment_method in ('manual_transfer', 'qris')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'failed')),
  order_status text not null default 'new' check (order_status in ('new', 'processing', 'shipped', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  fulfillment_type text not null default 'pickup',
  quantity integer not null default 1,
  unit_price numeric(14,2) not null default 0,
  total_price numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null default 'manual_transfer' check (method in ('manual_transfer', 'qris')),
  amount numeric(14,2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'failed')),
  gateway_provider text not null default 'manual',
  gateway_reference text,
  checkout_url text,
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  label text not null,
  payload text not null,
  status text not null default 'available' check (status in ('available', 'reserved', 'sold', 'delivered', 'cancelled')),
  buyer_email text,
  note text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  movement_type text not null check (movement_type in ('manual_adjustment', 'checkout_reserved', 'payment_paid', 'cancelled', 'refund')),
  quantity_delta integer not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.fulfillment_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  action text not null,
  status text not null default 'pending',
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, store_id, key)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_tenant on public.profiles(tenant_id);
create index if not exists idx_stores_tenant on public.stores(tenant_id);
create index if not exists idx_stores_slug on public.stores(slug);
create index if not exists idx_products_store_status on public.products(store_id, status);
create index if not exists idx_orders_store_created on public.orders(store_id, created_at desc);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_inventory_product_status on public.inventory_items(product_id, status);
create index if not exists idx_inventory_order on public.inventory_items(order_id);
create index if not exists idx_stock_movements_tenant_created on public.stock_movements(tenant_id, created_at desc);
create index if not exists idx_fulfillment_logs_order on public.fulfillment_logs(order_id, created_at desc);

alter table public.stores add column if not exists fulfillment_mode text not null default 'pickup';
alter table public.stores add column if not exists shipping_fee numeric(14,2) not null default 0;
alter table public.stores add column if not exists pickup_note text;
alter table public.stores add column if not exists pakasir_slug text;
alter table public.stores add column if not exists payment_gateway_enabled boolean not null default false;
alter table public.stores add column if not exists payment_gateway_provider text not null default 'manual';
alter table public.stores add column if not exists payment_gateway_project_id text;
alter table public.stores add column if not exists payment_gateway_checkout_url text;
alter table public.products add column if not exists fulfillment_type text not null default 'pickup';
alter table public.products add column if not exists digital_delivery_enabled boolean not null default false;
alter table public.products add column if not exists delivery_subject text;
alter table public.products add column if not exists delivery_message text;
alter table public.products add column if not exists digital_stock_notes text;
alter table public.orders add column if not exists fulfillment_type text not null default 'pickup';
alter table public.order_items add column if not exists fulfillment_type text not null default 'pickup';
alter table public.inventory_items add column if not exists buyer_email text;
alter table public.inventory_items add column if not exists note text;
alter table public.inventory_items add column if not exists delivered_at timestamptz;
alter table public.payments add column if not exists gateway_provider text not null default 'manual';
alter table public.payments add column if not exists gateway_reference text;
alter table public.payments add column if not exists checkout_url text;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.fulfillment_logs enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_tenant_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

drop policy if exists "seller can read own tenant" on public.tenants;
drop policy if exists "seller can create tenant" on public.tenants;
drop policy if exists "seller can update own tenant" on public.tenants;
drop policy if exists "seller can read own profile" on public.profiles;
drop policy if exists "seller can create own profile" on public.profiles;
drop policy if exists "seller can update own profile" on public.profiles;
drop policy if exists "seller can manage own stores" on public.stores;
drop policy if exists "public can read active stores" on public.stores;
drop policy if exists "seller can manage own products" on public.products;
drop policy if exists "public can read active products" on public.products;
drop policy if exists "seller can manage own customers" on public.customers;
drop policy if exists "public can create customers for active stores" on public.customers;
drop policy if exists "seller can manage own orders" on public.orders;
drop policy if exists "public can create orders for active stores" on public.orders;
drop policy if exists "seller can manage own order items" on public.order_items;
drop policy if exists "public can create order items for active stores" on public.order_items;
drop policy if exists "seller can manage own payments" on public.payments;
drop policy if exists "public can create unpaid payments for active stores" on public.payments;
drop policy if exists "seller can manage own inventory items" on public.inventory_items;
drop policy if exists "seller can manage own stock movements" on public.stock_movements;
drop policy if exists "seller can manage own fulfillment logs" on public.fulfillment_logs;
drop policy if exists "seller can manage own settings" on public.settings;
drop policy if exists "seller can read own audit logs" on public.audit_logs;
drop policy if exists "seller can create own audit logs" on public.audit_logs;
drop policy if exists "public can read tokokit assets" on storage.objects;
drop policy if exists "authenticated can upload tokokit assets" on storage.objects;
drop policy if exists "authenticated can update tokokit assets" on storage.objects;
drop policy if exists "authenticated can delete tokokit assets" on storage.objects;

create policy "seller can read own tenant" on public.tenants
for select to authenticated
using (id = public.current_tenant_id() or owner_user_id = auth.uid());

create policy "seller can create tenant" on public.tenants
for insert to authenticated
with check (owner_user_id = auth.uid());

create policy "seller can update own tenant" on public.tenants
for update to authenticated
using (id = public.current_tenant_id() or owner_user_id = auth.uid())
with check (id = public.current_tenant_id() or owner_user_id = auth.uid());

create policy "seller can read own profile" on public.profiles
for select to authenticated
using (id = auth.uid() or tenant_id = public.current_tenant_id());

create policy "seller can create own profile" on public.profiles
for insert to authenticated
with check (id = auth.uid());

create policy "seller can update own profile" on public.profiles
for update to authenticated
using (id = auth.uid() or tenant_id = public.current_tenant_id())
with check (id = auth.uid() or tenant_id = public.current_tenant_id());

create policy "seller can manage own stores" on public.stores
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "public can read active stores" on public.stores
for select to anon, authenticated
using (is_active = true);

create policy "seller can manage own products" on public.products
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "public can read active products" on public.products
for select to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1 from public.stores
    where stores.id = products.store_id
    and stores.is_active = true
  )
);

create policy "seller can manage own customers" on public.customers
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "public can create customers for active stores" on public.customers
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.stores
    where stores.id = customers.store_id
    and stores.tenant_id = customers.tenant_id
    and stores.is_active = true
  )
);

create policy "seller can manage own orders" on public.orders
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "public can create orders for active stores" on public.orders
for insert to anon, authenticated
with check (
  payment_status = 'unpaid'
  and order_status = 'new'
  and exists (
    select 1 from public.stores
    where stores.id = orders.store_id
    and stores.tenant_id = orders.tenant_id
    and stores.is_active = true
  )
);

create policy "seller can manage own order items" on public.order_items
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "public can create order items for active stores" on public.order_items
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.stores
    where stores.id = order_items.store_id
    and stores.tenant_id = order_items.tenant_id
    and stores.is_active = true
  )
);

create policy "seller can manage own payments" on public.payments
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "public can create unpaid payments for active stores" on public.payments
for insert to anon, authenticated
with check (
  status = 'unpaid'
  and exists (
    select 1 from public.stores
    where stores.id = payments.store_id
    and stores.tenant_id = payments.tenant_id
    and stores.is_active = true
  )
);

create policy "seller can manage own inventory items" on public.inventory_items
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "seller can manage own stock movements" on public.stock_movements
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "seller can manage own fulfillment logs" on public.fulfillment_logs
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "seller can manage own settings" on public.settings
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "seller can read own audit logs" on public.audit_logs
for select to authenticated
using (tenant_id = public.current_tenant_id());

create policy "seller can create own audit logs" on public.audit_logs
for insert to authenticated
with check (tenant_id = public.current_tenant_id());

create policy "public can read tokokit assets" on storage.objects
for select to anon, authenticated
using (bucket_id = 'tokokit-assets');

create policy "authenticated can upload tokokit assets" on storage.objects
for insert to authenticated
with check (bucket_id = 'tokokit-assets');

create policy "authenticated can update tokokit assets" on storage.objects
for update to authenticated
using (bucket_id = 'tokokit-assets')
with check (bucket_id = 'tokokit-assets');

create policy "authenticated can delete tokokit assets" on storage.objects
for delete to authenticated
using (bucket_id = 'tokokit-assets');
