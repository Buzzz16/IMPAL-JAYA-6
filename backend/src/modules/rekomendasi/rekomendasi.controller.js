/**
 * ============================================================================
 * MODUL BACKEND: REKOMENDASI KESEHATAN — RULE-BASED ENGINE (UC-05 & BAB 4.5 SKPL)
 * File: backend/src/modules/rekomendasi/rekomendasi.controller.js
 * ============================================================================
 */

import { query } from '../../config/db.js';
import { serverCache, ONE_HOUR_MS } from '../../utils/serverCache.js';

const REKOMENDASI_CACHE_KEY = 'rekomendasi:rules';

export function invalidateRekomendasiCache() {
  serverCache.del(REKOMENDASI_CACHE_KEY);
}

export async function getAllRekomendasiRules() {
  const cached = serverCache.get(REKOMENDASI_CACHE_KEY);
  if (cached) {
    return { rows: cached, fromCache: true };
  }
  const result = await query(
    `SELECT id_rekomendasi, batas_bawah_aqi, batas_atas_aqi, kategori_aqi,
            saran_aktivitas_luar, saran_perlindungan_diri, saran_kelompok_rentan,
            updated_by, updated_at
     FROM rekomendasi_kesehatan
     ORDER BY batas_bawah_aqi ASC`
  );
  const rows = result?.rows || [];
  if (rows.length > 0) {
    serverCache.set(REKOMENDASI_CACHE_KEY, rows, ONE_HOUR_MS);
  }
  return { rows, fromCache: false };
}

export async function getRekomendasiByAQI(req, res) {
  const nilaiAqi = parseInt(req.query.aqi || '100', 10);
  const kategoriRentan = req.query.kategori || 'Umum';

  try {
    const { rows, fromCache } = await getAllRekomendasiRules();
    res.locals.dbLog = fromCache
      ? 'Aturan rekomendasi dari cache (0 B egress)'
      : `Dimuat ${rows.length} aturan rekomendasi`;

    const matched = rows.find(
      (r) => nilaiAqi >= Number(r.batas_bawah_aqi) && nilaiAqi <= Number(r.batas_atas_aqi)
    );

    if (matched) {
      return res.status(200).json({
        nilai_aqi: nilaiAqi,
        kategori_rentan: kategoriRentan,
        rekomendasi: matched,
        info:
          kategoriRentan === 'Umum'
            ? 'Lengkapi profil untuk saran lebih spesifik'
            : 'Rekomendasi telah disesuaikan dengan profil kesehatan Anda',
      });
    }
    return res.status(404).json({
      message: 'Aturan rekomendasi untuk nilai AQI ini tidak ditemukan di Supabase.',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Gagal memuat rekomendasi kesehatan dari Supabase.',
      error: err.message,
    });
  }
}
