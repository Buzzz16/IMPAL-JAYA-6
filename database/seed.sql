-- ============================================================================
-- DATA AWAL (SEEDER) POSTGRESQL — POLUSEE WEB PLATFORM
-- File: database/seed.sql
-- Command eksekusi:
--   psql -U postgres -d polusee_db -f database/seed.sql
-- ============================================================================

-- 1. Seed Akun User & Admin (Password default: password123 -> bcrypt hash)
INSERT INTO akun (id_akun, nama_lengkap, email, password_hash, role, status_aktif)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Pengguna PoluSee', 'user@polusee.id', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8p7R8iH6G8Z1eQ5zR3V6aP0wK9vX2W', 'USER', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Admin PoluSee', 'admin@polusee.id', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8p7R8iH6G8Z1eQ5zR3V6aP0wK9vX2W', 'ADMIN', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id_akun, lokasi_default, latitude, longitude, kategori_rentan, foto_profil)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Samarinda', -0.502200, 117.153600, 'Umum', 'https://images.unsplash.com/photo-1630678334641-0c5339dfd1a7?auto=format&fit=crop&w=500&q=85')
ON CONFLICT (id_akun) DO NOTHING;

INSERT INTO admins (id_akun, nip_admin, departemen)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'NIP-2025-001', 'Pemantauan Kualitas Udara & Moderasi')
ON CONFLICT (id_akun) DO NOTHING;

-- 2. Seed Data AQI 4 Kota Utama (Samarinda, Balikpapan, Jakarta, Bandung)
INSERT INTO data_aqi (nama_lokasi, latitude, longitude, nilai_aqi, kategori_level, pm25, pm10, co, o3, waktu_ukur)
VALUES
  ('Samarinda', -0.502200, 117.153600, 150, 'Tidak sehat bagi kelompok sensitif', 55.4, 72.0, 1600, 36, CURRENT_TIMESTAMP),
  ('Balikpapan', -1.237900, 116.852900, 78, 'Sedang', 24.6, 32.0, 980, 28, CURRENT_TIMESTAMP),
  ('Jakarta', -6.208800, 106.845600, 163, 'Tidak sehat', 76.2, 99.1, 1850, 42, CURRENT_TIMESTAMP),
  ('Bandung', -6.917500, 107.619100, 62, 'Sedang', 17.8, 23.1, 820, 25, CURRENT_TIMESTAMP);

-- 3. Seed Rekomendasi Kesehatan (5 Kategori AQI sesuai Bab 4.5 SKPL)
INSERT INTO rekomendasi_kesehatan (batas_bawah_aqi, batas_atas_aqi, kategori_aqi, saran_aktivitas_luar, saran_perlindungan_diri, saran_kelompok_rentan, updated_by)
VALUES
  (0, 50, 'Baik', 'Kualitas udara mendukung jalan santai, bersepeda, dan aktivitas luar ruangan.', 'Masker khusus polusi tidak selalu diperlukan saat udara baik.', 'Dapat beraktivitas di luar ruangan seperti biasa.', '22222222-2222-2222-2222-222222222222'),
  (51, 100, 'Sedang', 'Sebagian besar orang dapat beraktivitas seperti biasa.', 'Siapkan masker jika berada dekat sumber debu atau asap.', 'Jika sensitif terhadap polusi, kurangi durasi dan intensitas saat merasa tidak nyaman.', '22222222-2222-2222-2222-222222222222'),
  (101, 150, 'Tidak sehat bagi kelompok sensitif', 'Kurangi aktivitas berat di luar, terutama siang hari.', 'Gunakan respirator N95 atau KN95 saat berada di area terpapar.', 'Anak-anak, lansia, dan penderita asma perlu mengurangi paparan di luar ruangan.', '22222222-2222-2222-2222-222222222222'),
  (151, 200, 'Tidak sehat', 'Pindahkan olahraga ke ruangan dengan udara lebih bersih.', 'Gunakan masker N95 saat harus keluar dan tutup jendela saat udara luar tercemar.', 'Kelompok sensitif wajib menghindari aktivitas berat di luar ruangan.', '22222222-2222-2222-2222-222222222222'),
  (201, 500, 'Sangat tidak sehat / Berbahaya', 'Hindari seluruh aktivitas fisik di luar ruangan.', 'Tetap di dalam ruangan dengan penyaring udara HEPA aktif.', 'Segera cari pertolongan medis bila mengalami sesak napas atau gejala memburuk.', '22222222-2222-2222-2222-222222222222');

-- 4. Seed Konten Edukasi
INSERT INTO konten_edukasi (judul_konten, kategori_topik, isi_materi, media_url, status_publikasi, id_admin)
VALUES
  ('AQI: membaca angka, memahami risiko.', 'Kenali udara', 'AQI menggambarkan tingkat pencemaran udara. Nilai yang lebih tinggi menunjukkan risiko kesehatan yang lebih besar.\n\n0–50: baik. 51–100: sedang. 101–150: tidak sehat bagi kelompok sensitif. 151–200: tidak sehat. 201–300: sangat tidak sehat. Di atas 300: berbahaya.\n\nPantau informasi dari stasiun pemantau resmi terdekat. Kondisi dapat berubah sepanjang hari; sesuaikan aktivitas dengan angka terbaru.', '', 'PUBLISHED', '22222222-2222-2222-2222-222222222222'),
  ('PM2.5: kecil partikelnya, besar dampaknya.', 'Bahaya polusi', 'PM2.5 adalah partikel berdiameter 2,5 mikrometer atau lebih kecil. Sumbernya antara lain pembakaran bahan bakar, kebakaran, dan proses industri.\n\nPartikel halus dapat masuk jauh ke paru-paru. Paparan polusi dikaitkan dengan gangguan pernapasan dan penyakit kardiovaskular.\n\nKurangi paparan saat udara buruk: batasi aktivitas berat di luar, hindari sumber asap, dan gunakan ruang dengan udara lebih bersih.', '', 'PUBLISHED', '22222222-2222-2222-2222-222222222222'),
  ('Memilih masker yang benar-benar melindungi.', 'Perlindungan diri', 'Respirator N95 yang sesuai dan terpasang rapat dapat membantu mengurangi partikel yang terhirup. Masker kain tidak memberi perlindungan setara terhadap partikel halus.\n\nTutup hidung dan mulut, sesuaikan penjepit hidung, dan periksa celah di tepi masker. Ganti jika rusak, kotor, atau sulit digunakan untuk bernapas.', '', 'PUBLISHED', '22222222-2222-2222-2222-222222222222');

-- 5. Seed Ulasan Edukasi
INSERT INTO ulasan_edukasi (id_konten, id_user, isi_ulasan, rating, is_edited)
VALUES
  (1, '11111111-1111-1111-1111-111111111111', 'Penjelasan rentang angka AQI sangat mudah dipahami untuk memantau udara harian di Samarinda.', 5, FALSE);

-- 6. Seed Post Komunitas & Laporan Polusi
INSERT INTO post_komunitas (id_user, judul_post, isi_konten, media_lampiran, status_moderasi)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Asap pembakaran sampah di sekitar Sungai Karang Mumus', 'Asap pembakaran sampah di sekitar Sungai Karang Mumus', 'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85', 'AKTIF'),
  ('11111111-1111-1111-1111-111111111111', 'Udara pagi di area taman terasa lebih segar', 'Udara pagi di area taman terasa lebih segar', 'https://images.unsplash.com/photo-1527965408463-82ae0731825c?auto=format&fit=crop&w=1200&q=85', 'AKTIF');

INSERT INTO laporan_polusi (nomor_tiket, id_post, id_user, kategori_polusi, deskripsi_kejadian, alamat_lokasi, latitude, longitude, url_foto_bukti, status_verifikasi)
VALUES
  ('POL-2025-1041', 1, '11111111-1111-1111-1111-111111111111', 'Pembakaran sampah', 'Asap pembakaran sampah di sekitar Sungai Karang Mumus', 'Sungai Karang Mumus, Samarinda', -0.494800, 117.156200, 'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85', 'TERVERIFIKASI'),
  ('POL-2025-1042', 2, '11111111-1111-1111-1111-111111111111', 'Kondisi Udara', 'Udara pagi di area taman terasa lebih segar', 'Taman kota, Samarinda', -0.502200, 117.153600, 'https://images.unsplash.com/photo-1527965408463-82ae0731825c?auto=format&fit=crop&w=1200&q=85', 'TERVERIFIKASI');
