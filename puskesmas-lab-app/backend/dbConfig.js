const buildDatabaseConfig = (env = process.env) => {
  if (env.DATABASE_URL) {
    return {
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
    };
  }

  return {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 5432),
    database: env.DB_NAME || 'puskesmas_lab',
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  };
};

module.exports = { buildDatabaseConfig };
