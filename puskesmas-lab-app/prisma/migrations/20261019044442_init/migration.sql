-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "nama_lengkap" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pasien" (
    "id" SERIAL NOT NULL,
    "nik" VARCHAR(16) NOT NULL,
    "nama_pasien" VARCHAR(100) NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "jenis_kelamin" VARCHAR(1) NOT NULL,
    "alamat" TEXT,
    "no_hp" VARCHAR(15),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pasien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori_tes" (
    "id" SERIAL NOT NULL,
    "nama_kategori" VARCHAR(100) NOT NULL,
    "deskripsi" TEXT,

    CONSTRAINT "kategori_tes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parameter_tes" (
    "id" SERIAL NOT NULL,
    "kategori_id" INTEGER NOT NULL,
    "nama_parameter" VARCHAR(100) NOT NULL,
    "satuan" VARCHAR(20),
    "nilai_rujukan" VARCHAR(100),
    "min_pria" DOUBLE PRECISION,
    "max_pria" DOUBLE PRECISION,
    "min_wanita" DOUBLE PRECISION,
    "max_wanita" DOUBLE PRECISION,

    CONSTRAINT "parameter_tes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemeriksaan" (
    "id" SERIAL NOT NULL,
    "pasien_id" INTEGER NOT NULL,
    "kategori_id" INTEGER,
    "dokter_perujuk" VARCHAR(100),
    "is_cito" BOOLEAN NOT NULL DEFAULT false,
    "analis_id" INTEGER NOT NULL,
    "validator_id" INTEGER,
    "catatan_dokter" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'menunggu',
    "waktu_daftar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktu_selesai" TIMESTAMP(3),

    CONSTRAINT "pemeriksaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_hasil" (
    "id" SERIAL NOT NULL,
    "pemeriksaan_id" INTEGER NOT NULL,
    "parameter_id" INTEGER NOT NULL,
    "nilai_hasil" VARCHAR(50) NOT NULL,
    "is_abnormal" BOOLEAN NOT NULL DEFAULT false,
    "catatan" TEXT,

    CONSTRAINT "detail_hasil_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "pasien_nik_key" ON "pasien"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "kategori_tes_nama_kategori_key" ON "kategori_tes"("nama_kategori");

-- CreateIndex
CREATE UNIQUE INDEX "parameter_tes_kategori_id_nama_parameter_key" ON "parameter_tes"("kategori_id", "nama_parameter");

-- AddForeignKey
ALTER TABLE "parameter_tes" ADD CONSTRAINT "parameter_tes_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori_tes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan" ADD CONSTRAINT "pemeriksaan_pasien_id_fkey" FOREIGN KEY ("pasien_id") REFERENCES "pasien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan" ADD CONSTRAINT "pemeriksaan_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori_tes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan" ADD CONSTRAINT "pemeriksaan_analis_id_fkey" FOREIGN KEY ("analis_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan" ADD CONSTRAINT "pemeriksaan_validator_id_fkey" FOREIGN KEY ("validator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_hasil" ADD CONSTRAINT "detail_hasil_pemeriksaan_id_fkey" FOREIGN KEY ("pemeriksaan_id") REFERENCES "pemeriksaan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_hasil" ADD CONSTRAINT "detail_hasil_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "parameter_tes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
