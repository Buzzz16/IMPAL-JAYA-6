/**
 * ============================================================================
 * KONFIGURASI KONEKSI DATABASE POSTGRESQL (CONNECTION POOL)
 * File: backend/src/config/db.js
 * Mengacu pada: Bab 2.4, Bab 4.3, & Lampiran B SKPL-1000 Revisi C
 * ============================================================================
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'polusee_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  // Cegah node process crash saat pool error di latar belakang
  console.warn('[PostgreSQL Pool Warning]:', err.message);
});

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    // Melempar error agar controller dapat beralih ke dynamic dbStore
    throw err;
  }
}

