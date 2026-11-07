import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// mysql2 bug: pool-only options (maxIdle, idleTimeout) are forwarded to
// the Connection constructor, which logs a harmless warning. Suppress
// ONLY those two messages so real config errors still surface.
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = String(args[0] || '');
  if (
    msg.includes('Ignoring invalid configuration option') &&
    (msg.includes('maxIdle') || msg.includes('idleTimeout'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

let dbConfig;

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.substring(1)),
    ssl: { rejectUnauthorized: false },
  };
} else {
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vertudez',
  };
}

const pool = mysql.createPool({
  ...dbConfig,

  // Pool-specific options
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
  connectTimeout: 10000,

  // ★ Critical for PlanetScale sleep
  enableKeepAlive: false,    // no TCP keep-alive packets
  keepAliveInitialDelay: 0,
  maxIdle: 0,                // don't hold idle connections (warning suppressed above)
  idleTimeout: 1000,         // close any stray connection after 1 second

  timezone: 'local',
});

export { pool };