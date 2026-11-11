/**
 * ============================================================================
 * SCRIPT AUDIT & PEMBERSIHAN EGRESS SUPABASE (ZERO-EGRESS IN-DB CLEANUP)
 * File: scripts/cleanup-supabase-egress.js
 * Cara pakai: node scripts/cleanup-supabase-egress.js
 *
 * Seluruh pemeriksaan ukuran menggunakan fungsi SQL OCTET_LENGTH() di sisi
 * server PostgreSQL, sehingga TIDAK mengunduh string Base64 dan memakan 0 KB Egress.
 * ============================================================================
 */

import { pool } from '../backend/src/config/db.js';

const MAX_BASE64_BYTES = 250 * 1024; // Batas aman 250 KB per gambar Base64
const DEFAULT_REPORT_IMAGE =
  'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85';

function formatBytes(bytes) {
  const num = Number(bytes || 0);
  if (num >= 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  if (num >= 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${num} B`;
}

async function runAuditAndCleanup() {
  console.log('================================================================');
  console.log(' 🔍 AUDIT PENGGUNAAN DATA (BASE64) DI SUPABASE POSTGRESQL');
  console.log('================================================================\n');

  try {
    // 1. Audit ukuran kolom gambar di setiap tabel menggunakan OCTET_LENGTH (0 Egress)
    const statsRes = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM post_komunitas) AS total_posts,
        (SELECT COALESCE(SUM(OCTET_LENGTH(media_lampiran)), 0) FROM post_komunitas) AS post_media_bytes,
        (SELECT COALESCE(MAX(OCTET_LENGTH(media_lampiran)), 0) FROM post_komunitas) AS post_media_max_bytes,
        (SELECT COALESCE(SUM(OCTET_LENGTH(url_foto_bukti)), 0) FROM laporan_polusi) AS laporan_foto_bytes,
        (SELECT COALESCE(MAX(OCTET_LENGTH(url_foto_bukti)), 0) FROM laporan_polusi) AS laporan_foto_max_bytes,
        (SELECT COALESCE(SUM(OCTET_LENGTH(foto_profil)), 0) FROM users) AS profil_foto_bytes,
        (SELECT COALESCE(MAX(OCTET_LENGTH(foto_profil)), 0) FROM users) AS profil_foto_max_bytes,
        (SELECT COALESCE(SUM(OCTET_LENGTH(media_url)), 0) FROM konten_edukasi) AS edukasi_media_bytes
    `);

    const s = statsRes.rows[0];
    const totalBefore =
      Number(s.post_media_bytes) +
      Number(s.laporan_foto_bytes) +
      Number(s.profil_foto_bytes) +
      Number(s.edukasi_media_bytes);

    console.log('📊 Ukuran Kolom Gambar Saat Ini (Sebelum Pembersihan):');
    console.log(`   - Total Post Komunitas            : ${s.total_posts} baris`);
    console.log(
      `   - post_komunitas.media_lampiran   : ${formatBytes(s.post_media_bytes)} (Terbesar: ${formatBytes(s.post_media_max_bytes)})`
    );
    console.log(
      `   - laporan_polusi.url_foto_bukti   : ${formatBytes(s.laporan_foto_bytes)} (Terbesar: ${formatBytes(s.laporan_foto_max_bytes)})`
    );
    console.log(
      `   - users.foto_profil               : ${formatBytes(s.profil_foto_bytes)} (Terbesar: ${formatBytes(s.profil_foto_max_bytes)})`
    );
    console.log(`   - konten_edukasi.media_url        : ${formatBytes(s.edukasi_media_bytes)}`);
    console.log(`   -------------------------------------------------------------`);
    console.log(`   Total Payload Sekali Tarik Semua  : ${formatBytes(totalBefore)}\n`);

    // 2. Hapus duplikasi Base64 di laporan_polusi.url_foto_bukti jika sudah ada di post_komunitas.media_lampiran
    const dedupRes = await pool.query(`
      UPDATE laporan_polusi l
      SET url_foto_bukti = NULL
      FROM post_komunitas p
      WHERE l.id_post = p.id_post
        AND l.url_foto_bukti LIKE 'data:%'
        AND p.media_lampiran IS NOT NULL
        AND p.media_lampiran <> ''
    `);
    console.log(
      `✅ [Langkah 1] Menghapus duplikasi Base64 pada laporan_polusi.url_foto_bukti: ${dedupRes.rowCount} baris dibersihkan.`
    );

    // 3. Ganti gambar Base64 raksasa (> 250 KB) warisan sebelum kompresi dengan URL gambar ringan
    const cleanPostsRes = await pool.query(
      `UPDATE post_komunitas
       SET media_lampiran = $1
       WHERE media_lampiran LIKE 'data:%'
         AND OCTET_LENGTH(media_lampiran) > $2`,
      [DEFAULT_REPORT_IMAGE, MAX_BASE64_BYTES]
    );
    console.log(
      `✅ [Langkah 2] Mengganti foto post_komunitas Base64 > 250 KB: ${cleanPostsRes.rowCount} baris dioptimasi.`
    );

    const cleanLaporanRes = await pool.query(
      `UPDATE laporan_polusi
       SET url_foto_bukti = $1
       WHERE url_foto_bukti LIKE 'data:%'
         AND OCTET_LENGTH(url_foto_bukti) > $2`,
      [DEFAULT_REPORT_IMAGE, MAX_BASE64_BYTES]
    );
    console.log(
      `✅ [Langkah 3] Mengganti foto laporan_polusi Base64 > 250 KB: ${cleanLaporanRes.rowCount} baris dioptimasi.`
    );

    const cleanAvatarRes = await pool.query(
      `UPDATE users
       SET foto_profil = NULL
       WHERE foto_profil LIKE 'data:%'
         AND OCTET_LENGTH(foto_profil) > $1`,
      [MAX_BASE64_BYTES]
    );
    console.log(
      `✅ [Langkah 4] Mereset foto_profil Base64 > 250 KB (kembali ke inisial): ${cleanAvatarRes.rowCount} baris dioptimasi.`
    );

    const cleanEdukasiRes = await pool.query(
      `UPDATE konten_edukasi
       SET media_url = ''
       WHERE media_url LIKE 'data:%'
         AND OCTET_LENGTH(media_url) > $1`,
      [MAX_BASE64_BYTES]
    );
    console.log(
      `✅ [Langkah 5] Mereset cover edukasi Base64 > 250 KB: ${cleanEdukasiRes.rowCount} baris dioptimasi.\n`
    );

    // 4. Audit ulang setelah pembersihan
    const afterRes = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(OCTET_LENGTH(media_lampiran)), 0) FROM post_komunitas) AS post_media_bytes,
        (SELECT COALESCE(SUM(OCTET_LENGTH(url_foto_bukti)), 0) FROM laporan_polusi) AS laporan_foto_bytes,
        (SELECT COALESCE(SUM(OCTET_LENGTH(foto_profil)), 0) FROM users) AS profil_foto_bytes,
        (SELECT COALESCE(SUM(OCTET_LENGTH(media_url)), 0) FROM konten_edukasi) AS edukasi_media_bytes
    `);
    const a = afterRes.rows[0];
    const totalAfter =
      Number(a.post_media_bytes) +
      Number(a.laporan_foto_bytes) +
      Number(a.profil_foto_bytes) +
      Number(a.edukasi_media_bytes);

    console.log('📉 Ukuran Kolom Gambar Setelah Pembersihan:');
    console.log(`   - post_komunitas.media_lampiran   : ${formatBytes(a.post_media_bytes)}`);
    console.log(`   - laporan_polusi.url_foto_bukti   : ${formatBytes(a.laporan_foto_bytes)}`);
    console.log(`   - users.foto_profil               : ${formatBytes(a.profil_foto_bytes)}`);
    console.log(`   - konten_edukasi.media_url        : ${formatBytes(a.edukasi_media_bytes)}`);
    console.log(`   -------------------------------------------------------------`);
    console.log(`   Total Payload Sekarang            : ${formatBytes(totalAfter)}`);
    if (totalBefore > 0) {
      const savedPct = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);
      console.log(
        `   🎉 Penghematan Ukuran Data Query  : ${formatBytes(totalBefore - totalAfter)} (-${savedPct}%)\n`
      );
    }
  } catch (err) {
    console.error('❌ Gagal menjalankan audit/cleanup database:', err.message);
  } finally {
    await pool.end();
  }
}

runAuditAndCleanup();

