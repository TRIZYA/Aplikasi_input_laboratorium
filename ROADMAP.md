# 🗺️ Peta Jalan (Roadmap) & Checklist Pembuatan Aplikasi Lab Puskesmas

Dokumen ini dipakai untuk memantau progres aplikasi secara realistis. Kondisi saat ini sudah masuk ke tahap prototype yang cukup siap dipakai sebagai demo functional, tetapi masih ada beberapa bagian yang harus dilengkapi sebelum sistem benar-benar layak dipakai di lingkungan operasional puskesmas.

## Status Proyek Saat Ini
- [x] Struktur dasar proyek dan dokumentasi utama sudah dibuat.
- [x] Database PostgreSQL dan skema inti sudah siap.
- [x] Backend utama sudah berfungsi untuk login, pasien, master data, pemeriksaan, dan validasi hasil.
- [x] Frontend sudah memiliki routing RBAC dan layout modular per role.
- [ ] CRUD admin untuk user/kategori/parameter belum sepenuhnya tertutup di layer frontend dan backend.
- [ ] Integrasi frontend dengan API masih perlu dibangun lebih konsisten di seluruh modul.
- [ ] Fitur PDF, testing end-to-end, dan deployment masih belum selesai.

## Fase 1: Persiapan & Konfigurasi Awal (Setup)
- [x] Menyusun dokumen proyek (README.md).
- [x] Menginstal Node.js dan PostgreSQL di komputer.
- [x] Membuat repositori Git atau folder kerja proyek.
- [x] Membuat folder proyek utama (`puskesmas-lab-app`).
- [x] Membuat folder backend di `/puskesmas-lab-app/backend`.
- [x] Menginisialisasi frontend Vite + React.
- [x] Menginstal library dasar frontend.
- [x] Menginstal library dasar backend.

## Fase 2: Konfigurasi Database & Pembuatan Tabel Skema
- [x] Membuat database PostgreSQL (`puskesmas_lab`).
- [x] Membuat tabel `users` dengan username, password_hash, role, dan identitas petugas.
- [x] Membuat tabel `pasien` dengan NIK, nama, tanggal lahir, jenis kelamin, alamat, dan no_hp.
- [x] Membuat tabel `kategori_tes` dan `parameter_tes`.
- [x] Membuat tabel `pemeriksaan` dan `detail_hasil` untuk order lab dan hasil tes.
- [x] Menambahkan kolom `is_cito`, `validator_id`, `catatan_dokter`, `status`, serta relasi antar tabel.
- [x] Menambahkan logika auto-flagging berdasarkan parameter min/max.
- [x] Insert data dummy untuk kategori, parameter, dan akun demo.

## Fase 3: Pengembangan Backend (API / Node.js)
### 3.1 Auth & Security
- [x] Koneksi database dari backend berhasil dibuat.
- [x] Endpoint `/api/health` aktif.
- [x] Endpoint `/api/auth/login` berhasil dibuat dengan JWT.
- [x] Endpoint `/api/auth/register` aktif untuk membuat user baru.
- [x] Middleware autentikasi JWT berjalan.

### 3.2 Data Master & Pasien
- [x] Endpoint pasien: GET/POST/PUT/DELETE berhasil dibuat.
- [x] Endpoint kategori tes: GET/POST aktif.
- [x] Endpoint parameter tes: POST dan query berdasarkan kategori aktif.
- [x] Endpoint `/api/master` untuk mengambil data kategori + parameter aktif.
- [ ] CRUD update/delete untuk `kategori_tes` dan `parameter_tes` perlu ditambahkan jika ingin pengelolaan master data lengkap.
- [ ] CRUD user lengkap (read all, update, delete, reset password) masih belum sepenuhnya tertutup.

### 3.3 Transaksi Pemeriksaan & Hasil
- [x] Endpoint `/api/pemeriksaan` untuk membuat dan melihat data pemeriksaan.
- [x] Endpoint `/api/pemeriksaan/:id` untuk detail pemeriksaan.
- [x] Endpoint `/api/pemeriksaan/:id/hasil` untuk menyimpan hasil lab dan auto-flagging.
- [x] Endpoint `/api/pemeriksaan/:id/validasi` untuk status revisi/selesai.
- [x] Status pemeriksaan: `menunggu`, `proses`, `menunggu_validasi`, `revisi`, `selesai`.
- [ ] Validasi status per role perlu diperkuat pada sisi frontend dan backend.
- [ ] Pencarian, filter, dan pagination data pemeriksaan belum lengkap.

### 3.4 Logging & Audit
- [ ] Sistem log aktivitas petugas belum dibuat.
- [ ] History login, edit data, validasi hasil, dan delete data belum terdokumentasi.
- [ ] Riwayat audit untuk keperluan keamanan / rekam medis masih perlu ditambahkan.

## Fase 4: Pengembangan Frontend - Routing & Layout (RBAC)
- [x] Routing aplikasi dibuat dengan React Router.
- [x] AuthGuard untuk memproteksi route sesuai role.
- [x] Login page berbasis JWT token selesai.
- [x] Layout utama dengan sidebar dan topbar per role selesai.
- [x] Struktur folder modular: pages, layout, utils, auth, common.
- [ ] UI perlu lebih konsisten dari sisi validasi form dan loading state.
- [ ] Fallback error state / toast / notifikasi belum sepenuhnya diterapkan.

## Fase 5: Pengembangan Frontend - Modul Admin (Master Data)
- [x] Dashboard Admin dasar sudah dibuat.
- [x] Tabel user demo aktif.
- [x] Tabel kategori tes aktif.
- [x] Tabel parameter tes aktif.
- [x] Form tambah data dasar sudah tersedia secara visual.
- [ ] CRUD admin untuk user belum terhubung penuh ke API.
- [ ] CRUD admin untuk kategori/parameter belum terhubung penuh ke API.
- [ ] Validasi input, tombol edit/hapus, dan modal form belum final.

## Fase 6: Pengembangan Frontend - Modul Analis (Transaksi)
- [x] Halaman pasien tersedia.
- [x] Halaman order pemeriksaan tersedia.
- [x] Halaman input hasil lab tersedia.
- [x] Auto-flagging visual untuk abnormal result sudah ada.
- [ ] Data ini masih perlu dihubungkan ke API live secara real-time.
- [ ] Form dinamis berdasarkan kategori & parameter masih perlu disinkronkan ke backend.
- [ ] Loading state, error handling, dan tombol simpan/publish belum sepenuhnya final.

## Fase 7: Pengembangan Frontend - Modul Dokter (Validasi Klinis)
- [x] Dashboard dokter dasar tersedia.
- [x] Antrean validasi dibuat.
- [x] Tinjauan hasil dan catatan dokter tersedia.
- [x] Riwayat pasien tersedia.
- [ ] Detail hasil dan validasi dokter perlu dihubungkan dengan data pemeriksaan nyata.
- [ ] Button revisi/validasi perlu mengirim data ke API dan memperbarui status secara ujung-ke-ujung.
- [ ] Pencarian riwayat pasien dan filter data perlu ditingkatkan.

## Fase 8: Fitur Tambahan & Finishing
### Prioritas P0 (harus dikerjakan sebelum production)
- [ ] Fitur cetak/eksport PDF rekam medis.
- [ ] Testing/Uji coba fungsionalitas menyeluruh.
- [ ] Verifikasi RBAC, umur pasien, auto-flagging, dan validasi dokter.
- [ ] Konsistensi data master dan relasi foreign key.
- [ ] Menangani error API, loading, dan validasi form yang belum lengkap.

### Prioritas P1 (penting untuk demo atau pilot)
- [ ] CRUD lengkap user, kategori tes, dan parameter tes.
- [ ] Pencarian/filter yang lebih canggih untuk pasien dan pemeriksaan.
- [ ] Notifikasi / toast / status request di frontend.
- [ ] Halaman detail pasien, riwayat, dan rekam medis lebih lengkap.

### Prioritas P2 (fitur lanjutan)
- [ ] Deploy/hosting ke server lokal Puskesmas.
- [ ] Backup & restore database.
- [ ] Export Excel/CSV rekap harian/bulanan.
- [ ] Integrasi dengan sistem Dinas Kesehatan atau sistem lain.
- [ ] Audit trail dan manajemen log aktivitas.

## Cicilan Progres yang Disarankan
### Cicilan 1: Stabilitas Data & Backend
- [ ] Setting env dan konfigurasi prod-safe.
- [ ] CRUD lengkap admin.
- [ ] Validasi backend untuk semua endpoint.
- [ ] Endpoint audit log.

### Cicilan 2: Integrasi Frontend Real Data
- [ ] Hubungkan semua halaman ke API live.
- [ ] Uji form tambah pasien, form input hasil, dan review dokter.
- [ ] Tambahkan loading/error state.

### Cicilan 3: Finishing & Dokumentasi
- [ ] PDF export rekam medis.
- [ ] Testing end-to-end.
- [ ] Uji responsifitas UI.
- [ ] Finalisasi README dan SOP penggunaan.

### Cicilan 4: Deploy & Operasional
- [ ] Hosting lokal / server intranet.
- [ ] Backup data dan jadwal maintenance.
- [ ] SOP admin dan user manual.
- [ ] Pelatihan singkat untuk petugas.