/**
 * ============================================================================
 * MODUL BACKEND: REKOMENDASI KESEHATAN — RULE-BASED ENGINE (UC-05 & BAB 4.5 SKPL)
 * File: backend/src/modules/rekomendasi/rekomendasi.controller.js
 * ============================================================================
 */

import { query } from '../../config/db.js';

export async function getRekomendasiByAQI(req, res) {
  const nilaiAqi = parseInt(req.query.aqi || '100', 10);
  let kategoriRentan = req.query.kategori || 'Umum';

  try {
    if (req.user?.id_akun) {
      const userRes = await query(
        'SELECT kategori_rentan FROM users WHERE id_akun = $1',
        [req.user.id_akun]
      ).catch(() => null);
      if (userRes && userRes.rows.length > 0 && userRes.rows[0].kategori_rentan) {
        kategoriRentan = userRes.rows[0].kategori_rentan;
      }
    }

    const rekomRes = await query(
      `SELECT * FROM rekomendasi_kesehatan
       WHERE $1 BETWEEN batas_bawah_aqi AND batas_atas_aqi
       LIMIT 1`,
      [nilaiAqi]
    );

    if (rekomRes && rekomRes.rows.length > 0) {
      return res.status(200).json({
        nilai_aqi: nilaiAqi,
        kategori_rentan: kategoriRentan,
        rekomendasi: rekomRes.rows[0],
        info:
          kategoriRentan === 'Umum'
            ? 'Lengkapi profil untuk saran lebih spesifik'
            : 'Rekomendasi telah disesuaikan dengan profil kesehatan Anda',
      });
    }
    return res.status(404).json({ message: 'Aturan rekomendasi untuk nilai AQI ini tidak ditemukan di Supabase.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat rekomendasi kesehatan dari Supabase.', error: err.message });
  }
}
