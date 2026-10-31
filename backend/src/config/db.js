/**
 * ============================================================================
 * KONFIGURASI KONEKSI DATABASE POSTGRESQL (CONNECTION POOL)
 * File: backend/src/config/db.js
 * Mengacu pada: Bab 2.4, Bab 4.3, & Lampiran B SKPL-1000 Revisi C
 * ============================================================================
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Muat environment baik saat dijalankan dari root maupun folder backend
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const isSupabase = Boolean(connectionString && connectionString.includes('supabase'));

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isSupabase || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'polusee_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool Warning]:', err.message);
});

// Verifikasi koneksi awal ke basis data
pool.query('SELECT 1')
  .then(() => {
    console.log(`[PostgreSQL DB] Berhasil terhubung ke basis data ${isSupabase ? 'Supabase Cloud PostgreSQL' : 'PostgreSQL'}.`);
  })
  .catch((err) => {
    console.warn('[PostgreSQL DB] Koneksi basis data gagal, beralih ke penyimpanan lokal (dbStore):', err.message);
  });

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    throw err;
  }
}

