# 🗄️ Skema Database (PostgreSQL) - Sistem Lab Puskesmas

Dokumen ini berisi struktur tabel relasional utama untuk database `puskesmas_lab` dan catatan mengenai skema yang sudah terimplementasi serta gap yang masih perlu ditambah untuk operasional nyata.

## 1. Tabel `users` (Pengguna Aplikasi)
Menyimpan data petugas yang memiliki akses ke dalam sistem (Admin, Analis, Dokter).

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary Key |
| `username` | VARCHAR(50) | Unik, digunakan untuk login |
| `password_hash` | VARCHAR(255) | Password yang sudah dienkripsi bcrypt |
| `role` | VARCHAR(20) | `admin`, `analis`, `dokter` |
| `nama_lengkap` | VARCHAR(100) | Nama asli petugas |
| `created_at` | TIMESTAMP | Waktu pembuatan akun |

Catatan implementasi:
- Pada aplikasi yang sedang dibangun, field `nama_lengkap` dan `created_at` sudah dipakai.
- Ada kebutuhan tambahan yang disarankan untuk produksi: `is_active`, `last_login`, `updated_at`.

## 2. Tabel `pasien` (Data Pasien)
Menyimpan identitas rekam medis pasien.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary Key |
| `nik` | VARCHAR(16) | Unik, NIK pasien |
| `nama_pasien` | VARCHAR(100) | Nama lengkap pasien |
| `tanggal_lahir` | DATE | Digunakan untuk menghitung umur |
| `jenis_kelamin` | VARCHAR(1) | `L` atau `P` |
| `alamat` | TEXT | Alamat domisili |
| `no_hp` | VARCHAR(15) | Nullable |
| `created_at` | TIMESTAMP | Waktu pasien didaftarkan |

## 3. Tabel `kategori_tes` (Master Kategori)
Mengelompokkan jenis tes laboratorium.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary Key |
| `nama_kategori` | VARCHAR(100) | Contoh: Hematologi, Kimia Klinik |
| `deskripsi` | TEXT | Keterangan optional |

## 4. Tabel `parameter_tes` (Master Parameter & Nilai Rujukan)
Menyimpan detail item tes dan batas normal untuk auto-flagging.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary Key |
| `kategori_id` | INT / BIGINT | Foreign Key -> `kategori_tes.id` |
| `nama_parameter` | VARCHAR(100) | Nama parameter |
| `satuan` | VARCHAR(20) | Misal: `g/dL`, `mg/dL` |
| `nilai_rujukan` | VARCHAR(100) | Teks rujukan untuk laporan |
| `min_pria` | FLOAT | Nilai minimum laki-laki |
| `max_pria` | FLOAT | Nilai maksimum laki-laki |
| `min_wanita` | FLOAT | Nilai minimum perempuan |
| `max_wanita` | FLOAT | Nilai maksimum perempuan |

## 5. Tabel `pemeriksaan` (Transaksi Lab / Order)
Mencatat kunjungan pasien dan status pemeriksaan laboratorium.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary Key |
| `pasien_id` | INT / BIGINT | Foreign Key -> `pasien.id` |
| `dokter_perujuk` | VARCHAR(100) | Dokter rujukan atau poli |
| `is_cito` | BOOLEAN | Prioritas tinggi |
| `analis_id` | INT / BIGINT | Foreign Key -> `users.id` |
| `validator_id` | INT / BIGINT | Foreign Key -> `users.id` |
| `catatan_dokter` | TEXT | Catatan klinis dari dokter |
| `status` | VARCHAR(20) | `menunggu`, `proses`, `menunggu_validasi`, `revisi`, `selesai` |
| `waktu_daftar` | TIMESTAMP | Waktu ekspedisi order dibuat |
| `waktu_selesai` | TIMESTAMP | Waktu hasil diselesaikan |

## 6. Tabel `detail_hasil` (Nilai Hasil Lab Pasien)
Menyimpan angka/hasil riil dari setiap parameter tes.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL / BIGINT | Primary Key |
| `pemeriksaan_id` | INT / BIGINT | Foreign Key -> `pemeriksaan.id` |
| `parameter_id` | INT / BIGINT | Foreign Key -> `parameter_tes.id` |
| `nilai_hasil` | VARCHAR(50) | Bisa angka atau string seperti `Positif` |
| `is_abnormal` | BOOLEAN | `TRUE` jika di luar batas normal |
| `catatan` | TEXT | Catatan analis optional |

---

## 🔗 Panduan Relasi (Alur Kerja Data)
1. Pasien didaftarkan ke tabel `pasien`.
2. Pemeriksaan dibuat di `pemeriksaan` dan terhubung ke pasien serta analis.
3. Parameter yang dipakai diambil dari `kategori_tes` dan `parameter_tes`.
4. Setiap nilai hasil disimpan di `detail_hasil`.
5. Backend mengecek nilai hasil terhadap `min/max` parameter dan menandai `is_abnormal`.
6. Dokter melakukan validasi dan mengubah status pemeriksaan menjadi `selesai` atau `revisi`.

## ✅ Status Skema Saat Ini

Skema inti yang diperlukan untuk alur lab puskesmas sudah ada. Struktur ini sudah dapat mendukung:
- login dan user role,
- rekam pasien,
- pengelolaan kategori tes,
- pengelolaan parameter tes,
- order lab,
- hasil lab,
- validasi klinis,
- auto-flagging.

## ⚠️ Rekomendasi Penambahan Skema untuk Produksi

Untuk menggantikan sistem manual menjadi sistem operasional yang lebih kuat, disarankan menambahkan tabel berikut:

### A. `log_aktivitas`
| Kolom | Keterangan |
| :--- | :--- |
| `id` | Primary Key |
| `user_id` | User yang melakukan aksi |
| `aksi` | login, tambah_pasien, validasi, edit_parameter |
| `waktu` | Timestamp |
| `detail` | Deskripsi aktivitas |

### B. `laporan_pdf` (optional)
| Kolom | Keterangan |
| :--- | :--- |
| `id` | Primary Key |
| `pemeriksaan_id` | Referensi ke pemeriksaan |
| `file_path` | Lokasi file PDF |
| `created_at` | Waktu pembuatan PDF |

### C. `setting_instansi` (optional)
| Kolom | Keterangan |
| :--- | :--- |
| `id` | Primary Key |
| `nama_puskesmas` | Nama instansi |
| `alamat` | Alamat kantor |
| `telepon` | Nomor kontak |
| `kop_logo` | Path logo |

## 🧩 Catatan Perbaikan Database

- Pastikan semua foreign key diberi index agar query cepat.
- Tambahkan `UNIQUE(username)` di tabel `users`.
- Tambahkan `UNIQUE(nik)` di tabel `pasien`.
- Tambahkan kolom `updated_at` pada tabel yang sering diubah.
- Biasakan untuk menyimpan status dengan enum yang konsisten menggunakan check constraint di PostgreSQL.

Skema ini masih bisa dikembangkan lebih lanjut sesuai kebutuhan operasional rumah sakit / puskesmas yang lebih lengkap.