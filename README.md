# Aplikasi Web Data Pasien Laboratorium Puskesmas

## 📖 Deskripsi Proyek

Aplikasi berbasis web ini dirancang untuk mendigitalisasi proses input, penyimpanan, dan pengelolaan data pasien serta hasil pemeriksaan laboratorium di lingkungan Puskesmas. Tujuannya adalah menggantikan pencatatan manual, meminimalkan kesalahan data, dan mempercepat proses pengecekan rekam medis, validasi hasil, serta laporan lab.

## ✅ Status Implementasi Saat Ini

Proyek ini sudah masuk ke tahap prototype / MVP yang cukup layak untuk demo fungsional. Saat ini, area yang sudah berjalan dengan baik adalah:

- Database PostgreSQL dan skema inti sudah siap.
- Backend Express berfungsi untuk login, autentikasi JWT, pasien, master data, pemeriksaan, dan validasi.
- Frontend React + Vite sudah memiliki layout modular, RBAC, dan halaman role-based.
- Fitur auto-flagging untuk hasil lab sudah diimplementasikan di backend.

Area yang masih perlu dikerjakan untuk menjadi sistem yang lebih siap operasional:

- CRUD lengkap untuk admin (user, kategori tes, parameter tes).
- Integrasi penuh frontend ke API live di semua modul.
- Fitur export PDF rekam medis.
- Testing end-to-end dan validasi keseluruhan.
- Deployment / hosting server lokal.

## 🎯 Latar Belakang & Tujuan

- Masalah utama: pencatatan hasil lab manual rawan hilang, tidak konsisten, dan lambat saat mencari riwayat pasien.
- Tujuan: menyediakan sistem database terpusat yang aman, cepat, dan mudah digunakan oleh petugas laboratorium dan dokter.

## 👥 Target Pengguna

1. Petugas Laboratorium / Analis
   - Mendaftar pasien.
   - Menginput hasil tes.
   - Mengelola order pemeriksaan.

2. Dokter / Penanggung Jawab Lab
   - Meninjau hasil pemeriksaan.
   - Menulis catatan dokter.
   - Melakukan validasi & approval.

3. Admin Puskesmas
   - Mengelola data user.
   - Mengelola master kategori tes dan parameter.
   - Mengawasi data dasar sistem.

## ✨ Fitur Yang Sudah Ada

### 1. Manajemen Akses & Keamanan
- Sistem login/logout berbasis JWT.
- Role-based access control (RBAC).
- Pengguna dibagi menjadi `admin`, `analis`, dan `dokter`.

### 2. Dashboard & Layout
- Layout sidebar dan topbar dinamis sesuai role.
- Halaman login, dashboard admin, analis, dan dokter sudah dibuat.

### 3. Data Master
- Master data kategori tes.
- Master data parameter tes.
- Nilai rujukan dan auto-flagging berdasarkan gender.

### 4. Manajemen Pasien
- CRUD dasar pasien selesai di backend.
- Form pasien dan list pasien ada di frontend.

### 5. Transaksi Laboratorium
- Order pemeriksaan dibuat.
- Input hasil lab diterima dan disimpan.
- Auto-flagging abnormal berdasarkan rentang min/max.

### 6. Validasi Dokter
- Status pemeriksaan dapat masuk ke fase review dan validasi.
- Catatan dokter dapat diisi.
- Status dapat berubah menjadi `selesai` atau `revisi`.

## ⚠️ Fitur Yang Masih Perlu Dilengkapi

- CRUD lengkap untuk user, kategori tes, dan parameter tes.
- Integrasi API live untuk seluruh form frontend.
- PDF rekam medis / hasil lab.
- Toast notification, loading state, dan error handling yang konsisten.
- Audit log aktivitas dan histori perubahan data.
- Testing end-to-end.
- Deploy / hosting.

## 🔄 Alur Pengguna (User Flow) Dasar

1. User login ke sistem.
2. Sistem mengarahkan ke dashboard sesuai role.
3. Analis mendaftarkan atau menemukan pasien.
4. Analis membuat pemeriksaan dan memasukkan hasil lab.
5. Hasil otomatis dibaca sebagai normal/abnormal.
6. Dokter meninjau dan melakukan validasi.
7. Hasil lab dapat diunduh atau dicetak dalam format laporan.

## 💻 Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT + bcrypt
- API: REST

## 📂 Struktur Folder Proyek

```text
INPUT_DATA_PUSKESMAS/
├── DATABASE_SCHEMA.md
├── ROADMAP.md
├── README.md
├── UI.md
├── .trash/
└── puskesmas-lab-app/
    ├── backend/
    ├── public/
    ├── src/
    ├── package.json
    ├── vite.config.js
    └── index.html
```

## 🚀 Cara Menjalankan Proyek

### 1. Setup Database PostgreSQL
Buat database dengan nama `puskesmas_lab` dan jalankan script SQL berikut jika masih belum dibuat:

```bash
psql -U postgres -d postgres
CREATE DATABASE puskesmas_lab;
```

### 2. Jalankan Backend
```bash
cd puskesmas-lab-app/backend
npm install
node server.js
```

### 3. Jalankan Frontend
```bash
cd puskesmas-lab-app
npm install
npm run dev -- --host 0.0.0.0
```

### 4. Akses Aplikasi
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## 🧪 Akun Demo (jika tersedia)

- admin2 / admin123
- analis1 / analis123
- dokter1 / dokter123

## 🔎 Catatan Kunci

Proyek ini sudah punya fondasi yang kuat untuk dikembangkan menjadi aplikasi lab puskesmas yang fungsional. Yang paling penting saat ini bukan lagi membangun fondasi baru, melainkan menutup gap pada:

- data integration,
- validasi form dan role flow,
- CRUD admin,
- dokumentasi operasional,
- dan fitur finishing seperti export PDF serta testing.

## 📌 Rekomendasi Prioritas Berikutnya

1. Selesaikan CRUD master data dan user.
2. Hubungkan frontend ke semua API live.
3. Uji alur pemeriksaan dan validasi dokter.
4. Tambahkan PDF export dan log aktivitas.
5. Jalankan testing dan deploy lokal.

Dokumen ini dapat terus diperbarui sesuai progres pengembangan agar proyek tetap terukur dan mudah dikerjakan secara bertahap.