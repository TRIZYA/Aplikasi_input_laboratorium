# Aplikasi Web Data Pasien Laboratorium Puskesmas

## Deskripsi proyek

Aplikasi ini dirancang untuk mendigitalisasi proses registrasi pasien, order pemeriksaan laboratorium, input hasil lab, validasi dokter, dan penyimpanan rekam medis di lingkungan Puskesmas. Fokus utamanya adalah membangun sistem yang masuk akal untuk dunia pelayanan kesehatan: pasien datang, data diinput dengan benar, hasil pemeriksaan diproses, dan hasil akhirnya siap ditinjau oleh dokter serta dilaporkan secara tertulis.

Tujuan utama proyek ini adalah:

- mengganti pencatatan manual yang rawan error;
- menjaga konsistensi data pasien dan hasil pemeriksaan;
- mempercepat validasi hasil oleh dokter;
- menyediakan arsitektur yang bisa dikembangkan menjadi sistem operasional nyata.

## Status implementasi saat ini

Proyek ini sudah masuk ke tahap prototype / MVP yang cukup kuat untuk demo dan pengembangan lanjutan. Beberapa area yang sudah berjalan antara lain:

- database PostgreSQL dan skema inti sudah dibuat;
- backend Express sudah siap untuk auth, CRUD master, pasien, pemeriksaan, dan hasil lab;
- frontend React + Vite sudah punya layout per role dan routing berdasarkan hak akses;
- form admin untuk user, kategori tes, dan parameter tes sudah dibuat;
- auto-flagging abnormal pada hasil lab sudah diterapkan;
- login demo untuk admin, analis, dan dokter sudah berfungsi.

Area yang masih memerlukan penyelesaian agar lebih realistis dan siap operasional:

- integrasi data real-time sedalam mungkin di seluruh role;
- UI dan workflow pasien/lab yang lebih matang dan konsisten;
- audit log dan riwayat perubahan data;
- export PDF rekam medis dan laporan;
- testing end-to-end dan deployment lokal.

## Latar belakang dan kebutuhan bisnis

Di layanan puskesmas, proses laboratorium umumnya melibatkan beberapa tahapan penting:

1. pasien datang / mendaftar;
2. petugas mengelola order pemeriksaan;
3. analisis menginput hasil laboratorium;
4. dokter meninjau hasil dan menulis catatan klinis;
5. hasil final dibukukan dalam rekam medis atau laporan laboratorium.

Tanpa alur seperti itu, aplikasi berisiko menjadi sekadar CRUD master data yang tidak mencerminkan kebutuhan nyata layanan rumah sakit/puskesmas.

## Pengguna utama

### 1. Admin Puskesmas
- mengelola pengguna sistem;
- mengelola kategori tes;
- mengelola parameter tes dan rentang normal;
- menjaga integritas data master.

### 2. Analis Laboratorium
- melakukan registrasi pasien;
- membuat order pemeriksaan;
- memasukkan hasil pemeriksaan;
- memastikan data hasil sesuai rentang rujukan.

### 3. Dokter
- meninjau hasil pemeriksaan;
- menulis catatan klinis;
- menyetujui atau menolak hasil validasi;
- melihat riwayat pasien dan hasil sebelumnya.

## Fitur yang sudah ada

### Manajemen akses & keamanan
- login/logout berbasis JWT;
- role-based access control;
- pembagian akses admin, analis, dokter;
- keamanan password dengan bcrypt.

### Data master
- kategori tes;
- parameter tes;
- nilai rujukan per gender untuk auto-flagging juga bisa dipakai untuk pengambil keputusan klinis.

### Data pasien
- registrasi pasien;
- pencarian dasar pasien berdasarkan NIK/nama;
- penyimpanan tanggal lahir dan jenis kelamin untuk penghitungan age-based logic.

### Transaksi laboratorium
- order pemeriksaan dibuat berdasarkan pasien;
- status pemeriksaan dapat berubah sesuai tahapan;
- hasil lab disimpan per parameter;
- auto-flagging abnormal ketika nilai hasil keluar batas normal sesuai jenis kelamin.

### Validasi dokter
- dokter dapat meninjau hasil laboratorium;
- catatan dokter bisa ditulis;
- status dapat berakhir `selesai` atau `revisi`.

## Gap yang masih perlu ditutup

Agar aplikasi benar-benar terasa sebagai sistem data pasien laboratorium yang masuk akal, beberapa poin berikut masih wajib diselesaikan:

- integrasi penuh semua halaman ke API live;
- alur pasien sampai validasi dokter harus benar-benar bersambung;
- log aktivitas dan perubahan data harus terdokumentasi;
- hasil pemeriksaan harus dihubungkan ke laporan pasien dan PDF;
- search/filter riwayat pasien masih perlu ditambah;
- notifikasi dan validasi feedback UI harus lebih konsisten.

## Alur kerja yang diharapkan

1. Admin membuat akun dan master data.
2. Pasien didaftarkan atau dicari. 
3. Analis membuat order pemeriksaan untuk pasien. 
4. Hasil laboratorium diinput per parameter. 
5. Sistem otomatis menandai abnormal berdasarkan parameter + jenis kelamin. 
6. Dokter menilai hasil, memberi catatan klinis, dan memvalidasi. 
7. Hasil final siap dipakai dalam laporan dan rekam medis. 

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT + bcrypt
- API: REST

## Struktur folder proyek

```text
INPUT_DATA_PUSKESMAS/
├── DATABASE_SCHEMA.md
├── ROADMAP.md
├── README.md
├── UI.md
├── puskesmas-lab-app/
│   ├── backend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── .trash/
```

## Cara menjalankan proyek

### 1. Siapkan database PostgreSQL
Buat database dengan nama `puskesmas_lab` lalu jalankan skema yang ada di folder backend atau script SQL jika sudah disiapkan.

```bash
psql -U postgres -d postgres
CREATE DATABASE puskesmas_lab;
```

### 2. Jalankan backend

```bash
cd puskesmas-lab-app/backend
npm install
node server.js
```

### 3. Jalankan frontend

```bash
cd puskesmas-lab-app
npm install
npm run dev -- --host 0.0.0.0
```

### 4. Akses aplikasi

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Akun demo

- admin2 / admin123
- analis1 / analis123
- dokter1 / dokter123

## Prioritas selanjutnya

1. Menutup integrasi frontend dengan API real-time.
2. Menyelesaikan workflow pasien → order → hasil → validasi dokter.
3. Menambahkan audit log aktivitas dan histori perubahan data.
4. Export PDF rekam medis dan laporan laboratorium.
5. Testing end-to-end dan deploy lokal.

## Kesimpulan

Proyek ini sudah memiliki fondasi yang kuat untuk menjadi aplikasi laboratorium puskesmas yang nyata. Tetapi agar benar-benar masuk akal bagi operasional layanan kesehatan, fokus berikutnya bukan hanya CRUD, melainkan alur kerja end-to-end pasien laboratorium: tidak hanya input data, tetapi juga validasi, rekam medis, traceability, dan laporan yang dapat dipakai oleh petugas dan dokter.

## Catatan implementasi terbaru (27 Oktober 2026)

> Status ini memperbarui catatan backlog yang lebih lama di atas.

- Dashboard Admin, Analis, dan Dokter kini menampilkan KPI serta analytics agregat dari data pemeriksaan nyata: tren 14 hari, status, dan kategori 30 hari.
- Analytics tidak mengirim nama, NIK, atau detail pasien; endpoint `/api/dashboard/analytics` membatasi akses ke role `admin`, `analis`, `dokter`, dan `demo`.
- Profil dapat diedit sendiri untuk nama, username, dan foto; password tidak dapat diubah dari modal profil. Foto dicrop persegi dan disimpan sebagai JPEG base64 256 x 256.
- Notifikasi terhubung ke user, memiliki status baca/belum dibaca, dan dibuat pada transisi hasil ke validasi/revisi.
- Shell memakai sidebar desktop dan bottom navbar ikon pada mobile. Scroll halaman berada di content container; tabel dan grafik memakai scroll internal bila diperlukan.
- Migration additive profil/notifikasi `20261027000000_profile_notifications` sudah diterapkan ke database yang dikonfigurasi.

Pekerjaan tersisa: audit log, export PDF, pencarian/filter/pagination, pengujian end-to-end, dan persiapan operasional. Credential `.env` yang pernah terpapar harus dirotasi sebelum penggunaan operasional; jangan menaruh nilainya di dokumentasi.
