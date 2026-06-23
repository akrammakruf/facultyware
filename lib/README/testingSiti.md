# Dokumentasi Automated Testing (Siti Hardini #15)

Modul Pengelolaan Event dan Panitia telah berhasil melewati tahap pengujian (*Automated Testing*) menggunakan `jest` dan `supertest`. Pengujian ini bertujuan untuk memastikan seluruh proses pengelolaan event, panitia, serta API JSON berjalan sesuai spesifikasi dan tidak mengalami regresi ketika dilakukan pengembangan lanjutan.

## Hasil Pengujian (Test Results)

Semua skenario pengujian utama berhasil lolos (✅ PASS) pada file `tests/siti-event-committee.spec.js`:

1. ✅ **Test tambah event**: Endpoint pembuatan event berhasil menyimpan data event baru ke database dengan status awal `draft`.

2. ✅ **Test update event**: Endpoint pembaruan event berhasil mengubah informasi event (judul, deskripsi, lokasi, dan jadwal) sesuai data yang dikirimkan.

3. ✅ **Test publish event**: Endpoint publikasi event berhasil mengubah status event dari `draft` menjadi `published`.

4. ✅ **Test tambah anggota panitia**: Endpoint penambahan panitia berhasil menyimpan anggota panitia baru ke tabel `event_committee_members`.

5. ✅ **Test detail panitia**: Endpoint detail panitia berhasil mengembalikan data anggota panitia berdasarkan event yang dipilih.

6. ✅ **Test API committee GET**: Endpoint `GET /api/siti/committee/:eventId` berhasil mengembalikan data panitia dalam format JSON.

7. ✅ **Test API committee POST**: Endpoint `POST /api/siti/committee` berhasil menambahkan data panitia baru dan mengembalikan HTTP 201 Created.

8. ✅ **Test API committee PUT**: Endpoint `PUT /api/siti/committee/:id` berhasil memperbarui data panitia yang sudah ada.

9. ✅ **Test API committee DELETE**: Endpoint `DELETE /api/siti/committee/:id` berhasil menghapus data panitia dari database.

10. ✅ **Test export Excel**: Endpoint export berhasil menghasilkan file Excel (`.xlsx`) yang berisi daftar anggota panitia sesuai event yang dipilih.

11. ✅ **Test export PDF**: Endpoint export berhasil menghasilkan file PDF berisi data panitia.

12. ✅ **Test export DOCX**: Endpoint export berhasil menghasilkan file Microsoft Word (`.docx`) berisi data panitia.

> [!TIP]
> Waktu eksekusi keseluruhan *test suite* rata-rata memakan waktu sekitar 2–3 detik tergantung kondisi database lokal dan jumlah data pengujian.

## Cara Menjalankan Test

Untuk menjalankan ulang pengujian:

```bash
npm test
```

Perintah tersebut akan menjalankan seluruh file pengujian yang menggunakan ekstensi `.spec.js` melalui framework `jest`.

## Catatan Database Cleanup

Test suite ini mengisolasi data pengujian secara otomatis dengan mekanisme berikut:

1. Menambahkan (*INSERT*) data event dummy ke tabel `events` pada tahap `beforeAll`.

2. Menambahkan data panitia dummy ke tabel `event_committee_members` sebagai kebutuhan pengujian.

3. Menjalankan seluruh skenario pengujian terhadap data dummy tersebut.

4. Menghapus (*DELETE*) seluruh data dummy event dan panitia pada tahap `afterAll`.

Dengan pendekatan ini, database utama tetap bersih dan tidak tercampur dengan data hasil pengujian otomatis.
