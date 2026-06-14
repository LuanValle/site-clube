const { Pool } = require('@neondatabase/serverless');

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!globalThis.__siteFrancaPool) {
    globalThis.__siteFrancaPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return globalThis.__siteFrancaPool;
}

async function query(text, params = []) {
  const pool = getPool();
  return pool.query(text, params);
}

module.exports = {
  query,
};
