# Skema Database PostgreSQL - Sistem Lab Puskesmas

Dokumen ini menggambarkan struktur data utama aplikasi lab puskesmas agar alur kerja pasien dan laboratorium terasa masuk akal. Fokus utama skema ini adalah membedakan dengan jelas antara data master, data pasien, data order pemeriksaan, hasil lab, validasi dokter, dan laporan akhir.

## 1. Tabel `users`
Tabel ini menyimpan data petugas yang memiliki akses ke sistem, seperti admin, analis, dan dokter.

| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary key |
| `username` | VARCHAR(50) | Login username, unik |
| `password_hash` | VARCHAR(255) | Password terenkripsi bcrypt |
| `role` | VARCHAR(20) | `admin`, `analis`, `dokter` |
| `nama_lengkap` | VARCHAR(100) | Nama petugas |
| `created_at` | TIMESTAMP | Waktu pembuatan akun |

Catatan:
- `username` harus unik.
- `role` harus dipastikan konsisten agar akses sesuai RBAC.
- Disarankan menambahkan `is_active`, `last_login`, dan `updated_at` untuk operasional nyata.

## 2. Tabel `pasien`
Tabel ini menyimpan identitas pasien yang akan menjadi subjek pemeriksaan laboratorium.

| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary key |
| `nik` | VARCHAR(16) | NIK pasien, unik |
| `nama_pasien` | VARCHAR(100) | Nama lengkap pasien |
| `tanggal_lahir` | DATE | Digunakan untuk menghitung umur |
| `jenis_kelamin` | VARCHAR(1) | `L` atau `P` |
| `alamat` | TEXT | Alamat pasien |
| `no_hp` | VARCHAR(20) | Nomor telepon, nullable |
| `created_at` | TIMESTAMP | Waktu pendaftaran pasien |

Catatan:
- `nik` harus unik untuk mencegah duplikasi pasien.
- Data pasien ini harus dipisahkan dari data pemeriksaan agar riwayat pasien bisa ditelusuri.

## 3. Tabel `kategori_tes`
Tabel ini berisi kelompok jenis pemeriksaan laboratorium, misalnya hematologi, kimia klinik, urinalisis.

| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary key |
| `nama_kategori` | VARCHAR(100) | Nama kategori tes |
| `deskripsi` | TEXT | Penjelasan kategori, nullable |

## 4. Tabel `parameter_tes`
Tabel ini menyimpan parameter yang dipakai dalam tes lab serta nilai rujukan berdasarkan jenis kelamin.

| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary key |
| `kategori_id` | INT / BIGINT | FK ke `kategori_tes.id` |
| `nama_parameter` | VARCHAR(100) | Nama parameter tes |
| `satuan` | VARCHAR(20) | Contoh: `g/dL`, `mg/dL`, `cells/uL` |
| `nilai_rujukan` | VARCHAR(100) | Teks referensi rujukan |
| `min_pria` | FLOAT | Nilai minimum pasien laki-laki |
| `max_pria` | FLOAT | Nilai maksimum pasien laki-laki |
| `min_wanita` | FLOAT | Nilai minimum pasien perempuan |
| `max_wanita` | FLOAT | Nilai maksimum pasien perempuan |

Catatan:
- Parameter harus selalu terkait ke kategori tertentu.
- Jika nilai hasil berada di luar limit berdasarkan jenis kelamin pasien, maka hasil tersebut dianggap abnormal.

## 5. Tabel `pemeriksaan`
Tabel ini mewakili order pemeriksaan pasien dan status prosesnya.

| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary key |
| `pasien_id` | INT / BIGINT | FK ke `pasien.id` |
| `dokter_perujuk` | VARCHAR(100) | Nama dokter atau poli rujukan |
| `is_cito` | BOOLEAN | Prioritas tinggi / urgent |
| `analis_id` | INT / BIGINT | FK ke `users.id` yang menginput hasil |
| `validator_id` | INT / BIGINT | FK ke `users.id` yang validasi dokter |
| `catatan_dokter` | TEXT | Catatan klinis dari dokter |
| `status` | VARCHAR(30) | `menunggu`, `proses`, `menunggu_validasi`, `revisi`, `selesai` |
| `waktu_daftar` | TIMESTAMP | Waktu order dibuat |
| `waktu_selesai` | TIMESTAMP | Waktu validasi final atau selesai |

Catatan:
- Status harus dipakai secara konsisten agar alur kerja laboratorium terdokumentasi dengan benar.
- `is_cito` sangat penting untuk prioritas pemeriksaan.

## 6. Tabel `detail_hasil`
Tabel ini menyimpan hasil pemeriksaan tiap parameter untuk tiap pemeriksaan pasien.

| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary key |
| `pemeriksaan_id` | INT / BIGINT | FK ke `pemeriksaan.id` |
| `parameter_id` | INT / BIGINT | FK ke `parameter_tes.id` |
| `nilai_hasil` | VARCHAR(100) | Nilai hasil, dapat berupa angka atau teks |
| `is_abnormal` | BOOLEAN | Menandai hasil di luar batas rujukan |
| `catatan` | TEXT | Catatan analis atau keterangan tambahan |

Catatan:
- `detail_hasil` adalah fondasi rekam medis lab.
- Setiap variabel hasil harus selalu terhubung ke pemeriksaan yang benar dan parameter yang benar.

## 7. Hubungan antar tabel

Skema ini mendukung alur kerja yang masuk akal seperti ini:

1. `pasien` → `pemeriksaan`
2. `users` (analis) → `pemeriksaan`
3. `kategori_tes` → `parameter_tes`
4. `parameter_tes` → `detail_hasil`
5. `pemeriksaan` → `detail_hasil`
6. `users` (dokter) → validasi hasil pada `pemeriksaan`

Dengan struktur ini, sistem dapat melacak:
- pasien mana yang mendapat pemeriksaan;
- siapa analis yang input hasil;
- parameter apa yang paling relevan;
- hasil mana yang abnormal;
- dokter mana yang memvalidasi;
- apakah hasil final diterima atau direvisi.

## 8. Status skema saat ini

Skema inti yang sudah ada dapat mendukung alur puskesmas yang realistis, yaitu:
- registrasi pasien;
- order pemeriksaan;
- input hasil lab;
- auto-flagging abnormal;
- validasi dokter;
- rekam medis dasar.

## 9. Rekomendasi penambahan untuk produksi

Untuk membuat aplikasi ini benar-benar siap operasional, disarankan menambahkan tabel-tabel berikut:

### `log_aktivitas`
| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL | Primary key |
| `user_id` | BIGINT | FK ke `users.id` |
| `aksi` | VARCHAR(100) | Contoh: login, tambah_pasien, validasi_hasil |
| `waktu` | TIMESTAMP | Waktu aksi |
| `detail` | TEXT | Detail perubahan atau aktivitas |

### `laporan_pdf`
| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL | Primary key |
| `pemeriksaan_id` | BIGINT | FK ke `pemeriksaan.id` |
| `file_path` | TEXT | Lokasi file hasil PDF |
| `created_at` | TIMESTAMP | Waktu laporan dibuat |

### `setting_instansi`
| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL | Primary key |
| `nama_puskesmas` | VARCHAR(150) | Nama puskesmas |
| `alamat` | TEXT | Alamat instansi |
| `telepon` | VARCHAR(50) | Nomor kontak |
| `logo_path` | TEXT | Lokasi logo |

## 10. Catatan penting untuk pengembangan lanjutan

- pastikan semua foreign key diberi index untuk performa.
- gunakan `UNIQUE` untuk `username` dan `nik`.
- tambahkan `updated_at` untuk tabel yang sering berubah.
- pertimbangkan `CHECK` constraint untuk status dan role agar konsisten.
- buat log aktivitas untuk kebutuhan audit dan keamanan.

Dengan skema seperti ini, aplikasi tidak hanya “mampu mengelola data”, tetapi juga benar-benar mencerminkan alur laboratorium pasien yang masuk akal untuk layanan kesehatan. 

## 14. Perubahan skema implementasi (27 Oktober 2026)

Bagian ini melengkapi tabel inti di atas dan mencerminkan schema Prisma/migration yang aktif.

### Kolom foto profil pada `users`
- `foto_profil TEXT NULL` menyimpan JPEG data URL base64 hasil crop persegi 256 x 256.
- Backend membatasi format, ukuran encoded data, dan dimensi gambar; API profil mengubah hanya user yang berasal dari JWT.
- Profil mengubah nama, username, dan foto. Password tidak termasuk kontrak endpoint profil.

### Tabel `notifications`

| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL | Primary key |
| `user_id` | INTEGER | FK ke `users.id`, cascade saat user dihapus |
| `title` | VARCHAR(120) | Judul |
| `message` | TEXT | Pesan notifikasi |
| `href` | VARCHAR(255) nullable | Route aplikasi tujuan |
| `created_at` | TIMESTAMP(3) | Waktu pembuatan |
| `read_at` | TIMESTAMP(3) nullable | Null berarti belum dibaca |

Index: `(user_id, read_at, created_at)`. Endpoint list/read selalu membatasi baris ke `user_id` dari token, bukan ID bebas dari client.

### Analytics agregat
- `GET /api/dashboard/analytics` tidak menambah tabel dan tidak mengembalikan PII.
- Response mencakup KPI operasional, 14 titik harian, distribusi status, dan kategori tes 30 hari.
- Endpoint tersedia untuk `admin`, `analis`, `dokter`, dan `demo`; data diperoleh dengan query agregat atas tabel pemeriksaan, detail hasil, pasien, dan kategori.

Migration `prisma/migrations/20261027000000_profile_notifications/migration.sql` bersifat additive dan sudah diterapkan pada database yang dikonfigurasi. `DATABASE_URL` diprioritaskan oleh `backend/dbConfig.js`; jangan dokumentasikan nilai URL atau password. Jangan menjalankan `backend/init_db.sql` untuk update biasa karena script tersebut mereset tabel.