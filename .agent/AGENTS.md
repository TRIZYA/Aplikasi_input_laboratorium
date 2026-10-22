# AGENTS.md — Aplikasi Web Data Pasien Laboratorium Puskesmas

## 1. Project Overview

Aplikasi manajemen data pasien dan hasil pemeriksaan laboratorium Puskesmas dengan frontend React + Vite, backend Node.js + Express, database PostgreSQL, autentikasi JWT, bcrypt, dan role-based access control (RBAC).

Project ini sudah memiliki fondasi MVP. Prioritaskan penyempurnaan fitur, integrasi frontend dengan API, keamanan data pasien, konsistensi UI, dan validasi alur kerja tanpa membangun ulang arsitektur yang sudah berfungsi.

Prinsip kerja utama:

**Inspect → Plan → Implement → Run → Preview → Evaluate → Refine → Verify**

Agent harus memeriksa hasil perubahan secara langsung melalui live preview jika alat browser tersedia, kemudian melakukan perbaikan lagi apabila hasilnya belum sesuai.

## 2. Project Structure

Struktur utama repository:

```text
INPUT_DATA_PUSKESMAS/
├── AGENTS.md
├── DATABASE_SCHEMA.md
├── ROADMAP.md
├── README.md
├── UI.md
├── .trash/
└── puskesmas-lab-app/
    ├── backend/
    │   ├── server.js
    │   └── ...
    ├── public/
    ├── src/
    ├── package.json
    ├── vite.config.js
    └── index.html
```

Struktur di atas merupakan gambaran awal. Selalu periksa struktur aktual sebelum mengasumsikan nama atau lokasi file.

Folder `puskesmas-lab-app/` adalah root aplikasi utama. Frontend dan backend dapat memiliki konfigurasi serta dependensi masing-masing.

## 3. Tech Stack

- Frontend: React
- Development server: Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: JWT
- Password hashing: bcrypt
- API: REST
- Authorization: Role-Based Access Control (RBAC)

Jangan menambahkan framework UI, component library, ORM, atau dependensi baru tanpa kebutuhan yang jelas.

Pertahankan teknologi dan pola implementasi yang sudah digunakan project.

## 4. Key Commands

### Frontend & Backend

Jalankan dari `puskesmas-lab-app/`.

```bash
pnpm install
pnpm run dev
```

URL default:

```text
http://localhost:5173
```

### Build, Lint, Typecheck, and Tests

Sebelum menjalankan perintah, periksa `package.json` pada frontend dan backend.

Jalankan hanya script yang benar-benar tersedia, misalnya:

```bash
pnpm run build
pnpm run lint
pnpm run typecheck
pnpm test
```

Jangan mengasumsikan semua script tersedia. Jangan menambahkan script atau mengganti toolchain hanya untuk memenuhi instruksi ini.

## 5. Mandatory Live Preview Workflow

### 5.1 Keep the Development Server Running

Untuk perubahan UI, gunakan Vite development server sebagai sarana utama verifikasi.

- Periksa apakah server frontend sudah berjalan sebelum memulai server baru.
- Pertahankan server tetap berjalan selama sesi pengembangan.
- Manfaatkan Vite Hot Module Replacement (HMR).
- Jangan restart server jika perubahan bisa diterapkan melalui HMR.
- Restart hanya jika konfigurasi atau kondisi server memang memerlukannya.
- Periksa pesan error di terminal setelah perubahan.

Jika backend dibutuhkan untuk menguji fitur, pastikan backend juga berjalan dan koneksi database tersedia.

Jangan menganggap backend berfungsi hanya karena frontend berhasil dibuka.

### 5.2 Required Edit–Preview–Refine Loop

Setelah setiap perubahan UI yang bermakna:

1. Simpan perubahan kode.
2. Tunggu Vite menerapkan perubahan melalui HMR.
3. Buka atau refresh halaman terkait pada live preview.
4. Amati tampilan dan perilaku halaman yang sebenarnya.
5. Bandingkan hasilnya dengan kebutuhan pengguna dan desain yang dimaksud.
6. Identifikasi layout yang rusak, elemen yang tidak konsisten, interaksi yang gagal, atau data yang tidak sesuai.
7. Perbaiki masalah yang ditemukan.
8. Buka kembali live preview dan periksa hasil perbaikannya.
9. Ulangi sampai acceptance criteria terpenuhi atau ditemukan hambatan yang harus dilaporkan.

Jangan menunggu sampai seluruh pekerjaan selesai untuk pertama kali membuka browser.

Jangan menyatakan pekerjaan selesai hanya karena tidak ada error pada editor.

### 5.3 What Must Be Inspected

Untuk perubahan yang relevan, periksa:

- Layout sidebar, topbar, konten utama, dan navigasi.
- Konsistensi warna, tipografi, jarak, ukuran elemen, dan ikon.
- Form input pasien dan hasil pemeriksaan.
- Validasi field wajib, pesan kesalahan, dan feedback setelah submit.
- Loading state, empty state, dan error state.
- Tabel data, pencarian, filter, pagination, dan tombol aksi.
- Modal, dialog konfirmasi, toast, serta interaksi lain.
- Tampilan desktop dan mobile.
- Scroll horizontal, elemen terpotong, dan layout yang saling bertumpuk.
- Browser console dan request API yang gagal jika alat tersedia.
- Akses halaman sesuai role admin, analis, dan dokter.

Untuk perubahan backend, uji endpoint dan alur data yang relevan. Periksa juga dampaknya terhadap tampilan frontend.

### 5.3.1 Jangan mengubah kode terlebih dahulu.
- Pastikan frontend berjalan di http://localhost:.
- Buka website tersebut menggunakan browser automation tool.
- Ambil screenshot aktual halaman dashboard.
- Periksa screenshot secara visual dan laporkan tiga temuan konkret berdasarkan tampilan yang benar-benar terlihat.
- Jangan menganalisis JSX/CSS sebagai pengganti screenshot.
- Jika kamu tidak memiliki tool untuk membuka browser atau melihat screenshot, katakan dengan jelas bahwa visual inspection belum bisa dilakukan.
- Setelah berhasil membuktikan browser inspection, gunakan workflow screenshot → edit → screenshot ulang untuk semua perubahan UI berikutnya.

### 5.4 Never Fake Visual Verification

Jika agent tidak memiliki browser atau alat untuk melihat live preview:

- Jangan mengaku sudah melihat hasil website.
- Lakukan pemeriksaan kode dan tes yang memang tersedia.
- Laporkan bahwa verifikasi visual belum dilakukan.
- Berikan URL preview lokal agar pengguna dapat memeriksanya.

Jangan menganggap screenshot lama sebagai bukti bahwa perubahan terbaru sudah benar.

## 6. Avoid Repeated Builds

**Jangan menjalankan production build setiap kali selesai mengedit kode.**

Selama pengembangan:

- Gunakan Vite dev server dan HMR untuk perubahan frontend.
- Gunakan server backend yang berjalan untuk pengujian API.
- Periksa terminal dan browser setelah perubahan yang bermakna.
- Gunakan test atau pemeriksaan yang relevan, bukan build berulang.
- Jalankan pemeriksaan terarah untuk mempercepat siklus perbaikan.

Production build dilakukan pada tahap akhir, saat diperlukan, ketika diminta pengguna, atau ketika masalah hanya dapat diverifikasi melalui build.

Untuk perubahan frontend yang cukup besar, jalankan build satu kali menjelang penyelesaian jika lingkungan mendukung.

Build yang gagal harus dianalisis. Setelah memperbaiki penyebabnya, ulangi build jika diperlukan untuk memastikan perbaikan berhasil.

## 7. Architecture and Coding Rules

### Frontend

- Ikuti pola React yang sudah digunakan project.
- Periksa apakah project menggunakan JavaScript atau TypeScript sebelum menambahkan file.
- Gunakan komponen yang sudah ada jika sesuai.
- Hindari duplikasi komponen dan logika bisnis.
- Pisahkan tanggung jawab halaman, komponen, API client, dan utilitas sesuai pola yang sudah tersedia.
- Jangan memindahkan atau mengganti struktur folder tanpa alasan yang kuat.
- Jangan mengganti seluruh UI hanya untuk menyelesaikan satu fitur.
- Pertahankan route, navigasi, dan fitur yang sudah berfungsi.

### Backend

- Pertahankan struktur Express dan pola routing yang sudah ada.
- Validasi input pada server, bukan hanya di frontend.
- Gunakan parameterized SQL queries untuk mencegah SQL injection.
- Pertahankan konsistensi format response API.
- Tangani error secara terstruktur tanpa membocorkan stack trace atau secret ke pengguna.
- Pastikan operasi database menggunakan transaksi ketika dibutuhkan untuk menjaga konsistensi data.
- Jangan mengubah kontrak endpoint tanpa memeriksa dampaknya terhadap frontend dan klien yang sudah ada.

### Database

- Periksa `DATABASE_SCHEMA.md` dan skema aktual sebelum mengubah query atau struktur database.
- Pertahankan relasi, foreign key, constraint, dan aturan integritas data.
- Hindari destructive migration tanpa persetujuan pengguna.
- Jangan menghapus atau mereset database untuk memperbaiki bug biasa.
- Gunakan migration yang terkontrol jika project sudah memiliki mekanisme migration.
- Jangan menjalankan query yang berpotensi menghapus atau mengubah data produksi tanpa persetujuan.

## 8. Authentication and RBAC

Sistem memiliki tiga role utama:

- `admin`
- `analis`
- `dokter`

Setiap perubahan terkait autentikasi atau otorisasi wajib mempertimbangkan:

- Login dan logout.
- Masa berlaku dan validasi JWT.
- Penyimpanan password menggunakan bcrypt.
- Pembatasan akses berdasarkan role di backend.
- Pembatasan halaman dan tindakan di frontend.
- Penanganan token tidak valid atau kedaluwarsa.
- Penanganan pengguna yang tidak memiliki izin.

**Frontend role checks bukan pengganti authorization di backend.**

Jangan hanya menyembunyikan tombol pada UI lalu menganggap endpoint sudah aman.

Jangan menampilkan password, token JWT, atau kredensial di log, browser console, maupun response API.

## 9. Laboratory Data Integrity and Privacy

Data pasien dan hasil laboratorium adalah data sensitif.

- Gunakan hanya data sintetis atau data demo yang tidak mengidentifikasi pasien saat mengembangkan dan menguji UI.
- Jangan menyalin data pasien asli ke screenshot, log, laporan debug, atau dokumentasi.
- Jangan mengirim data pasien ke layanan eksternal yang tidak disetujui.
- Jangan menambahkan data pasien nyata ke repository.
- Jangan menganggap hasil abnormal otomatis berarti diagnosis penyakit.
- Pertahankan satuan, rentang rujukan, gender, dan aturan flagging sesuai master data yang telah ditentukan.
- Jangan mengubah hasil pemeriksaan yang telah divalidasi tanpa mengikuti aturan koreksi dan audit yang sesuai.
- Pastikan hanya role yang berwenang dapat memvalidasi hasil atau mengakses data tertentu.
- Jangan menghapus audit trail untuk menyembunyikan perubahan.
- Gunakan validasi server-side untuk nilai pemeriksaan, status, dan transisi workflow.

Jika suatu perubahan berpotensi mengubah makna klinis atau aturan validasi hasil, jelaskan dampaknya dan jangan membuat asumsi medis sendiri.

## 10. API Integration

Saat menghubungkan frontend ke backend:

1. Periksa route Express yang benar-benar tersedia.
2. Periksa metode HTTP, request body, parameter, response, dan status error.
3. Gunakan konfigurasi base URL yang konsisten dengan pola project.
4. Periksa konfigurasi CORS dan environment variables jika terjadi kegagalan koneksi.
5. Implementasikan loading, success, empty, dan error states.
6. Validasi input pada frontend dan backend.
7. Uji jalur berhasil dan jalur gagal.
8. Verifikasi hasil melalui browser serta endpoint yang relevan.

Jangan membuat endpoint palsu atau menganggap fitur telah terintegrasi hanya karena UI terlihat selesai.

Jangan menambahkan mock data permanen sebagai pengganti API live tanpa persetujuan pengguna. Jika mock diperlukan untuk pengembangan, tandai dengan jelas dan pastikan tidak disalahartikan sebagai data backend nyata.

## 11. Priority Features

Gunakan `ROADMAP.md` dan permintaan terbaru pengguna untuk menentukan prioritas.

Area pengembangan yang diketahui:

1. CRUD admin untuk user, kategori tes, dan parameter tes.
2. Integrasi frontend dengan API backend pada seluruh modul.
3. Pengujian workflow pasien, pemeriksaan, dan validasi dokter.
4. Export PDF untuk rekam medis dan hasil laboratorium.
5. Loading state, toast notification, dan error handling yang konsisten.
6. Audit log dan histori perubahan data.
7. Testing end-to-end.
8. Deployment dan dokumentasi operasional.

Jangan mencoba menyelesaikan semua area sekaligus jika pengguna hanya meminta satu fitur.

Utamakan satu perubahan yang selesai, teruji, dan terintegrasi daripada banyak perubahan setengah jadi.

## 12. Testing Rules

- Tambahkan atau perbarui tes untuk fungsionalitas baru jika test framework tersedia.
- Pastikan tes deterministik dan tidak bergantung pada data pasien nyata.
- Gunakan database pengujian atau data sintetis untuk tes integrasi.
- Mock layanan eksternal jika sesuai.
- Uji jalur sukses, validasi input, dan kegagalan yang relevan.
- Jangan menyatakan test lulus jika belum benar-benar dijalankan.
- Jangan mengabaikan kegagalan test yang berkaitan dengan perubahan.

Untuk perubahan workflow yang penting, uji rangkaian:

1. Login sesuai role.
2. Menemukan atau membuat pasien.
3. Membuat order pemeriksaan.
4. Menginput hasil pemeriksaan.
5. Memeriksa auto-flagging.
6. Meninjau hasil sebagai dokter.
7. Memvalidasi atau meminta revisi.
8. Memastikan status dan histori tetap konsisten.

Gunakan data pengujian, bukan data pasien asli.

## 13. Environment Variables and Git Safety

- Jangan commit `.env`, `.env.local`, file kredensial, token, atau private key.
- Periksa `.gitignore` sebelum melakukan staging.
- Jangan menampilkan nilai environment variable ketika debugging.
- Gunakan `.env.example` hanya untuk nama variabel dan placeholder yang aman.
- Jangan menaruh secret di kode frontend atau variabel yang sengaja diekspos ke browser.
- Jangan menghapus atau mengganti file konfigurasi pengguna tanpa kebutuhan.
- Jangan melakukan commit, push, force push, atau mengubah repository remote tanpa izin pengguna.

Jika secret sudah terlanjur dipublikasikan, beri tahu pengguna untuk mencabut atau merotasinya.

## 14. Boundaries

### Allowed Without Asking

- Membaca file dan memeriksa struktur direktori.
- Memeriksa dokumentasi dan konfigurasi yang ada.
- Menjalankan development server lokal.
- Memeriksa live preview jika browser tersedia.
- Mengedit file yang relevan dengan tugas.
- Menjalankan lint, typecheck, dan tes terarah yang tersedia.
- Memperbaiki bug yang muncul akibat perubahan yang sedang dikerjakan.

### Ask First

- Menginstal, menghapus, atau meng-upgrade dependency.
- Menghapus file penting atau asset pengguna.
- Mengubah schema database secara destruktif.
- Menghapus atau mereset data.
- Mengubah kredensial, konfigurasi produksi, atau deployment.
- Menjalankan migrasi yang berisiko.
- Melakukan commit, push, force push, atau membuka pull request.
- Melakukan perubahan arsitektur besar di luar ruang lingkup tugas.

### Never

- Commit secret atau file `.env`.
- Mengekspos data pasien asli.
- Menjalankan query destruktif tanpa izin.
- Melewati authorization backend.
- Mengubah data klinis dengan asumsi yang tidak tervalidasi.
- Memodifikasi direktori generated output atau dependencies secara manual.
- Mengaku telah menguji browser, API, build, atau tes jika tidak dilakukan.
- Menjalankan production build berulang sebagai pengganti live preview.
- Menandai tugas selesai jika acceptance criteria belum terpenuhi.

## 15. Definition of Done

Sebuah tugas dianggap selesai jika:

- Kebutuhan pengguna telah diterapkan.
- Tidak ada perubahan tidak relevan yang ikut dilakukan.
- Live preview telah diperiksa jika alat browser tersedia.
- Masalah yang ditemukan selama inspeksi telah diperbaiki dan diperiksa ulang.
- Integrasi API telah diuji jika tugas berkaitan dengan API.
- Validasi role dan privasi telah dipertimbangkan jika relevan.
- Tes dan pemeriksaan yang tersedia telah dijalankan sesuai kebutuhan.
- Tidak ada secret atau data pasien asli yang ikut masuk ke perubahan.
- Keterbatasan verifikasi dilaporkan dengan jujur.

## 16. Final Report

Setelah menyelesaikan tugas, berikan ringkasan:

1. **Perubahan:** file dan fitur yang diperbarui.
2. **Live preview:** halaman dan viewport yang benar-benar diperiksa.
3. **Perbaikan iteratif:** masalah yang ditemukan dan bagaimana diperbaiki.
4. **Validasi:** tes, lint, typecheck, API check, atau build yang benar-benar dijalankan.
5. **Status integrasi:** apakah fitur memakai API nyata atau masih membutuhkan integrasi.
6. **Catatan:** masalah yang tersisa dan hal yang membutuhkan tindakan pengguna.

Jangan mengklaim semua fitur berjalan hanya berdasarkan tampilan visual.

**Final principle: Implement carefully, inspect the real application, fix what is wrong, verify the result, and report honestly.**