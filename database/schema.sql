-- ============================================================================
-- SKEMA BASIS DATA POSTGRESQL — POLUSEE WEB PLATFORM
-- File: database/schema.sql
-- Mengacu pada: Dokumen SKPL-1000 Revisi C (Bab 3.2.3 Class Diagram & Lampiran B)
-- Command eksekusi:
--   psql -U postgres -d polusee_db -f database/schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Pembersihan tabel jika dijalankan ulang
DROP TABLE IF EXISTS laporan_polusi CASCADE;
DROP TABLE IF EXISTS post_komunitas CASCADE;
DROP TABLE IF EXISTS ulasan_edukasi CASCADE;
DROP TABLE IF EXISTS konten_edukasi CASCADE;
DROP TABLE IF EXISTS rekomendasi_kesehatan CASCADE;
DROP TABLE IF EXISTS data_aqi CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS akun CASCADE;

DROP TYPE IF EXISTS role_enum CASCADE;
DROP TYPE IF EXISTS status_publikasi_enum CASCADE;
DROP TYPE IF EXISTS status_moderasi_enum CASCADE;
DROP TYPE IF EXISTS status_verifikasi_enum CASCADE;

-- Definisi Tipe ENUM sesuai Class Diagram SKPL-1000
CREATE TYPE role_enum AS ENUM ('USER', 'ADMIN');
CREATE TYPE status_publikasi_enum AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE status_moderasi_enum AS ENUM ('AKTIF', 'DISEMBUNYIKAN', 'DIHAPUS');
CREATE TYPE status_verifikasi_enum AS ENUM ('PENDING', 'TERVERIFIKASI', 'DITOLAK');

-- 1. Tabel Induk: akun (Entitas Abstrak Akun untuk User & Admin)
CREATE TABLE akun (
    id_akun UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role role_enum NOT NULL DEFAULT 'USER',
    status_aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Aktor: users (Relasi 1-to-1 dengan tabel akun)
CREATE TABLE users (
    id_akun UUID PRIMARY KEY REFERENCES akun(id_akun) ON DELETE CASCADE,
    lokasi_default VARCHAR(100) NOT NULL DEFAULT 'Samarinda',
    latitude DECIMAL(9,6) DEFAULT -0.502200,
    longitude DECIMAL(9,6) DEFAULT 117.153600,
    kategori_rentan VARCHAR(50) DEFAULT 'Umum',
    foto_profil VARCHAR(255)
);

-- 3. Tabel Aktor: admins (Relasi 1-to-1 dengan tabel akun)
CREATE TABLE admins (
    id_akun UUID PRIMARY KEY REFERENCES akun(id_akun) ON DELETE CASCADE,
    nip_admin VARCHAR(50),
    departemen VARCHAR(80) DEFAULT 'Pengelolaan Lingkungan & Kualitas Udara',
    last_audit_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Entitas: data_aqi (Pengukuran AQI Real-time & Historis)
CREATE TABLE data_aqi (
    id_aqi SERIAL PRIMARY KEY,
    nama_lokasi VARCHAR(100) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    nilai_aqi INTEGER NOT NULL CHECK (nilai_aqi BETWEEN 0 AND 500),
    kategori_level VARCHAR(40) NOT NULL,
    pm25 DECIMAL(6,2) NOT NULL DEFAULT 0,
    pm10 DECIMAL(6,2) NOT NULL DEFAULT 0,
    co DECIMAL(6,2) DEFAULT 0,
    o3 DECIMAL(6,2) DEFAULT 0,
    waktu_ukur TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_aqi_lokasi_waktu ON data_aqi(nama_lokasi, waktu_ukur DESC);

-- 5. Tabel Entitas: rekomendasi_kesehatan (Rule-Based Engine Bab 4.5 SKPL)
CREATE TABLE rekomendasi_kesehatan (
    id_rekomendasi SERIAL PRIMARY KEY,
    batas_bawah_aqi INTEGER NOT NULL CHECK (batas_bawah_aqi >= 0),
    batas_atas_aqi INTEGER NOT NULL CHECK (batas_atas_aqi <= 500),
    kategori_aqi VARCHAR(40) NOT NULL,
    saran_aktivitas_luar TEXT NOT NULL,
    saran_perlindungan_diri TEXT NOT NULL,
    saran_kelompok_rentan TEXT NOT NULL,
    updated_by UUID REFERENCES admins(id_akun) ON DELETE SET NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rentang_aqi CHECK (batas_bawah_aqi <= batas_atas_aqi)
);

-- 6. Tabel Entitas: konten_edukasi (Materi Edukasi PoluSee)
CREATE TABLE konten_edukasi (
    id_konten SERIAL PRIMARY KEY,
    judul_konten VARCHAR(150) NOT NULL,
    kategori_topik VARCHAR(60) NOT NULL,
    isi_materi TEXT NOT NULL,
    media_url VARCHAR(255),
    status_publikasi status_publikasi_enum NOT NULL DEFAULT 'PUBLISHED',
    id_admin UUID REFERENCES admins(id_akun) ON DELETE SET NULL,
    published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Entitas: ulasan_edukasi (Ulasan & Edit Ulasan oleh User: UC-06 & UC-07)
CREATE TABLE ulasan_edukasi (
    id_ulasan SERIAL PRIMARY KEY,
    id_konten INTEGER NOT NULL REFERENCES konten_edukasi(id_konten) ON DELETE CASCADE,
    id_user UUID NOT NULL REFERENCES users(id_akun) ON DELETE CASCADE,
    isi_ulasan TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Entitas: post_komunitas (Forum Diskusi Komunitas: UC-08, UC-10, UC-14)
CREATE TABLE post_komunitas (
    id_post SERIAL PRIMARY KEY,
    id_user UUID NOT NULL REFERENCES users(id_akun) ON DELETE CASCADE,
    judul_post VARCHAR(150) NOT NULL,
    isi_konten TEXT NOT NULL,
    media_lampiran VARCHAR(255),
    status_moderasi status_moderasi_enum NOT NULL DEFAULT 'AKTIF',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel Entitas: laporan_polusi (Lapor Kejadian Polusi: UC-09 & UC-14)
CREATE TABLE laporan_polusi (
    id_laporan SERIAL PRIMARY KEY,
    nomor_tiket VARCHAR(30) NOT NULL UNIQUE,
    id_post INTEGER REFERENCES post_komunitas(id_post) ON DELETE CASCADE,
    id_user UUID NOT NULL REFERENCES users(id_akun) ON DELETE CASCADE,
    kategori_polusi VARCHAR(60) NOT NULL,
    deskripsi_kejadian TEXT NOT NULL,
    alamat_lokasi VARCHAR(150) NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    url_foto_bukti VARCHAR(255),
    status_verifikasi status_verifikasi_enum NOT NULL DEFAULT 'PENDING',
    waktu_lapor TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabel Entitas: like_post (Menyukai Postingan Komunitas / Laporan)
CREATE TABLE like_post (
    id_like SERIAL PRIMARY KEY,
    id_post INTEGER NOT NULL REFERENCES post_komunitas(id_post) ON DELETE CASCADE,
    id_user UUID REFERENCES users(id_akun) ON DELETE CASCADE,
    client_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS unq_like_user ON like_post (id_post, id_user) WHERE id_user IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unq_like_client ON like_post (id_post, client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_like_post_id ON like_post (id_post);

-- 11. Tabel Entitas: komentar_post (Komentar pada Post Komunitas / Laporan)
CREATE TABLE komentar_post (
    id_komentar SERIAL PRIMARY KEY,
    id_post INTEGER NOT NULL REFERENCES post_komunitas(id_post) ON DELETE CASCADE,
    id_user UUID REFERENCES users(id_akun) ON DELETE SET NULL,
    nama_pengguna VARCHAR(100),
    isi_komentar TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_komentar_post_id ON komentar_post (id_post);
