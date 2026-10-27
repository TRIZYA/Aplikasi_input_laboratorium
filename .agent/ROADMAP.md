# 🗺️ Roadmap & Checklist Aplikasi Lab Puskesmas

Dokumen ini dipakai untuk memantau progress proyek secara realistis sekaligus memastikan aplikasi ini mengikuti alur kerja laboratorium yang masuk akal di dunia nyata: pasien masuk, pasien dibuat order pemeriksaan, hasil diinput, hasil dipersiapkan untuk validasi dokter, lalu laporan/rekam medis dapat dicetak atau ditinjau ulang.

## Status proyek saat ini

Proyek ini sudah berada pada tahap prototype yang cukup matang untuk demo fungsional dan pengembangan lanjutan. Fondasi utama yang sudah ada adalah:

- [x] Struktur proyek dan dokumentasi dasar sudah siap.
- [x] Database PostgreSQL sudah dibuat dan skema inti terdefinisi dengan jelas.
- [x] Backend Express sudah mendukung auth, user, data master, pasien, pemeriksaan, hasil lab, dan validasi dokter.
- [x] Frontend React + Vite sudah memiliki routing RBAC, layout per role, dan halaman dashboard utama.
- [x] CRUD master admin untuk user, kategori tes, dan parameter tes sudah terhubung ke API live.
- [x] Auto-flagging abnormal berdasarkan rentang nilai dan jenis kelamin sudah dibuat di backend.
- [x] Login demo untuk admin/analis/dokter sudah berfungsi.
- [x] Integrasi data real-time antar seluruh modul sudah dipercepat secara nyata pada alur pasien → order → hasil → validasi.
- [x] Flow hasil lab dan validasi dokter sudah terhubung dengan backend live dan data PostgreSQL nyata.
- [ ] Fitur PDF, audit log, dan deployment operasional masih belum selesai.

## Update terbaru (Oktober 2026)
- [x] Perbaikan login dan auth flow untuk role admin, analis, dan dokter sudah selesai.
- [x] CRUD admin untuk user, kategori tes, dan parameter tes sudah berjalan di API live.
- [x] Analis dapat menambahkan pasien baru dan membuat order pemeriksaan dengan kategori tes terpilih.
- [x] Input hasil lab sudah terhubung dengan parameter yang sesuai kategori dan tersimpan ke backend.
- [x] Validasi dokter kini bisa meninjau hasil pemeriksaan secara real-time dan menetapkan status `selesai` atau `revisi`.
- [x] Schema database dan ownership tabel sudah distabilkan agar request ke endpoint pemeriksaan tidak gagal karena masalah permission.
- [x] Build frontend berhasil dieksekusi tanpa error pada versi terbaru.

## Alur kerja yang benar-benar masuk akal

Aplikasi ini tidak hanya tugas CRUD. Aplikasi laboratorium puskesmas idealnya mengikuti alur berikut:

1. Pasien didaftarkan atau dicari berdasarkan NIK/nama.
2. Petugas analis membuat order pemeriksaan untuk pasien.
3. Pemeriksaan ditag dengan prioritas CITO dan status kerja.
4. Analis menginput hasil lab dan data disimpan.
5. Sistem membandingkan nilai hasil dengan nilai rujukan sesuai jenis kelamin.
6. Dokter meninjau hasil, memberi catatan klinis, lalu menyetujui atau merevisi.
7. Hasil yang sudah final bisa ditindaklanjuti menjadi laporan atau rekam medis.

Jika tidak ada alur seperti ini, aplikasi tersebut belum sepenuhnya terasa sebagai sistem lab pasien yang nyata.

## Fase 1: Persiapan & konfigurasi awal
- [x] Menyusun dokumen proyek utama.
- [x] Menyiapkan struktur folder frontend dan backend.
- [x] Menginstal dependency front-end dan back-end dasar.
- [x] Menyiapkan PostgreSQL dan konfigurasi koneksi.
- [x] Membuat akun demo untuk admin, analis, dan dokter.

## Fase 2: Database & skema inti
- [x] Tabel `users` dibuat dengan role dan password hash.
- [x] Tabel `pasien` dibuat dengan NIK, nama, tanggal lahir, jenis kelamin, alamat, no_hp.
- [x] Tabel `kategori_tes` dibuat.
- [x] Tabel `parameter_tes` dibuat dengan nilai rujukan per gender.
- [x] Tabel `pemeriksaan` dibuat untuk mengelola order dan status pemeriksaan.
- [x] Tabel `detail_hasil` dibuat untuk nilai hasil per parameter.
- [x] Relasi antar tabel dibuat sesuai kebutuhan transaksi lab.
- [x] Auto-flagging abnormal dibuat berdasarkan min/max dan gender pasien.
- [x] Data dummy demo untuk kategori, parameter, dan akun user dibuat.

## Fase 3: Pengembangan backend
### 3.1 Autentikasi & keamanan
- [x] Endpoint `/api/health` aktif.
- [x] Endpoint `/api/auth/login` aktif dengan JWT.
- [x] Endpoint `/api/auth/register` aktif.
- [x] JWT auth middleware berjalan.
- [x] Role-based access control dibuat.

### 3.2 Data master & pasien
- [x] CRUD pasien aktif.
- [x] CRUD kategori tes aktif.
- [x] CRUD parameter tes aktif.
- [x] Endpoint `/api/master` aktif untuk ambil data master.
- [x] User CRUD lengkap (read, update, delete, reset password) aktif di backend.

### 3.3 Pemeriksaan & hasil lab
- [x] Endpoint `/api/pemeriksaan` aktif.
- [x] Endpoint `/api/pemeriksaan/:id` aktif.
- [x] Endpoint `/api/pemeriksaan/:id/hasil` aktif.
- [x] Endpoint `/api/pemeriksaan/:id/validasi` aktif.
- [x] Status pemeriksaan mendukung workflow lab yang masuk akal: `menunggu`, `proses`, `menunggu_validasi`, `revisi`, `selesai`.
- [x] Flow pemeriksaan sudah terintegrasi ke kategori tes dan hasil lab yang relevan.
- [ ] Validasi status per role perlu diperkuat supaya tidak ada role yang melakukan aksi di luar wewenang.
- [ ] Pencarian, filter, dan pagination data pemeriksaan masih belum lengkap.

### 3.4 Audit & operasional
- [ ] Log aktivitas user belum dibuat.
- [ ] Histori perubahan data belum terdokumentasi secara sistematis.
- [ ] Modal dan form validasi perlu dibuat lebih aman untuk operasi nyata.

## Fase 4: Frontend - routing & layout
- [x] Routing dibuat dengan React Router.
- [x] Protected route sesuai role dibuat.
- [x] Login page dan layout utama selesai.
- [x] Sidebar dan top navigation per role sudah dibuat.
- [x] Struktur folder modular sudah distandarkan.
- [ ] Form validasi dan loading state masih perlu dibuat lebih konsisten di seluruh halaman.
- [ ] Notifikasi UI / toast dan fallback error state belum sepenuhnya diterapkan.

## Fase 5: Frontend - modul admin
- [x] Dashboard admin dasar dibuat.
- [x] Manajemen user aktif.
- [x] Manajemen kategori tes aktif.
- [x] Manajemen parameter tes aktif.
- [x] Form tambah dan edit user, kategori, parameter sudah ada dalam modal.
- [x] Validasi form dan pengecekan nilai rentang sudah diterapkan.
- [ ] UX admin masih perlu diperhalus untuk seluruh CRUD agar lebih konsisten dan lebih “operasional-ready”.

## Fase 6: Frontend - modul analis
- [x] Halaman pasien dibuat.
- [x] Halaman order pemeriksaan dibuat.
- [x] Halaman input hasil lab dibuat.
- [x] Aksi auto-flagging hasil lab sudah tersedia secara visual.
- [x] Integrasi ke API real-time untuk pasien dan hasil sudah berjalan dengan data live.
- [x] Form berdasarkan parameter disesuaikan dengan kategori yang dipilih dan berfungsi secara dinamis.
- [x] Simpan hasil lab sudah aktif dan memicu status `menunggu_validasi` di backend.

## Fase 7: Frontend - modul dokter
- [x] Dashboard dokter dasar dibuat.
- [x] Antrean validasi dibuat.
- [x] Detail hasil dan review dokter dibuat.
- [x] Riwayat pasien dibuat.
- [x] Validasi dokter sudah terhubung ke data pemeriksaan live dan dapat menyetujui atau merevisi hasil.
- [x] Status revisi dan validasi sudah diproses di backend.
- [ ] Pencarian dan filter riwayat pasien masih perlu ditingkatkan.

## Fase 8: Fitur tambahan & finishing
### Prioritas P0 (wajib sebelum production)
- [ ] Export PDF rekam medis / hasil pemeriksaan.
- [ ] Testing end-to-end pada alur pasien → order → hasil → validasi → laporan.
- [ ] Verifikasi RBAC dan hak akses per role.
- [ ] Validasi umur pasien, status pemeriksaan, dan auto-flagging.
- [ ] Error handling, loading state, dan form validation yang konsisten.

### Prioritas P1 (penting untuk demo atau pilot)
- [ ] Audit log aktivitas petugas.
- [ ] Pencarian filter data pemeriksaan dan riwayat pasien.
- [ ] Notifikasi toast untuk aksi CRUD dan validasi.
- [ ] Halaman detail pasien yang lebih lengkap.
- [ ] Rekap harian / bulanan pemeriksaan.

### Prioritas P2 (fitur lanjutan)
- [ ] Deploy ke server lokal puskesmas / intranet.
- [ ] Backup & restore database.
- [ ] Export Excel/CSV rekap harian.
- [ ] Integrasi dengan sistem dinas kesehatan atau sistem lain.
- [ ] SOP operasional dan pelatihan petugas.

## Cicilan kerja yang disarankan

### Cicilan 1: Stabilitas data & backend
- [ ] Setting env dan konfigurasi aman untuk produksi.
- [ ] Validasi endpoint backend lebih ketat.
- [ ] Audit log dan histori perubahan data.
- [ ] Integritas data foreign key dan index query.

### Cicilan 2: Integrasi frontend real data
- [ ] Hubungkan semua module ke API live.
- [ ] Uji routing dan form pasien, order, hasil, dan validasi dokter.
- [ ] Tambahkan notifikasi, loading, dan error state yang konsisten.

### Cicilan 3: Finishing & dokumentasi
- [ ] PDF export rekam medis.
- [ ] Testing end-to-end.
- [ ] Uji responsifitas UI.
- [ ] Finalisasi SOP penggunaan dan dokumentasi operasional.

### Cicilan 4: Deploy & operasional
- [ ] Hosting lokal / intranet puskesmas.
- [ ] Backup data dan jadwal maintenance.
- [ ] SOP admin dan user manual.
- [ ] Pelatihan singkat untuk petugas.

### Cicilan 5: Alur kerja laboratorium yang benar-benar hidup
- [ ] Modul pasien: daftar pasien, pencarian NIK/nama, validasi data demografi, dan detail pasien lengkap.
- [ ] Modul order pemeriksaan: pilih pasien, pilih kategori tes, prioritas CITO, status awal, dan auto-create order.
- [ ] Modul input hasil: tampilkan parameter sesuai kategori, masukkan nilai per item, simpan draft hasil, dan cegah input kosong/invalid.
- [ ] Modul validasi dokter: review hasil, catatan klinis, status revisi/diterima, dan riwayat validasi per pemeriksaan.
- [ ] Modul rekam medis: tampilkan ringkasan hasil pasien, diagnosis/komentar dokter, dan tombol export PDF.
- [ ] Sinkronisasi status antar role: analis, dokter, dan admin harus melihat status yang konsisten pada pemeriksaan yang sama.
- [ ] Notifikasi dan audit trail untuk setiap perubahan urutan kerja laboratorium.

### Cicilan 6: Penguatan keamanan & kualitas data
- [ ] Validasi role di backend untuk semua endpoint yang mengubah status pemeriksaan dan hasil lab.
- [ ] Pembatasan akses per role untuk patient detail, hasil lab, dan validasi dokter.
- [ ] Uji unit/integrasi untuk login, pasien, order, hasil, dan validasi dokter.
- [ ] Pengecekan nilai hasil abnormal dan batasan rujukan sesuai jenis kelamin pada setiap submit.
- [ ] Error handling yang lebih jelas untuk edge case: data tidak ditemukan, input invalid, token expired, dan duplikasi NIK.

## Gap kritis yang perlu diselesaikan agar lebih masuk akal sebagai aplikasi lab

1. Aplikasi harus memisahkan secara jelas antara data pasien, order pemeriksaan, dan hasil pemeriksaan.
2. Setiap pemeriksaan harus bisa dilacak sampai validasi dokter dan status final.
3. Hasil lab harus dibaca dengan referensi pasien dan parameter yang sesuai.
4. Audit log harus dibuat agar semua perubahan data terekam dengan jelas.
5. Antrean validasi dokter harus dihubungkan ke pemeriksaan real dan bukan hanya data static.
6. Laporan PDF harus bisa menampilkan ringkasan hasil lab untuk pasien.

Dengan gap tersebut, proyek akan lebih mudah dinilai sebagai sistem laboratorium nyata, bukan hanya aplikasi CRUD master data yang belum terhubung ke alur klinis.

## Update implementasi 27 Oktober 2026

Checklist ini memperbarui status fitur yang mungkin masih tercatat belum selesai pada bagian sebelumnya.

- [x] Analytics berbasis data nyata pada dashboard Admin, Analis, dan Dokter.
- [x] Endpoint analytics mengembalikan agregat tanpa identitas pasien dan membatasi akses berdasarkan role.
- [x] Profil mandiri: nama, username, foto JPEG base64 hasil crop 256 x 256; password tidak dapat diubah dari fitur ini.
- [x] Tabel notifikasi terhubung ke user, endpoint baca/belum dibaca, dan notifikasi transisi hasil ke dokter/analis.
- [x] Migration `20261027000000_profile_notifications` diterapkan dan status Prisma terverifikasi up to date.
- [x] Ikon dan ukuran tombol konten diseragamkan; sidebar aktif hanya menyorot route yang tepat.
- [x] Layout responsif: sidebar desktop, bottom navbar ikon mobile, content container sebagai area scroll, tabel/chart memakai scroll internal.
- [ ] Rotasi credential yang pernah terpapar sebelum penggunaan operasional.
- [ ] Audit log/histori perubahan.
- [ ] Export PDF dan tes end-to-end lengkap lintas role.
- [ ] Filter/pagination riwayat pasien dan pemeriksaan.

Jangan memakai angka contoh permanen untuk dashboard; pertahankan sumber data API agregat dan empty/loading/error state.
