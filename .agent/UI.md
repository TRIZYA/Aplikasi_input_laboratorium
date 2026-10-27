# Panduan UI & Alur Pengguna Aplikasi Lab Puskesmas

Dokumen ini menjelaskan bagaimana UI seharusnya merepresentasikan alur kerja laboratorium nyata di puskesmas, bukan hanya CRUD master data. Fokus utama UI adalah membuat alur kerja pasien menjadi jelas, cepat dipahami, dan aman dari kesalahan input.

## Prinsip desain utama

1. UI harus memperlihatkan alur pasien dengan jelas.
2. Data pelaporan harus mudah dibaca oleh dokter dan analis.
3. Nilai abnormal harus langsung terlihat secara visual.
4. Setiap halaman harus memberi konteks: pasien siapa, pemeriksaan apa, status apa, dan aksi apa yang berikutnya.
5. Layout harus bersih, konsisten, dan berbasis data klinis, bukan sekadar form boilerplate.

## Status implementasi UI saat ini

Sudah ada:
- layout shell per role;
- sidebar dan halaman dashboard admin/analis/dokter;
- page pasien, order pemeriksaan, dan review hasil dasar;
- modul CRUD admin untuk user/kategori/parameter;
- status dan highlight abnormal untuk hasil lab.

Masih perlu ditingkatkan:
- integrasi penuh ke API live untuk semua modul;
- form pasien dan order pemeriksaan yang lebih lengkap secara klinis;
- detail hasil lab yang lebih rapi untuk dokter;
- notifikasi dan loading state yang lebih seragam;
- export PDF laporan dan cetak hasil pemeriksaan.

## 1. UI Admin

### Dashboard admin
Tampilan dashboard admin harus fokus pada ringkasan operasional, misalnya:
- total pengguna aktif;
- total pasien terdaftar;
- total kategori tes aktif;
- total parameter aktif;
- ringkasan status pemeriksaan hari ini.

Harus tampil sederhana dan bersih, tanpa menampilkan data operasional dari role lain.

### Manajemen pengguna
UI untuk admin harus memiliki:
- tabel user dengan username, nama lengkap, role, status, aksi;
- tombol tambah user dan reset password;
- modal edit user dengan validasi form;
- tombol hapus dengan konfirmasi.

### Manajemen kategori tes
UI kategori tes harus menampilkan:
- nama kategori;
- deskripsi;
- tombol tambah/edit/hapus dengan konfirmasi.

### Manajemen parameter tes
Parameter tes perlu layout yang rapi dan informatif:
- nama parameter;
- kategori;
- satuan;
- nilai rujukan;
- rentang min/max pria dan wanita;
- tombol edit/hapus.

## 2. UI Analis

### Halaman pasien
Halaman pasien harus memungkinkan analis untuk:
- menambah pasien baru;
- mencari pasien berdasarkan NIK atau nama;
- melihat data dasar pasien;
- menampilkan umur, jenis kelamin, tanggal lahir, alamat, no_hp.

### Halaman order pemeriksaan
UI ini harus menampilkan:
- pasien yang dipilih;
- jenis pemeriksaan/lab yang diminta;
- prioritas CITO atau reguler;
- status pemeriksaan;
- tombol buat order.

### Halaman input hasil lab
Ini adalah area yang paling penting untuk realism. UI harus menampilkan:
- tabel parameter yang relevan dari kategori tes tertentu;
- kolom nilai hasil;
- indikator status normal/abnormal;
- catatan analis bila diperlukan;
- tombol simpan dan kirim ke validasi dokter.

### Prinsip penting
Analis tidak hanya mengisi angka. Mereka harus melihat konteks pasien, kategori tes, dan hasil yang sedang dikirim. UI harus memudahkan pemeriksaan yang cermat, bukan hanya mengisi form cepat.

## 3. UI Dokter

### Dashboard dokter
Dashboard dokter harus fokus pada:
- jumlah pemeriksaan menunggu validasi;
- status pemeriksaan berdasarkan prioritas;
- jumlah hasil yang perlu direview.

### Antrean validasi
Tabel validasi harus memuat:
- nama pasien;
- tanggal/jenis pemeriksaan;
- status pemeriksaan;
- prioritas CITO;
- tombol review.

### Detail review hasil
Halaman review harus menampilkan:
- nama pasien, NIK, umur, jenis kelamin;
- tabel hasil lab lengkap;
- highlight abnormal secara visual;
- textarea untuk catatan klinis dokter;
- tombol validasi atau revisi.

### Riwayat pasien
Halaman riwayat pasien harus memberi dokter gambaran historis:
- hasil sebelumnya;
- status sebelumnya;
- catatan dokter terdahulu;
- tren data untuk pendukung keputusan klinis.

## 4. Flow UI yang disarankan untuk aplikasi yang masuk akal

### Flow pasien ke hasil
1. Cari atau buat pasien.
2. Buat order pemeriksaan.
3. Pilih kategori tes dan parameter yang relevan.
4. Input hasil lab.
5. Lihat status abnormal/normal.
6. Dokter validasi dan menutup pemeriksaan.
7. Rekam medis siap dijadikan laporan.

### Flow lebih realistis untuk dokter
- Dokter tidak langsung mengedit hasil lab.
- Dokter hanya meninjau, memberi catatan, dan memvalidasi.
- Jika ada revisi, sistem harus mengembalikan hasil ke analis untuk diperbaiki.

## 5. Standar komponen UI yang disarankan

Struktur komponen yang sudah mulai dibangun sebaiknya dipertahankan:

```text
src/
├── components/
│   ├── Layout/
│   ├── UI/
│   ├── Table/
│   ├── Modal/
│   └── StatusBadge/
├── pages/
│   ├── Auth/
│   ├── Admin/
│   ├── Analis/
│   ├── Dokter/
│   └── Common/
├── utils/
│   ├── auth.js
│   ├── api.js
│   └── validation.js
├── App.jsx
├── App.css
└── main.jsx
```

## 6. Prinsip visual yang harus dijaga

- warna yang jelas untuk status: biru untuk proses, hijau untuk valid, merah untuk abnormal.
- data table harus mudah dibaca dan bisa di-scroll jika banyak kolom.
- modal CRUD harus konsisten di semua modul.
- tombol aksi harus jelas: tambah, edit, hapus, reset password, validasi, review.
- form yang panjang seperti parameter lab harus dibagi rapi per blok.

## 7. Backlog UI prioritas berikutnya

### Prioritas P0
- integrasi semua halaman ke API live;
- tampilan alur hasil lab yang benar-benar end-to-end;
- validasi dan review dokter terhubung ke data pemeriksaan yang nyata.

### Prioritas P1
- toaster / notifikasi untuk aksi sukses atau gagal;
- search/filter pada halaman pasien dan hasil pemeriksaan;
- detail pasien yang lebih lengkap dan lebih rapi.

### Prioritas P2
- export PDF hasil lab;
- dashboard rekap harian/bulanan;
- desain responsif untuk tablet dan layar kecil;
- komponen reusable yang lebih umum untuk table, filter, dan form.

## 8. Kesimpulan

UI yang ada sudah cukup kuat untuk menjadi fondasi aplikasi lab puskesmas. Namun agar proyek ini benar-benar terasa sebagai sistem laboratorium yang masuk akal, UI harus selalu berdasar pada real workflow klinis: pasien → order → hasil → validasi → laporan. Tanpa itu, sistem hanya akan terasa seperti dashboard CRUD yang belum benar-benar berfungsi untuk kebutuhan laboratorium nyata.

## Pembaruan UI (27 Oktober 2026)

Catatan ini memperbarui status backlog di atas.

### Dashboard analytics per role
- Admin: pemeriksaan hari ini, menunggu validasi, perlu revisi, abnormal 30 hari.
- Analis: total pasien, order aktif, hasil tersimpan, abnormal 30 hari.
- Dokter: antrean validasi, perlu revisi, selesai 30 hari, total pemeriksaan.
- Semua dashboard menampilkan tren pemeriksaan 14 hari, breakdown status, dan kategori 30 hari dari API agregat tanpa PII.
- Loading, empty, dan error state harus tetap terlihat; jangan mengisi chart dengan data dummy permanen.

### Shell dan navigasi
- Topbar: role satu kali, bell notifikasi, avatar, nama dan username; tinggi item 40px.
- Desktop: sidebar; mobile: bottom navbar ikon saja, fixed 72px plus safe area, tanpa toggle. Tombol logout menjadi ikon terakhir.
- Hanya route aktif yang disorot. Dashboard tidak ikut aktif pada route anak seperti `/dokter/riwayat`.
- Scroll halaman berada di content container. Bottom nav tidak boleh menutup konten; tabel/chart menangani scroll horizontal di dalam wrapper sendiri.

### Tombol, tabel, dan profil
- Tombol aksi konten memakai ikon bermakna dan tetap menyertakan teks; tombol navbar/sidebar/topbar tidak ikut aturan styling tombol konten.
- Wrapper tabel sejajar dengan heading/konten panel; teks di sel memiliki padding kiri yang cukup. Jangan menggeser wrapper saat hanya teks sel yang perlu inset.
- Edit profil hanya memuat nama, username, foto. Upload menerima JPG/PNG/WebP, crop harus square, hasil JPEG base64 256 x 256. Tidak ada input password di modal.
- Notifikasi harus jelas membedakan loading, error, empty, unread, dan read; ownership selalu per user.
