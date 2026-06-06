# Visual Setup Guide

Panduan ini untuk menyiapkan tampilan TokoKit agar terlihat lebih siap publik.

## Homepage

Homepage `/` sekarang memakai visual hero, logo integrasi, preview dashboard, feature cards, dan CTA seller.

Yang perlu dicek:

1. Buka `/`.
2. Pastikan hero image tampil.
3. Pastikan tombol **Buat Toko** menuju `/register`.
4. Pastikan tombol **Masuk Seller** menuju `/login`.
5. Scroll sampai bawah dan cek logo integrasi serta feature card.

## Storefront Seller

Untuk membuat toko publik terlihat lebih profesional:

1. Buka **Seller Center > Toko Saya**.
2. Isi **Nama toko**.
3. Isi **Jenis usaha**.
4. Isi **Deskripsi toko**.
5. Upload **Logo**.
6. Upload **Banner**.
7. Isi **Warna brand**.
8. Isi **Alamat toko** atau lokasi operasional.
9. Klik **Simpan**.
10. Klik **Preview**.

Jika banner belum diupload, TokoKit memakai fallback image otomatis berdasarkan jenis usaha:

- makanan/kopi/minuman
- digital/software/voucher
- default commerce

## Produk

Untuk product card yang bagus:

1. Buka **Seller Center > Produk**.
2. Edit produk.
3. Isi nama dan kategori.
4. Upload gambar produk.
5. Pilih cara penjualan:
   - Digital
   - Pickup
   - Delivery
   - Preorder pickup
6. Untuk produk digital, isi stok melalui **Inventori**, bukan field stok manual.

## Mobile Check

Setelah deploy:

1. Buka website dari HP.
2. Cek `/`.
3. Cek `/store/{slug}`.
4. Cek product detail popup.
5. Cek checkout.
6. Pastikan tombol tidak saling menumpuk dan teks tidak kepotong.

## Catatan

Gambar hero fallback saat ini memakai URL eksternal dari Unsplash. Untuk production lebih serius, sebaiknya upload asset sendiri ke Supabase Storage atau folder asset project agar tidak tergantung layanan gambar eksternal.
