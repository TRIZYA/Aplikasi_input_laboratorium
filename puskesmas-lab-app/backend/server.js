const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.use(cors());
app.use(express.json());

const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      nama_lengkap: user.nama_lengkap,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '8h' }
  );
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User tidak valid' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid', error: error.message });
  }
};

const getPatientGender = async (pasienId) => {
  const result = await pool.query('SELECT jenis_kelamin FROM pasien WHERE id = $1', [pasienId]);
  if (result.rows.length === 0) {
    throw new Error('Pasien tidak ditemukan');
  }
  return result.rows[0].jenis_kelamin;
};

const isOutOfRange = async (parameterId, nilaiHasil, pasienId) => {
  const parameterQuery = await pool.query(
    'SELECT min_pria, max_pria, min_wanita, max_wanita FROM parameter_tes WHERE id = $1',
    [parameterId]
  );

  if (parameterQuery.rows.length === 0) {
    throw new Error('Parameter tidak ditemukan');
  }

  const parameter = parameterQuery.rows[0];
  const gender = await getPatientGender(pasienId);
  const numericValue = Number(nilaiHasil);

  if (Number.isNaN(numericValue)) {
    return false;
  }

  const min = gender === 'L' ? parameter.min_pria : parameter.min_wanita;
  const max = gender === 'L' ? parameter.max_pria : parameter.max_wanita;

  if (min == null || max == null) {
    return false;
  }

  return numericValue < min || numericValue > max;
};

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, role, nama_lengkap } = req.body;

  if (!username || !password || !role || !nama_lengkap) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username sudah digunakan' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, nama_lengkap)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, nama_lengkap, created_at`,
      [username, passwordHash, role, nama_lengkap]
    );

    const user = result.rows[0];
    res.status(201).json({
      message: 'User berhasil dibuat',
      user,
      token: signToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat user', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      nama_lengkap: user.nama_lengkap,
      created_at: user.created_at,
    };

    res.json({
      message: 'Login berhasil',
      user: safeUser,
      token: signToken(safeUser),
    });
  } catch (error) {
    res.status(500).json({ message: 'Login gagal', error: error.message });
  }
});

app.get('/api/pasien', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pasien ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat data pasien', error: error.message });
  }
});

app.get('/api/pasien/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM pasien WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pasien tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat detail pasien', error: error.message });
  }
});

app.post('/api/pasien', authMiddleware, async (req, res) => {
  const { nik, nama_pasien, tanggal_lahir, jenis_kelamin, alamat, no_hp } = req.body;

  if (!nik || !nama_pasien || !tanggal_lahir || !jenis_kelamin) {
    return res.status(400).json({ message: 'Field wajib: nik, nama_pasien, tanggal_lahir, jenis_kelamin' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pasien (nik, nama_pasien, tanggal_lahir, jenis_kelamin, alamat, no_hp)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nik, nama_pasien, tanggal_lahir, jenis_kelamin, alamat || null, no_hp || null]
    );

    res.status(201).json({ message: 'Pasien berhasil ditambahkan', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'NIK pasien sudah terdaftar' });
    }

    res.status(500).json({ message: 'Gagal menambahkan pasien', error: error.message });
  }
});

app.put('/api/pasien/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nik, nama_pasien, tanggal_lahir, jenis_kelamin, alamat, no_hp } = req.body;

  if (!nik || !nama_pasien || !tanggal_lahir || !jenis_kelamin) {
    return res.status(400).json({ message: 'Field wajib: nik, nama_pasien, tanggal_lahir, jenis_kelamin' });
  }

  try {
    const result = await pool.query(
      `UPDATE pasien
       SET nik = $1,
           nama_pasien = $2,
           tanggal_lahir = $3,
           jenis_kelamin = $4,
           alamat = $5,
           no_hp = $6
       WHERE id = $7
       RETURNING *`,
      [nik, nama_pasien, tanggal_lahir, jenis_kelamin, alamat || null, no_hp || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pasien tidak ditemukan' });
    }

    res.json({ message: 'Pasien berhasil diperbarui', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'NIK pasien sudah terdaftar' });
    }

    res.status(500).json({ message: 'Gagal memperbarui pasien', error: error.message });
  }
});

app.delete('/api/pasien/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM pasien WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pasien tidak ditemukan' });
    }

    res.json({ message: 'Pasien berhasil dihapus', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus pasien', error: error.message });
  }
});

app.get('/api/kategori-tes', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kategori_tes ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat kategori tes', error: error.message });
  }
});

app.post('/api/kategori-tes', authMiddleware, async (req, res) => {
  const { nama_kategori, deskripsi } = req.body;

  if (!nama_kategori) {
    return res.status(400).json({ message: 'nama_kategori wajib diisi' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO kategori_tes (nama_kategori, deskripsi)
       VALUES ($1, $2)
       RETURNING *`,
      [nama_kategori, deskripsi || null]
    );

    res.status(201).json({ message: 'Kategori tes berhasil ditambahkan', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Nama kategori sudah ada' });
    }
    res.status(500).json({ message: 'Gagal menambahkan kategori tes', error: error.message });
  }
});

app.get('/api/kategori-tes/:id/parameter', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM parameter_tes WHERE kategori_id = $1 ORDER BY id ASC',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat parameter tes', error: error.message });
  }
});

app.post('/api/parameter-tes', authMiddleware, async (req, res) => {
  const {
    kategori_id,
    nama_parameter,
    satuan,
    nilai_rujukan,
    min_pria,
    max_pria,
    min_wanita,
    max_wanita,
  } = req.body;

  if (!kategori_id || !nama_parameter) {
    return res.status(400).json({ message: 'kategori_id dan nama_parameter wajib diisi' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO parameter_tes (
        kategori_id, nama_parameter, satuan, nilai_rujukan,
        min_pria, max_pria, min_wanita, max_wanita
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        kategori_id,
        nama_parameter,
        satuan || null,
        nilai_rujukan || null,
        min_pria ?? null,
        max_pria ?? null,
        min_wanita ?? null,
        max_wanita ?? null,
      ]
    );

    res.status(201).json({ message: 'Parameter tes berhasil ditambahkan', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Parameter pada kategori tersebut sudah ada' });
    }
    res.status(500).json({ message: 'Gagal menambahkan parameter tes', error: error.message });
  }
});

app.get('/api/master', authMiddleware, async (req, res) => {
  try {
    const kategoriResult = await pool.query('SELECT * FROM kategori_tes ORDER BY id ASC');
    const parameterResult = await pool.query('SELECT * FROM parameter_tes ORDER BY kategori_id, id');

    res.json({
      kategori: kategoriResult.rows,
      parameter: parameterResult.rows,
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat data master', error: error.message });
  }
});

app.post('/api/pemeriksaan', authMiddleware, async (req, res) => {
  const { pasien_id, dokter_perujuk, analis_id, is_cito, status } = req.body;

  if (!pasien_id || !analis_id) {
    return res.status(400).json({ message: 'pasien_id dan analis_id wajib diisi' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pemeriksaan (pasien_id, dokter_perujuk, is_cito, analis_id, validator_id, catatan_dokter, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        pasien_id,
        dokter_perujuk || null,
        Boolean(is_cito),
        analis_id,
        null,
        null,
        status || 'menunggu',
      ]
    );

    res.status(201).json({ message: 'Pemeriksaan berhasil dibuat', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat pemeriksaan', error: error.message });
  }
});

app.get('/api/pemeriksaan', authMiddleware, async (req, res) => {
  try {
    const { status, pasien_id } = req.query;
    let query = `
      SELECT p.*, pas.nama_pasien, pas.nik, u.username AS analis_username
      FROM pemeriksaan p
      LEFT JOIN pasien pas ON pas.id = p.pasien_id
      LEFT JOIN users u ON u.id = p.analis_id
    `;
    const values = [];

    if (status || pasien_id) {
      const conditions = [];
      if (status) {
        conditions.push(`p.status = $${values.length + 1}`);
        values.push(status);
      }
      if (pasien_id) {
        conditions.push(`p.pasien_id = $${values.length + 1}`);
        values.push(pasien_id);
      }
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY p.waktu_daftar DESC';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat data pemeriksaan', error: error.message });
  }
});

app.get('/api/pemeriksaan/:id', authMiddleware, async (req, res) => {
  try {
    const pemeriksaanQuery = await pool.query(
      `SELECT p.*, pas.nama_pasien, pas.nik, pas.tanggal_lahir, pas.jenis_kelamin,
              u.username AS analis_username,
              v.username AS validator_username
       FROM pemeriksaan p
       LEFT JOIN pasien pas ON pas.id = p.pasien_id
       LEFT JOIN users u ON u.id = p.analis_id
       LEFT JOIN users v ON v.id = p.validator_id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (pemeriksaanQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Pemeriksaan tidak ditemukan' });
    }

    const hasilQuery = await pool.query(
      `SELECT dh.*, pt.nama_parameter, pt.satuan, pt.nilai_rujukan
       FROM detail_hasil dh
       LEFT JOIN parameter_tes pt ON pt.id = dh.parameter_id
       WHERE dh.pemeriksaan_id = $1
       ORDER BY dh.id ASC`,
      [req.params.id]
    );

    res.json({
      ...pemeriksaanQuery.rows[0],
      detail_hasil: hasilQuery.rows,
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat detail pemeriksaan', error: error.message });
  }
});

app.post('/api/pemeriksaan/:id/hasil', authMiddleware, async (req, res) => {
  const pemeriksaanId = Number(req.params.id);
  const { hasil } = req.body;

  if (!Array.isArray(hasil) || hasil.length === 0) {
    return res.status(400).json({ message: 'Data hasil harus berupa array' });
  }

  try {
    const pemeriksaanCheck = await pool.query('SELECT * FROM pemeriksaan WHERE id = $1', [pemeriksaanId]);
    if (pemeriksaanCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pemeriksaan tidak ditemukan' });
    }

    const inserted = [];

    for (const item of hasil) {
      const parameterId = Number(item.parameter_id);
      const nilaiHasil = String(item.nilai_hasil ?? '');
      const catatan = item.catatan || '';

      const abnormal = await isOutOfRange(parameterId, nilaiHasil, pemeriksaanCheck.rows[0].pasien_id);

      const queryResult = await pool.query(
        `INSERT INTO detail_hasil (pemeriksaan_id, parameter_id, nilai_hasil, is_abnormal, catatan)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [pemeriksaanId, parameterId, nilaiHasil, abnormal, catatan]
      );

      inserted.push(queryResult.rows[0]);
    }

    await pool.query(
      `UPDATE pemeriksaan SET status = 'menunggu_validasi' WHERE id = $1`,
      [pemeriksaanId]
    );

    res.status(201).json({
      message: 'Hasil lab berhasil disimpan dan menunggu validasi dokter',
      data: inserted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan hasil lab', error: error.message });
  }
});

app.post('/api/pemeriksaan/:id/validasi', authMiddleware, async (req, res) => {
  const { validator_id, status, catatan_dokter } = req.body;
  const pemeriksaanId = Number(req.params.id);

  if (!validator_id || !status) {
    return res.status(400).json({ message: 'validator_id dan status wajib diisi' });
  }

  if (!['selesai', 'revisi'].includes(status)) {
    return res.status(400).json({ message: 'Status validasi hanya boleh selesai atau revisi' });
  }

  try {
    const pemeriksaanCheck = await pool.query('SELECT * FROM pemeriksaan WHERE id = $1', [pemeriksaanId]);
    if (pemeriksaanCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pemeriksaan tidak ditemukan' });
    }

    const result = await pool.query(
      `UPDATE pemeriksaan
       SET validator_id = $1,
           catatan_dokter = $2,
           status = $3,
           waktu_selesai = CASE WHEN $3 = 'selesai' THEN NOW() ELSE NULL END
       WHERE id = $4
       RETURNING *`,
      [validator_id, catatan_dokter || null, status, pemeriksaanId]
    );

    res.json({
      message: status === 'selesai' ? 'Pemeriksaan berhasil divalidasi' : 'Pemeriksaan dikembalikan untuk revisi',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses validasi dokter', error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

app.listen(PORT, () => {
  console.log(`Server backend running on http://localhost:${PORT}`);
});
