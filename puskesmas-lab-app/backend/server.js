const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');
const { buildDatabaseConfig } = require('./dbConfig');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const matchesAllowedOrigin = (origin) => {
  if (!origin) return true;

  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin.includes('*')) {
      const escaped = allowedOrigin
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      return new RegExp(`^${escaped}$`).test(origin);
    }

    return origin === allowedOrigin;
  });
};

const databaseConfig = buildDatabaseConfig(process.env);
const pool = new Pool(databaseConfig);

app.use(cors({
  origin: (origin, callback) => {
    if (matchesAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

const DEMO_USERS = [
  { username: 'admin', password: 'admin123', role: 'admin', nama_lengkap: 'Admin Laboratorium' },
  { username: 'analis', password: 'analis123', role: 'analis', nama_lengkap: 'Analis Laboratorium' },
  { username: 'dokter', password: 'dokter123', role: 'dokter', nama_lengkap: 'Dokter Puskesmas' },
  { username: 'demo1', password: 'demo123', role: 'demo', nama_lengkap: 'Demo Read Only' },
];

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

const ensureDemoUsers = async () => {
  try {
    for (const demoUser of DEMO_USERS) {
      const passwordHash = await bcrypt.hash(demoUser.password, 10);
      await pool.query(
        `INSERT INTO users (username, password_hash, role, nama_lengkap)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           nama_lengkap = EXCLUDED.nama_lengkap`,
        [demoUser.username, passwordHash, demoUser.role, demoUser.nama_lengkap]
      );
    }
  } catch (error) {
    console.error('Demo users seeding failed:', error.message);
  }
};

const ensureKnownAdmin = async () => {
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (result.rows.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (username, password_hash, role, nama_lengkap) VALUES ($1, $2, $3, $4)',
        ['admin', passwordHash, 'admin', 'Admin Laboratorium']
      );
    }
  } catch (error) {
    console.warn('Known admin seeding skipped:', error.message);
  }
};

const ensureSchemaCompatibility = async () => {
  try {
    const result = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'pemeriksaan'
       AND column_name = 'kategori_id'`
    );

    if (result.rows.length === 0) {
      await pool.query(
        `ALTER TABLE pemeriksaan
         ADD COLUMN kategori_id INTEGER REFERENCES kategori_tes(id) ON DELETE SET NULL;`
      );
      console.log('Added missing kategori_id column to pemeriksaan.');
    }
  } catch (error) {
    console.warn('Schema compatibility check skipped:', error.message);
  }
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

const denyDemoMutation = (req, res) => {
  if (req.user?.role === 'demo') {
    return res.status(403).json({
      message: 'Akun demo hanya dapat melihat data, tidak dapat melakukan perubahan.',
    });
  }

  return null;
};

const insertNotificationsForRole = (queryable, role, title, message, href) => {
  return queryable.query(
    `INSERT INTO notifications (user_id, title, message, href)
     SELECT id, $2, $3, $4 FROM users WHERE role = $1`,
    [role, title, message, href]
  );
};

const getJpegDimensions = (value) => {
  if (
    typeof value !== 'string'
    || value.length > 350000
    || !value.startsWith('data:image/jpeg;base64,')
  ) return null;

  const encoded = value.slice('data:image/jpeg;base64,'.length);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;

  const image = Buffer.from(encoded, 'base64');
  if (image.toString('base64') !== encoded) return null;
  if (image.length < 4 || image.length > 256 * 1024 || image[0] !== 0xff || image[1] !== 0xd8) {
    return null;
  }

  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;

  while (offset + 3 < image.length) {
    if (image[offset] !== 0xff) return null;
    while (image[offset] === 0xff) offset += 1;

    const marker = image[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > image.length) return null;

    const segmentLength = image.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > image.length) return null;

    if (frameMarkers.has(marker)) {
      return {
        height: image.readUInt16BE(offset + 3),
        width: image.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
};

const isValidProfilePhoto = (value) => {
  const dimensions = getJpegDimensions(value);
  return dimensions?.width === 256 && dimensions?.height === 256;
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
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Database connection failed', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, role, nama_lengkap } = req.body;

  if (!username || !password || !role || !nama_lengkap) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  if (String(role).toLowerCase() === 'demo') {
    return res.status(403).json({ message: 'Role demo hanya dapat digunakan untuk akun read-only yang sudah dibuat secara terkelola.' });
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
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '').trim();

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
      foto_profil: user.foto_profil,
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

app.get('/api/profile', authMiddleware, (req, res) => {
  const { id, username, role, nama_lengkap, foto_profil, created_at } = req.user;
  res.json({ data: { id, username, role, nama_lengkap, foto_profil, created_at } });
});

app.patch('/api/profile', authMiddleware, async (req, res) => {
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  const { username, nama_lengkap, foto_profil } = req.body || {};

  if ('password' in (req.body || {}) || 'password_hash' in (req.body || {})) {
    return res.status(400).json({ message: 'Password tidak dapat diubah dari profil.' });
  }

  const cleanUsername = String(username || '').trim();
  const cleanName = String(nama_lengkap || '').trim();
  const nextPhoto = foto_profil === undefined ? req.user.foto_profil : foto_profil;

  if (!cleanUsername || cleanUsername.length > 50 || !cleanName || cleanName.length > 100) {
    return res.status(400).json({ message: 'Nama dan username wajib diisi dengan panjang yang valid.' });
  }

  if (nextPhoto !== null && nextPhoto !== undefined && !isValidProfilePhoto(nextPhoto)) {
    return res.status(400).json({ message: 'Foto profil harus berupa JPEG base64 berukuran valid.' });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET username = $1, nama_lengkap = $2, foto_profil = $3
       WHERE id = $4
       RETURNING id, username, role, nama_lengkap, foto_profil, created_at`,
      [cleanUsername, cleanName, nextPhoto || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    res.json({ message: 'Profil berhasil diperbarui.', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Username sudah digunakan.' });
    }
    res.status(500).json({ message: 'Gagal memperbarui profil.' });
  }
});

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const [notifications, unread] = await Promise.all([
      pool.query(
        `SELECT id, title, message, href, created_at, read_at
         FROM notifications WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 30`,
        [req.user.id]
      ),
      pool.query(
        'SELECT COUNT(*)::integer AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
        [req.user.id]
      ),
    ]);

    res.json({ data: notifications.rows, unread_count: unread.rows[0].count });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat notifikasi.' });
  }
});

app.patch('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND read_at IS NULL',
      [req.user.id]
    );
    res.json({ message: 'Semua notifikasi ditandai telah dibaca.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui notifikasi.' });
  }
});

app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
       WHERE id = $1 AND user_id = $2
       RETURNING id, read_at`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan.' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui notifikasi.' });
  }
});

app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, nama_lengkap, created_at FROM users ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat data user', error: error.message });
  }
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengubah user.' });
  }

  const { id } = req.params;
  const { username, role, nama_lengkap } = req.body;

  if (!username || !role || !nama_lengkap) {
    return res.status(400).json({ message: 'username, role, dan nama_lengkap wajib diisi' });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET username = $1,
           role = $2,
           nama_lengkap = $3
       WHERE id = $4
       RETURNING id, username, role, nama_lengkap, created_at`,
      [username.trim(), role.trim(), nama_lengkap.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json({ message: 'User berhasil diperbarui', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Username sudah digunakan' });
    }
    res.status(500).json({ message: 'Gagal memperbarui user', error: error.message });
  }
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menghapus user.' });
  }

  const { id } = req.params;

  if (Number(id) === Number(req.user.id)) {
    return res.status(400).json({ message: 'User yang sedang login tidak dapat dihapus sendiri' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username, role, nama_lengkap',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json({ message: 'User berhasil dihapus', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus user', error: error.message });
  }
});

app.post('/api/users/:id/reset-password', authMiddleware, async (req, res) => {
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mereset password.' });
  }

  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || String(new_password).trim().length < 6) {
    return res.status(400).json({ message: 'new_password minimal 6 karakter' });
  }

  try {
    const passwordHash = await bcrypt.hash(String(new_password), 10);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username, role, nama_lengkap',
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json({ message: 'Password user berhasil direset', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mereset password user', error: error.message });
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
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

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
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

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
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

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
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

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

app.put('/api/kategori-tes/:id', authMiddleware, async (req, res) => {
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  const { id } = req.params;
  const { nama_kategori, deskripsi } = req.body;

  if (!nama_kategori) {
    return res.status(400).json({ message: 'nama_kategori wajib diisi' });
  }

  try {
    const result = await pool.query(
      `UPDATE kategori_tes
       SET nama_kategori = $1,
           deskripsi = $2
       WHERE id = $3
       RETURNING *`,
      [nama_kategori.trim(), deskripsi !== undefined ? deskripsi.trim() : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kategori tes tidak ditemukan' });
    }

    res.json({ message: 'Kategori tes berhasil diperbarui', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Nama kategori sudah ada' });
    }
    res.status(500).json({ message: 'Gagal memperbarui kategori tes', error: error.message });
  }
});

app.delete('/api/kategori-tes/:id', authMiddleware, async (req, res) => {
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM kategori_tes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kategori tes tidak ditemukan' });
    }

    res.json({ message: 'Kategori tes berhasil dihapus', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus kategori tes', error: error.message });
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
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

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

app.put('/api/parameter-tes/:id', authMiddleware, async (req, res) => {
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  const { id } = req.params;
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
      `UPDATE parameter_tes
       SET kategori_id = $1,
           nama_parameter = $2,
           satuan = $3,
           nilai_rujukan = $4,
           min_pria = $5,
           max_pria = $6,
           min_wanita = $7,
           max_wanita = $8
       WHERE id = $9
       RETURNING *`,
      [
        kategori_id,
        nama_parameter.trim(),
        satuan !== undefined ? satuan.trim() : null,
        nilai_rujukan !== undefined ? nilai_rujukan.trim() : null,
        min_pria ?? null,
        max_pria ?? null,
        min_wanita ?? null,
        max_wanita ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Parameter tes tidak ditemukan' });
    }

    res.json({ message: 'Parameter tes berhasil diperbarui', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Parameter pada kategori tersebut sudah ada' });
    }
    res.status(500).json({ message: 'Gagal memperbarui parameter tes', error: error.message });
  }
});

app.delete('/api/parameter-tes/:id', authMiddleware, async (req, res) => {
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM parameter_tes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Parameter tes tidak ditemukan' });
    }

    res.json({ message: 'Parameter tes berhasil dihapus', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus parameter tes', error: error.message });
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

app.get('/api/dashboard/analytics', authMiddleware, async (req, res) => {
  if (!['admin', 'analis', 'dokter', 'demo'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Akses analytics tidak tersedia untuk role ini.' });
  }

  try {
    const [summary, daily, statuses, categories] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (
             WHERE waktu_daftar >= CURRENT_DATE
               AND waktu_daftar < CURRENT_DATE + INTERVAL '1 day'
           )::integer AS pemeriksaan_hari_ini,
           COUNT(*) FILTER (WHERE status = 'menunggu_validasi')::integer AS menunggu_validasi,
           COUNT(*) FILTER (WHERE status = 'revisi')::integer AS perlu_revisi,
           COUNT(*) FILTER (WHERE status <> 'selesai')::integer AS order_aktif,
           COUNT(*) FILTER (WHERE status IN ('menunggu_validasi', 'selesai'))::integer AS hasil_tersimpan,
           COUNT(*) FILTER (
             WHERE status = 'selesai'
               AND waktu_daftar >= CURRENT_DATE - INTERVAL '29 days'
           )::integer AS selesai_30_hari,
           COUNT(*)::integer AS total_pemeriksaan,
           (SELECT COUNT(*)::integer FROM pasien) AS total_pasien,
           (
             SELECT COUNT(*)::integer
             FROM detail_hasil dh
             JOIN pemeriksaan p ON p.id = dh.pemeriksaan_id
             WHERE dh.is_abnormal = TRUE
               AND p.waktu_daftar >= CURRENT_DATE - INTERVAL '29 days'
           ) AS hasil_abnormal_30_hari
         FROM pemeriksaan`
      ),
      pool.query(
        `WITH calendar AS (
           SELECT (CURRENT_DATE - day_offset)::date AS day
           FROM generate_series(13, 0, -1) AS day_offset
         )
         SELECT TO_CHAR(calendar.day, 'YYYY-MM-DD') AS day,
                COUNT(p.id)::integer AS total
         FROM calendar
         LEFT JOIN pemeriksaan p
           ON p.waktu_daftar >= calendar.day::timestamp
          AND p.waktu_daftar < (calendar.day + 1)::timestamp
         GROUP BY calendar.day
         ORDER BY calendar.day ASC`
      ),
      pool.query(
        `SELECT status, COUNT(*)::integer AS total
         FROM pemeriksaan
         GROUP BY status
         ORDER BY CASE status
           WHEN 'menunggu' THEN 1
           WHEN 'proses' THEN 2
           WHEN 'menunggu_validasi' THEN 3
           WHEN 'revisi' THEN 4
           WHEN 'selesai' THEN 5
           ELSE 6
         END`
      ),
      pool.query(
        `SELECT COALESCE(k.nama_kategori, 'Tanpa kategori') AS label,
                COUNT(p.id)::integer AS total
         FROM pemeriksaan p
         LEFT JOIN kategori_tes k ON k.id = p.kategori_id
         WHERE p.waktu_daftar >= CURRENT_DATE - INTERVAL '29 days'
         GROUP BY k.nama_kategori
         ORDER BY total DESC, label ASC
         LIMIT 6`
      ),
    ]);

    res.json({
      data: {
        summary: summary.rows[0],
        daily: daily.rows,
        statuses: statuses.rows,
        categories: categories.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat analytics dashboard.' });
  }
});

app.post('/api/pemeriksaan', authMiddleware, async (req, res) => {
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  const { pasien_id, dokter_perujuk, analis_id, is_cito, status, kategori_id } = req.body;

  if (!pasien_id || !analis_id) {
    return res.status(400).json({ message: 'pasien_id dan analis_id wajib diisi' });
  }

  if (!kategori_id) {
    return res.status(400).json({ message: 'kategori_id wajib diisi' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pemeriksaan (pasien_id, dokter_perujuk, is_cito, analis_id, validator_id, catatan_dokter, status, kategori_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        pasien_id,
        dokter_perujuk || null,
        Boolean(is_cito),
        analis_id,
        null,
        null,
        status || 'menunggu',
        Number(kategori_id),
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
      SELECT p.*, pas.nama_pasien, pas.nik, u.username AS analis_username, kt.nama_kategori
      FROM pemeriksaan p
      LEFT JOIN pasien pas ON pas.id = p.pasien_id
      LEFT JOIN users u ON u.id = p.analis_id
      LEFT JOIN kategori_tes kt ON kt.id = p.kategori_id
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
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  const pemeriksaanId = Number(req.params.id);
  const { hasil } = req.body;

  if (!Array.isArray(hasil) || hasil.length === 0) {
    return res.status(400).json({ message: 'Data hasil harus berupa array' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const pemeriksaanCheck = await client.query(
      'SELECT * FROM pemeriksaan WHERE id = $1 FOR UPDATE',
      [pemeriksaanId]
    );
    if (pemeriksaanCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pemeriksaan tidak ditemukan' });
    }

    const inserted = [];

    for (const item of hasil) {
      const parameterId = Number(item.parameter_id);
      const nilaiHasil = String(item.nilai_hasil ?? '');
      const catatan = item.catatan || '';

      const abnormal = await isOutOfRange(parameterId, nilaiHasil, pemeriksaanCheck.rows[0].pasien_id);

      const queryResult = await client.query(
        `INSERT INTO detail_hasil (pemeriksaan_id, parameter_id, nilai_hasil, is_abnormal, catatan)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [pemeriksaanId, parameterId, nilaiHasil, abnormal, catatan]
      );

      inserted.push(queryResult.rows[0]);
    }

    await client.query(
      `UPDATE pemeriksaan SET status = 'menunggu_validasi' WHERE id = $1`,
      [pemeriksaanId]
    );
    await insertNotificationsForRole(
      client,
      'dokter',
      'Hasil menunggu validasi',
      'Ada hasil pemeriksaan baru yang menunggu validasi dokter.',
      '/dokter/validasi'
    );
    await client.query('COMMIT');

    res.status(201).json({
      message: 'Hasil lab berhasil disimpan dan menunggu validasi dokter',
      data: inserted,
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ message: 'Gagal menyimpan hasil lab', error: error.message });
  } finally {
    client?.release();
  }
});

app.post('/api/pemeriksaan/:id/validasi', authMiddleware, async (req, res) => {
  const demoBlocked = denyDemoMutation(req, res);
  if (demoBlocked) return demoBlocked;

  const { validator_id, status, catatan_dokter } = req.body;
  const pemeriksaanId = Number(req.params.id);

  if (!validator_id || !status) {
    return res.status(400).json({ message: 'validator_id dan status wajib diisi' });
  }

  if (!['selesai', 'revisi'].includes(status)) {
    return res.status(400).json({ message: 'Status validasi hanya boleh selesai atau revisi' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const pemeriksaanCheck = await client.query(
      'SELECT * FROM pemeriksaan WHERE id = $1 FOR UPDATE',
      [pemeriksaanId]
    );
    if (pemeriksaanCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pemeriksaan tidak ditemukan' });
    }

    const result = await client.query(
      `UPDATE pemeriksaan
       SET validator_id = $1::integer,
           catatan_dokter = $2,
           status = $3::varchar,
           waktu_selesai = CASE WHEN $3::varchar = 'selesai' THEN NOW() ELSE NULL END
       WHERE id = $4::integer
       RETURNING *`,
      [validator_id, catatan_dokter || null, status, pemeriksaanId]
    );
    await client.query(
      `INSERT INTO notifications (user_id, title, message, href)
       VALUES ($1, $2, $3, $4)`,
      [
        pemeriksaanCheck.rows[0].analis_id,
        status === 'selesai' ? 'Hasil telah divalidasi' : 'Hasil perlu direvisi',
        status === 'selesai'
          ? 'Dokter telah memvalidasi hasil pemeriksaan.'
          : 'Dokter meminta revisi pada hasil pemeriksaan.',
        '/analis/hasil',
      ]
    );
    await client.query('COMMIT');

    res.json({
      message: status === 'selesai' ? 'Pemeriksaan berhasil divalidasi' : 'Pemeriksaan dikembalikan untuk revisi',
      data: result.rows[0],
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ message: 'Gagal memproses validasi dokter', error: error.message });
  } finally {
    client?.release();
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

const ensureDatabaseReady = async () => {
  const usePrismaUrl = Boolean(process.env.DATABASE_URL);

  if (usePrismaUrl) {
    const schemaClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
    });

    try {
      await schemaClient.connect();
      const usersTableCheck = await schemaClient.query(
        "SELECT to_regclass('public.users') AS table_name"
      );

      if (!usersTableCheck.rows[0]?.table_name) {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'init_db.sql'), 'utf8');
        await schemaClient.query(schemaSql);
        console.log('Schema initialized from Prisma DATABASE_URL.');
      }
    } catch (error) {
      console.error('Schema initialization failed for Prisma DATABASE_URL:', error.message);
      throw error;
    } finally {
      await schemaClient.end();
    }

    return;
  }

  const adminClientConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  };

  const rootClient = new Client(adminClientConfig);

  try {
    await rootClient.connect();

    const databaseCheck = await rootClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [process.env.DB_NAME || 'puskesmas_lab']
    );

    if (databaseCheck.rowCount === 0) {
      await rootClient.query(`CREATE DATABASE "${process.env.DB_NAME || 'puskesmas_lab'}"`);
      console.log(`Database ${process.env.DB_NAME || 'puskesmas_lab'} created.`);
    }
  } catch (error) {
    console.error('Database bootstrap failed:', error.message);
    throw error;
  } finally {
    await rootClient.end();
  }

  const schemaClient = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'puskesmas_lab',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await schemaClient.connect();
    const usersTableCheck = await schemaClient.query(
      "SELECT to_regclass('public.users') AS table_name"
    );

    if (!usersTableCheck.rows[0]?.table_name) {
      const schemaSql = fs.readFileSync(path.join(__dirname, 'init_db.sql'), 'utf8');
      await schemaClient.query(schemaSql);
      console.log(`Schema initialized for ${process.env.DB_NAME || 'puskesmas_lab'}.`);
    }
  } catch (error) {
    console.error('Schema initialization failed:', error.message);
    throw error;
  } finally {
    await schemaClient.end();
  }
};

const startServer = async () => {
  await ensureDatabaseReady();
  await ensureSchemaCompatibility();
  await ensureDemoUsers();
  await ensureKnownAdmin();

  app.listen(PORT, () => {
    console.log(`Server backend running on http://localhost:${PORT}`);
  });
};

module.exports = app;
module.exports.default = app;
module.exports.app = app;
module.exports.startServer = startServer;
module.exports.pool = pool;
module.exports.ensureDemoUsers = ensureDemoUsers;
module.exports.ensureKnownAdmin = ensureKnownAdmin;
module.exports.ensureDatabaseReady = ensureDatabaseReady;
module.exports.matchesAllowedOrigin = matchesAllowedOrigin;
module.exports.isAllowedOrigin = matchesAllowedOrigin;

if (require.main === module) {
  startServer();
}
