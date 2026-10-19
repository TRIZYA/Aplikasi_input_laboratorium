-- ============================================================
-- Database: puskesmas_lab
-- Schema: Lab Puskesmas
-- ============================================================

DROP TABLE IF EXISTS detail_hasil;
DROP TABLE IF EXISTS pemeriksaan;
DROP TABLE IF EXISTS parameter_tes;
DROP TABLE IF EXISTS kategori_tes;
DROP TABLE IF EXISTS pasien;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'analis', 'dokter')),
    nama_lengkap VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pasien (
    id SERIAL PRIMARY KEY,
    nik VARCHAR(16) UNIQUE NOT NULL,
    nama_pasien VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin VARCHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
    alamat TEXT,
    no_hp VARCHAR(15),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kategori_tes (
    id SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(100) UNIQUE NOT NULL,
    deskripsi TEXT
);

CREATE TABLE parameter_tes (
    id SERIAL PRIMARY KEY,
    kategori_id INTEGER NOT NULL REFERENCES kategori_tes(id) ON DELETE CASCADE,
    nama_parameter VARCHAR(100) NOT NULL,
    satuan VARCHAR(20),
    nilai_rujukan VARCHAR(100),
    min_pria DOUBLE PRECISION,
    max_pria DOUBLE PRECISION,
    min_wanita DOUBLE PRECISION,
    max_wanita DOUBLE PRECISION,
    UNIQUE (kategori_id, nama_parameter)
);

CREATE TABLE pemeriksaan (
    id SERIAL PRIMARY KEY,
    pasien_id INTEGER NOT NULL REFERENCES pasien(id) ON DELETE CASCADE,
    kategori_id INTEGER REFERENCES kategori_tes(id) ON DELETE SET NULL,
    dokter_perujuk VARCHAR(100),
    is_cito BOOLEAN NOT NULL DEFAULT FALSE,
    analis_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    validator_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    catatan_dokter TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'proses', 'menunggu_validasi', 'revisi', 'selesai')),
    waktu_daftar TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_selesai TIMESTAMP
);

CREATE TABLE detail_hasil (
    id SERIAL PRIMARY KEY,
    pemeriksaan_id INTEGER NOT NULL REFERENCES pemeriksaan(id) ON DELETE CASCADE,
    parameter_id INTEGER NOT NULL REFERENCES parameter_tes(id) ON DELETE RESTRICT,
    nilai_hasil VARCHAR(50) NOT NULL,
    is_abnormal BOOLEAN NOT NULL DEFAULT FALSE,
    catatan TEXT
);

INSERT INTO users (username, password_hash, role, nama_lengkap)
VALUES
    ('admin2', '$2b$10$Xt6Uga/DHxzD/uwYAEv0E.Kua1AtCN/het2CB4UeOUcINCmXR93s2', 'admin', 'Admin Laboratorium'),
    ('analis1', '$2b$10$l42zRQT2XmnCo0nux0BnzuSYcFJvUHmkfVRVXcn7rEIEzUwJsJWzO', 'analis', 'Analis Laboratorium'),
    ('dokter1', '$2b$10$0XINDH9lN/7qbRCGGoMq.e1bqfeLmO4r.Cfdfc2sFIS5YLF2cKfZm', 'dokter', 'Dokter Puskesmas');

INSERT INTO pasien (nik, nama_pasien, tanggal_lahir, jenis_kelamin, alamat, no_hp)
VALUES
    ('3201010101010001', 'Budi Santoso', '1990-05-12', 'L', 'Jl. Merdeka No. 12, Bandung', '081234567890');

INSERT INTO kategori_tes (nama_kategori, deskripsi)
VALUES
    ('Hematologi Rutin', 'Pemeriksaan darah lengkap dan komponen sel darah'),
    ('Kimia Klinik', 'Pemeriksaan metabolik dan kimia darah');

INSERT INTO parameter_tes (kategori_id, nama_parameter, satuan, nilai_rujukan, min_pria, max_pria, min_wanita, max_wanita)
VALUES
    (1, 'Hemoglobin', 'g/dL', '13.0 - 17.0 (Pria), 12.0 - 15.5 (Wanita)', 13.0, 17.0, 12.0, 15.5),
    (1, 'Leukosit', '10^3/uL', '4.5 - 11.0', 4.5, 11.0, 3.6, 10.1),
    (2, 'Gula Darah', 'mg/dL', '70 - 140', 70.0, 140.0, 70.0, 140.0),
    (2, 'Asam Urat', 'mg/dL', '3.5 - 7.2 (Pria), 2.6 - 6.0 (Wanita)', 3.5, 7.2, 2.6, 6.0);

INSERT INTO pemeriksaan (pasien_id, kategori_id, dokter_perujuk, is_cito, analis_id, validator_id, catatan_dokter, status, waktu_daftar)
VALUES
    (1, 1, 'Dr. Sari', FALSE, 1, 1, 'Pasien dalam kondisi stabil.', 'selesai', CURRENT_TIMESTAMP);

INSERT INTO detail_hasil (pemeriksaan_id, parameter_id, nilai_hasil, is_abnormal, catatan)
VALUES
    (1, 1, '14.8', FALSE, 'Normal pada pasien laki-laki'),
    (1, 2, '12.5', FALSE, 'Leukosit dalam batas normal'),
    (1, 3, '156', TRUE, 'Gula darah sedikit meningkat, perlu evaluasi'),
    (1, 4, '7.8', TRUE, 'Asam urat agak tinggi pada pasien pria');

SELECT 'Database puskesmas_lab berhasil dibuat dan diisi data awal.' AS status;
