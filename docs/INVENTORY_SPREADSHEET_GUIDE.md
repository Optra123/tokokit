# Inventory Spreadsheet Guide

Panduan ini untuk seller yang ingin mengelola stok digital di Excel atau Google Sheets, lalu import ke TokoKit.

## Format Kolom

Gunakan header ini di baris pertama:

```text
product_sku,product_id,label,payload,status,note
```

Kolom wajib:

- `product_sku` atau `product_id`
- `label`
- `payload`

Kolom opsional:

- `status`: kosong akan menjadi `available`
- `note`

Status yang didukung:

```text
available
reserved
sold
delivered
cancelled
```

## Cara Pakai dari Google Sheets

1. Buka Google Sheets.
2. Buat spreadsheet baru.
3. Isi baris pertama dengan header template.
4. Isi `product_sku` sesuai SKU produk digital di TokoKit.
5. Isi `label`, misalnya `Akun Canva #001`.
6. Isi `payload`, misalnya `email@example.com | password123 | catatan`.
7. Isi `status` dengan `available`.
8. Di TokoKit, buka **Seller Center > Inventori**.
9. Pilih salah satu:
   - copy tabel dari Google Sheets lalu paste ke field **Paste tabel dari spreadsheet**
   - klik **File > Download > Comma Separated Values (.csv)** lalu upload CSV
   - klik **File > Share > Publish to web**, pilih CSV, lalu tempel URL ke **URL CSV publik**
10. Klik import.

## Cara Pakai dari Excel

1. Buka Excel.
2. Buat kolom sesuai template.
3. Simpan sebagai CSV.
4. Buka **Seller Center > Inventori**.
5. Upload file CSV.

## Catatan Penting

- Jangan pakai stok manual di form produk untuk produk digital.
- Stok publik produk digital dihitung dari jumlah inventory item berstatus `available`.
- Payload hanya boleh terlihat oleh seller.
- Item yang sudah `reserved`, `sold`, atau `delivered` jangan dihapus agar riwayat order tetap utuh.
