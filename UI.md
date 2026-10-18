# Panduan Lengkap UI/UX Frontend: Admin & Dokter

Dokumen ini menjelaskan struktur UI yang ideal untuk aplikasi lab puskesmas dan mencatat status implementasi yang sudah ada di project ini.

## Status Implementasi Saat Ini

Bagian yang sudah cukup matang:
- Login page dan protected route.
- Layout sidebar/topbar yang menyesuaikan role.
- Dashboard admin, analis, dan dokter dasar.
- Struktur folder modular yang sesuai arahan UI.

Bagian yang masih perlu ditingkatkan:
- Form CRUD lengkap untuk user, kategori, dan parameter.
- Data binding ke API live di seluruh modul.
- UI untuk pdf report, loading/error, dan notifikasi.
- Komponen reusable yang lebih konsisten untuk tabel, modal, dan form.

---

## 1. Antarmuka untuk ADMIN (Sistem & Master Data)

Admin berperan sebagai pengendali utama sistem dan data master.

### A. Dashboard Admin
- Widget statistik: total pengguna, total pasien, total kategori aktif.
- Log kegiatan terakhir (opsional).

### B. Halaman Manajemen Pengguna
- Tabel user: username, nama lengkap, role, tanggal dibuat.
- Form modal buat/edit user.
- Badge role: admin merah, analis biru, dokter hijau.
- Tombol edit, hapus, reset password.

### C. Halaman Manajemen Kategori Tes
- Tabel kategori.
- Form tambah/edit kategori.

### D. Halaman Manajemen Parameter Tes
- Tabel parameter dengan kolom nama, kategori, satuan, nilai rujukan, min/max pria, min/max wanita.
- Filter berdasarkan kategori.
- Form tambah param yang dibuat jelas untuk pria dan wanita.

### E. Pengaturan Instansi (Opsional)
- Nama puskesmas, alamat, logo, dan format kop surat untuk laporan.

---

## 2. Antarmuka untuk DOKTER (Validasi & Klinis)

Dokter fokus pada pembacaan data dan keputusan klinis.

### A. Dashboard Dokter
- Banner dengan jumlah pemeriksaan yang menunggu validasi.
- Grafik atau ringkasan statistik kunjungan.

### B. Halaman Antrean Validasi
- Tabel pemeriksaan menunggu validasi.
- Kolom: waktu daftar, nama pasien, jenis tes, analis, prioritas CITO.
- Tombol untuk meninjau hasil.

### C. Halaman Detail Tinjauan
- Header pasien: nama, NIK, umur, jenis kelamin.
- Tabel hasil lab read-only dengan highlight abnormal.
- Textarea catatan klinis.
- Tombol: Tolak/Revisi dan Validasi & Sahkan.

### D. Halaman Riwayat Pasien
- Pencarian berdasarkan nama atau NIK.
- Kotak riwayat hasil sebelumnya untuk analisis tren pasien.

---

## 3. Struktur Komponen React yang Disarankan

Struktur yang saat ini sudah mulai dijalankan adalah:

```text
src/
├── components/
│   ├── Layout/
│   ├── UI/
│   └── StatusBadge/
├── pages/
│   ├── Auth/
│   ├── Admin/
│   ├── Dokter/
│   ├── Analis/
│   └── Common/
├── utils/
│   ├── auth.js
│   └── api.js
├── App.jsx
├── App.css
└── main.jsx
```

## 4. Prinsip UI yang Harus Tetap Dipertahankan

- Jelas dan rapi untuk data lab.
- Prioritaskan readability untuk dokter.
- Gunakan highlight visual untuk abnormal value.
- Pagi-hari dan timeline status harus mudah dibaca.
- RBAC harus benar-benar dibatasi dengan route guard.

## 5. Backlog UI Prioritas Selanjutnya

### Prioritas P0
- Real bind semua halaman ke API live.
- Form CRUD admin benar-benar jadi.
- Integrasi validasi dokter dengan backend.

### Prioritas P1
- Notifikasi, toaster, dan loading spinner.
- Pencarian dan filter lebih matang.
- Detail pasien dan riwayat hasil lebih hidup.

### Prioritas P2
- Export PDF hasil lab.
- Responsif untuk tablet dan laptop.
- Pola form reusable dan konsisten.

## 6. Kesimpulan

UI yang sudah ada sudah cukup kuat sebagai fondasi untuk aplikasi lab puskesmas. Saat ini arah pengembangan terbaik adalah mengerjakan penghubung data ke backend, lalu menutup fitur finishing seperti PDF, log aktivitas, dan testing. Dengan cara ini progres bisa dicicil tanpa kehilangan fokus terhadap produk akhir.