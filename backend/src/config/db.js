/**
 * ============================================================================
 * KONFIGURASI KONEKSI DATABASE SUPABASE CLOUD POSTGRESQL (CONNECTION POOL)
 * File: backend/src/config/db.js
 * Mengacu pada: Bab 2.4, Bab 4.3, & Lampiran B SKPL-1000 Revisi C
 * ============================================================================
 */

import './loadEnv.js';
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

const rawDbUrl = process.env.DATABASE_URL?.trim();

if (!rawDbUrl) {
  console.error(
    '[Database Error]: Variabel DATABASE_URL (Supabase) belum diatur di file .env.local / .env!'
  );
}

export const pool = new Pool({
  connectionString: rawDbUrl,
  ssl: { rejectUnauthorized: false },
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.warn('[Supabase Pool Warning]:', err.message);
});

// Tes koneksi database Supabase di awal
pool
  .query('SELECT NOW()')
  .then(() => {
    console.log('[Database Connected]: Terhubung 100% ke PostgreSQL (Supabase Cloud)');
  })
  .catch((err) => {
    console.error(`[Database Error]: Gagal terhubung ke database Supabase: ${err.message}`);
  });

export async function query(text, params) {
  return await pool.query(text, params);
}
