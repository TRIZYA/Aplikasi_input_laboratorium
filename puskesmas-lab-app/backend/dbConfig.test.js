const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDatabaseConfig } = require('./dbConfig');

test('prefers DATABASE_URL over local DB_* variables when Prisma connection is configured', () => {
  const config = buildDatabaseConfig({
    DATABASE_URL: 'postgres://user:pass@db.prisma.io:5432/postgres?sslmode=require',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_NAME: 'puskesmas_lab',
    DB_USER: 'zilong',
    DB_PASSWORD: 'puskesmas123',
  });

  assert.equal(config.connectionString, 'postgres://user:pass@db.prisma.io:5432/postgres?sslmode=require');
  assert.deepEqual(config.ssl, { rejectUnauthorized: true });
});

test('falls back to DB_* values when DATABASE_URL is absent', () => {
  const config = buildDatabaseConfig({
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_NAME: 'puskesmas_lab',
    DB_USER: 'zilong',
    DB_PASSWORD: 'puskesmas123',
  });

  assert.equal(config.host, 'localhost');
  assert.equal(config.database, 'puskesmas_lab');
  assert.equal(config.user, 'zilong');
  assert.equal(config.password, 'puskesmas123');
});
