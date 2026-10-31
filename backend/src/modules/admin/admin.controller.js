/**
 * ============================================================================
 * MODUL BACKEND: ADMIN PANEL & MODERASI SISTEM (UC-12, UC-13, UC-14, UC-15)
 * File: backend/src/modules/admin/admin.controller.js
 * ============================================================================
 */

import { query } from '../../config/db.js';
import {
  getLiveIQAirData,
  getLiveCityStations,
  hitungKategoriAQI,
} from '../../services/iqairService.js';

// UC-12: Monitor & Validasi Data AQI (Integrasi API Eksternal IQAir)
export async function getMonitoringAQI(req, res) {
  return getMonitorDataAQI(req, res);
}
export async function getMonitorDataAQI(req, res) {
  const lokasi = req.query.lokasi || 'Samarinda';
  const start = Date.now();

  try {
    const live = await getLiveIQAirData(lokasi);
    const latency = Date.now() - start;

    return res.status(200).json({
      lokasi: live.city,
      provinsi: live.state,
      nilai_aqi: live.aqi,
      kategori: live.category,
      pm25: live.pollutants.pm25,
      pm10: live.pollutants.pm10,
      cuaca: live.weather,
      status_sinkronisasi: 'ONLINE / LIVE',
      terakhir_disinkronkan: live.timestamp,
      latency_ms: latency,
      source: live.source,
      stasiun_tersedia: await getLiveCityStations(lokasi),
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Gagal menghubungi server sensor eksternal untuk pemantauan data AQI.',
      error: err.message,
    });
  }
}

// UC-12: Sinkronisasi / Kalibrasi Data AQI Secara Manual oleh Admin
export async function simpanDataAQI(req, res) {
  return sinkronisasiDataAQI(req, res);
}
export async function sinkronisasiDataAQI(req, res) {
  const {
    nama_lokasi = 'Samarinda',
    latitude = -0.5022,
    longitude = 117.1536,
    nilai_aqi,
    pm25 = 0,
    pm10 = 0,
  } = req.body;

  const aqiNum = Number(nilai_aqi);
  if (!nama_lokasi || Number.isNaN(aqiNum) || aqiNum < 0 || aqiNum > 500) {
    return res
      .status(400)
      .json({ message: 'Format atau rentang nilai data AQI tidak valid (0 - 500).' });
  }

  const kategori = hitungKategoriAQI(aqiNum);
  try {
    const insertRes = await query(
      `INSERT INTO data_aqi (nama_lokasi, latitude, longitude, nilai_aqi, kategori_level, pm25, pm10)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nama_lokasi, latitude, longitude, aqiNum, kategori, pm25, pm10]
    );
    if (insertRes && insertRes.rows.length > 0) {
      return res.status(201).json({
        message: 'Data AQI berhasil disimpan ke Supabase',
        data: insertRes.rows[0],
      });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menyimpan data AQI ke Supabase', error: err.message });
  }

  return res.status(201).json({
    message: 'Data AQI berhasil disimpan',
    data: {
      nama_lokasi,
      nilai_aqi: aqiNum,
      kategori_level: kategori,
      pm25,
      pm10,
      waktu_ukur: new Date().toISOString(),
    },
  });
}

// UC-13: Kelola Rekomendasi Kesehatan (GET)
export async function getDaftarRekomendasiAdmin(_req, res) {
  try {
    const result = await query(
      'SELECT * FROM rekomendasi_kesehatan ORDER BY batas_bawah_aqi ASC'
    );
    return res.status(200).json({ list_rekomendasi: result?.rows || [] });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat aturan rekomendasi dari Supabase.', error: err.message });
  }
}

// UC-13: Kelola Rekomendasi Kesehatan (PUT)
export async function updateRekomendasiAdmin(req, res) {
  const { id } = req.params;
  const {
    batas_bawah_aqi,
    batas_atas_aqi,
    saran_aktivitas_luar,
    saran_perlindungan_diri,
    saran_kelompok_rentan,
  } = req.body;

  if (
    batas_bawah_aqi === undefined ||
    batas_atas_aqi === undefined ||
    !saran_aktivitas_luar ||
    !saran_perlindungan_diri
  ) {
    return res
      .status(400)
      .json({ message: 'Rentang nilai AQI dan saran rekomendasi wajib diisi lengkap.' });
  }

  try {
    await query(
      `UPDATE rekomendasi_kesehatan
       SET batas_bawah_aqi = $1, batas_atas_aqi = $2, saran_aktivitas_luar = $3,
           saran_perlindungan_diri = $4, saran_kelompok_rentan = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id_rekomendasi = $6`,
      [
        batas_bawah_aqi,
        batas_atas_aqi,
        saran_aktivitas_luar,
        saran_perlindungan_diri,
        saran_kelompok_rentan || null,
        id,
      ]
    );
    return res.status(200).json({ message: 'Rekomendasi kesehatan berhasil diperbarui di Supabase' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui rekomendasi di Supabase.', error: err.message });
  }
}

// UC-14: Moderasi Konten Komunitas (GET)
export async function getAntreanModerasi(_req, res) {
  try {
    const result = await query(
      `SELECT p.*, l.id_laporan, l.nomor_tiket, l.kategori_polusi, l.status_verifikasi
       FROM post_komunitas p
       LEFT JOIN laporan_polusi l ON p.id_post = l.id_post
       ORDER BY p.created_at DESC`
    );
    const reports = (result?.rows || []).map((r) => ({
      id: `post-${r.id_post}`,
      ticket: r.nomor_tiket || `#TKT-${r.id_post}`,
      caption: r.isi_konten || r.judul_post,
      status: r.status_verifikasi || 'TERVERIFIKASI',
      date: r.created_at,
      time: new Date(r.created_at).toLocaleDateString('id-ID'),
    }));
    return res.status(200).json({ daftar_moderasi: result?.rows || [], reports });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat antrean moderasi dari Supabase.', error: err.message });
  }
}

// UC-14: Moderasi Konten Komunitas (PATCH)
export async function updateStatusModerasi(req, res) {
  const { id } = req.params;
  const { status, catatan } = req.body;

  if ((status === 'DITOLAK' || status === 'DIHAPUS') && (!catatan || !catatan.trim())) {
    return res
      .status(400)
      .json({ message: 'Catatan alasan wajib diisi untuk penolakan atau penghapusan konten.' });
  }

  let targetPostId = null;
  const cleanStr = String(id || '').trim();
  const matchNum = cleanStr.replace(/^post-/, '').replace(/^rep-/, '');
  if (!Number.isNaN(Number(matchNum)) && Number(matchNum) > 0) {
    targetPostId = Number(matchNum);
  } else {
    try {
      const ticketRes = await query('SELECT id_post FROM laporan_polusi WHERE nomor_tiket = $1', [cleanStr]);
      if (ticketRes && ticketRes.rows.length > 0) {
        targetPostId = ticketRes.rows[0].id_post;
      }
    } catch (err) {
      console.warn('[Moderasi DB Find Error]:', err.message);
    }
  }

  try {
    if (status === 'DIHAPUS') {
      if (targetPostId) {
        await query('DELETE FROM post_komunitas WHERE id_post = $1', [targetPostId]);
      }
    } else if (['AKTIF', 'DISEMBUNYIKAN'].includes(status)) {
      if (targetPostId) {
        await query('UPDATE post_komunitas SET status_moderasi = $1 WHERE id_post = $2', [
          status,
          targetPostId,
        ]);
      }
    }

    if (['PENDING', 'TERVERIFIKASI', 'DITOLAK'].includes(status)) {
      if (targetPostId) {
        await query('UPDATE laporan_polusi SET status_verifikasi = $1 WHERE id_post = $2', [
          status,
          targetPostId,
        ]);
      }
    }
    return res.status(200).json({ message: 'Status moderasi berhasil diperbarui di Supabase' });
  } catch (err) {
    console.error('[Moderasi DB Update Error]:', err.message);
    return res.status(500).json({ message: 'Gagal memperbarui status moderasi di Supabase.', error: err.message });
  }
}

// UC-14: Hapus Konten Komunitas Permanen (DELETE)
export async function hapusPostModerasi(req, res) {
  const { id } = req.params;
  let targetPostId = null;
  const cleanStr = String(id || '').trim();
  const matchNum = cleanStr.replace(/^post-/, '').replace(/^rep-/, '');
  if (!Number.isNaN(Number(matchNum)) && Number(matchNum) > 0) {
    targetPostId = Number(matchNum);
  } else {
    try {
      const ticketRes = await query('SELECT id_post FROM laporan_polusi WHERE nomor_tiket = $1', [cleanStr]);
      if (ticketRes && ticketRes.rows.length > 0) {
        targetPostId = ticketRes.rows[0].id_post;
      }
    } catch {}
  }

  try {
    if (targetPostId) {
      await query('DELETE FROM post_komunitas WHERE id_post = $1', [targetPostId]);
    }
    return res.status(200).json({ message: 'Konten berhasil dihapus permanen dari Supabase.' });
  } catch (err) {
    console.error('[Hapus Post DB Error]:', err.message);
    return res.status(500).json({ message: 'Gagal menghapus konten dari Supabase.', error: err.message });
  }
}

// UC-15: Bagikan Dan Ubah Konten Edukasi
export async function getDaftarEdukasiAdmin(_req, res) {
  try {
    const result = await query('SELECT * FROM konten_edukasi ORDER BY published_at DESC');
    return res.status(200).json({ list_edukasi: result?.rows || [] });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat daftar edukasi dari Supabase.', error: err.message });
  }
}

export async function simpanAtauUbahEdukasiAdmin(req, res) {
  const { id, id_konten, judul, title, topic, kategori, isi_materi, sections, media_url, cover, status_publikasi = 'PUBLISHED' } =
    req.body;

  const articleTitle = judul || title || '';
  const articleTopic = kategori || topic || 'Kenali udara';
  const articleBody = isi_materi || (Array.isArray(sections) ? sections.join('\n\n') : '');
  const articleCover = media_url || cover || '';

  if (!articleTitle || !articleBody) {
    return res.status(400).json({ message: 'Judul dan isi materi edukasi wajib diisi.' });
  }

  let articleId = id || id_konten;
  const numId = Number(articleId);

  try {
    if (articleId && !Number.isNaN(numId)) {
      await query(
        `UPDATE konten_edukasi
         SET judul_konten = $1, kategori_topik = $2, isi_materi = $3, media_url = $4, status_publikasi = $5
         WHERE id_konten = $6`,
        [articleTitle, articleTopic, articleBody, articleCover, status_publikasi, numId]
      );
    } else {
      const insRes = await query(
        `INSERT INTO konten_edukasi (judul_konten, kategori_topik, isi_materi, media_url, status_publikasi)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id_konten`,
        [articleTitle, articleTopic, articleBody, articleCover, status_publikasi]
      );
      if (insRes && insRes.rows.length > 0) {
        articleId = insRes.rows[0].id_konten;
      }
    }
    return res.status(200).json({ message: 'Konten edukasi berhasil disimpan ke Supabase', id: articleId });
  } catch (err) {
    console.warn('[Admin Edukasi DB Warning]:', err.message);
    return res.status(500).json({ message: 'Gagal menyimpan konten edukasi ke Supabase.', error: err.message });
  }
}

export async function hapusEdukasiAdmin(req, res) {
  const { id } = req.params;
  try {
    await query('DELETE FROM konten_edukasi WHERE id_konten = $1', [id]);
    return res.status(200).json({ message: 'Artikel edukasi berhasil dihapus dari Supabase' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus artikel edukasi dari Supabase.', error: err.message });
  }
}
