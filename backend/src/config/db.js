/**
 * ============================================================================
 * KONFIGURASI KONEKSI DATABASE POSTGRESQL / SUPABASE (CONNECTION POOL)
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

// Tes koneksi database di awal secara ramah & inisialisasi kolom like & tabel komentar
export async function ensureTablesExist() {
  try {
    await pool.query(`
      ALTER TABLE post_komunitas 
        ADD COLUMN IF NOT EXISTS jumlah_like INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS liked_by TEXT[] NOT NULL DEFAULT '{}';

      DROP TABLE IF EXISTS like_post CASCADE;

      CREATE TABLE IF NOT EXISTS komentar_post (
        id_komentar SERIAL PRIMARY KEY,
        id_post INTEGER NOT NULL REFERENCES post_komunitas(id_post) ON DELETE CASCADE,
        id_user UUID REFERENCES users(id_akun) ON DELETE SET NULL,
        nama_pengguna VARCHAR(100),
        isi_komentar TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_komentar_post_id ON komentar_post (id_post);

      CREATE TABLE IF NOT EXISTS riwayat_aqi_log (
        id_log SERIAL PRIMARY KEY,
        lokasi VARCHAR(100) NOT NULL,
        nilai_aqi INTEGER NOT NULL,
        pm25 NUMERIC(6, 2),
        pm10 NUMERIC(6, 2),
        suhu NUMERIC(5, 2),
        kelembaban NUMERIC(5, 2),
        kategori VARCHAR(50),
        waktu_catat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_riwayat_aqi_lokasi_waktu ON riwayat_aqi_log (lokasi, waktu_catat);

      -- Bersihkan log duplikat yang tercatat pada detik bersamaan
      DELETE FROM riwayat_aqi_log a USING riwayat_aqi_log b
      WHERE a.id_log > b.id_log
        AND a.lokasi = b.lokasi
        AND ABS(EXTRACT(EPOCH FROM (a.waktu_catat - b.waktu_catat))) < 120;

      -- Normalisasi nama lokasi Surabaya dari stasiun Pacarkeling
      UPDATE riwayat_aqi_log SET lokasi = 'Surabaya' WHERE lokasi = 'Pacarkeling';
    `);
  } catch (err) {
    console.warn('[Database Schema Warning]:', err.message);
  }
}

pool
  .query('SELECT NOW()')
  .then(async () => {
    console.log(
      `[Database Connected]: Terhubung ke PostgreSQL ${isSupabase ? '(Supabase Cloud)' : '(Local)'}`
    );
    await ensureTablesExist();
  })
  .catch((err) => {
    console.log(
      `[Database Error]: Gagal terhubung ke database Supabase: ${err.message}`
    );
  });

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    throw err;
  }
}
