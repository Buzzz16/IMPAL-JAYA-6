/**
 * ============================================================================
 * KONFIGURASI KONEKSI DATABASE POSTGRESQL / SUPABASE (CONNECTION POOL)
 * File: backend/src/config/db.js
 * Mengacu pada: Bab 2.4, Bab 4.3, & Lampiran B SKPL-1000 Revisi C
 * ============================================================================
 */

import './loadEnv.js';
import pg from 'pg';

const { Pool } = pg;

const rawDbUrl = process.env.DATABASE_URL?.trim();
const isPlaceholderUrl = !rawDbUrl || rawDbUrl.includes('PASSWORD_ANDA') || rawDbUrl.includes('PROJECT_REF');

// Deteksi apakah menggunakan Supabase / Cloud Database yang butuh SSL
const isSupabase =
  Boolean(!isPlaceholderUrl && rawDbUrl && rawDbUrl.includes('supabase')) ||
  Boolean(process.env.DB_HOST && process.env.DB_HOST.includes('supabase')) ||
  process.env.DB_SSL === 'true';

const poolConfig = (!isPlaceholderUrl && rawDbUrl)
  ? {
    connectionString: rawDbUrl,
    ssl: isSupabase ? { rejectUnauthorized: false } : false,
  }
  : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: isSupabase ? { rejectUnauthorized: false } : false,
  };

export const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool Warning]:', err.message);
});

// Tes koneksi database di awal secara ramah
pool
  .query('SELECT NOW()')
  .then(() => {
    console.log(
      `[Database Connected]: Terhubung ke PostgreSQL ${isSupabase ? '(Supabase Cloud)' : '(Local)'}`
    );
  })
  .catch((err) => {
    console.log(
      `[Database Fallback]: Belum terhubung ke PostgreSQL (${err.message}). Menggunakan In-Memory dbStore sebagai cadangan.`
    );
  });

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    // Melempar error agar controller dapat beralih ke dynamic dbStore
    throw err;
  }
}
