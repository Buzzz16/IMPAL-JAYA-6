/**
 * ============================================================================
 * MODUL BACKEND: KONTEN EDUKASI & ULASAN (UC-06 & UC-07 SKPL-1000)
 * File: backend/src/modules/edukasi/edukasi.controller.js
 * ============================================================================
 */

import { query } from '../../config/db.js';

let cachedEdukasiList = null;
let cachedEdukasiTime = 0;
const EDUKASI_CACHE_TTL = 10 * 60 * 1000; // 10 menit TTL

export function invalidateEdukasiCache() {
  cachedEdukasiList = null;
  cachedEdukasiTime = 0;
}

// UC-06: Ambil daftar konten edukasi (dengan In-Memory Cache hemat Egress)
export async function getDaftarEdukasi(_req, res) {
  try {
    const now = Date.now();
    if (cachedEdukasiList && now - cachedEdukasiTime < EDUKASI_CACHE_TTL) {
      res.locals.dbLog = `Cache hit (${cachedEdukasiList.length} materi edukasi, 0 B egress)`;
      return res.status(200).json({ list_konten: cachedEdukasiList });
    }

    const result = await query(
      `SELECT id_konten, judul_konten, kategori_topik, isi_materi, media_url, status_publikasi, id_admin, published_at
       FROM konten_edukasi
       WHERE status_publikasi = 'PUBLISHED'
       ORDER BY published_at DESC
       LIMIT 30`
    );
    const rows = (result?.rows || []).map((row, idx) => ({
      ...row,
      id: row.id_konten || row.id || `edu-${idx}`,
      title: row.judul_konten || row.title || 'Materi Edukasi Udara',
      topic: row.kategori_topik || row.topic || 'Kenali udara',
      summary: row.isi_materi
        ? (row.isi_materi.length > 150 ? row.isi_materi.slice(0, 150) + '...' : row.isi_materi)
        : (row.summary || ''),
      sections: Array.isArray(row.sections) && row.sections.length > 0
        ? row.sections
        : (row.isi_materi ? row.isi_materi.split('\n\n') : [row.summary || row.isi_materi || '']),
      cover: row.media_url || row.cover || '',
      minutes: row.minutes || 4,
      audience: row.audience || 'Semua orang',
    }));

    cachedEdukasiList = rows;
    cachedEdukasiTime = Date.now();

    res.locals.dbLog = `Ditemukan ${rows.length} materi edukasi (disimpan ke cache)`;
    return res.status(200).json({ list_konten: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat daftar edukasi dari Supabase.', error: err.message });
  }
}

// UC-06: Ambil detail konten edukasi beserta daftar ulasan
export async function getDetailEdukasi(req, res) {
  const { id_konten } = req.params;
  try {
    let detailRow = null;
    if (Array.isArray(cachedEdukasiList)) {
      detailRow = cachedEdukasiList.find((item) => String(item.id_konten) === String(id_konten));
    }

    if (!detailRow) {
      const kontenRes = await query(
        `SELECT id_konten, judul_konten, kategori_topik, isi_materi, media_url, status_publikasi, id_admin, published_at
         FROM konten_edukasi
         WHERE id_konten = $1`,
        [id_konten]
      );
      if (kontenRes && kontenRes.rows.length > 0) {
        detailRow = kontenRes.rows[0];
      }
    }

    if (detailRow) {
      const ulasanRes = await query(
        `SELECT u.id_ulasan, u.id_konten, u.id_user, u.isi_ulasan, u.rating, u.is_edited, u.created_at, u.updated_at, a.nama_lengkap
         FROM ulasan_edukasi u
         JOIN akun a ON u.id_user = a.id_akun
         WHERE u.id_konten = $1
         ORDER BY u.created_at DESC
         LIMIT 50`,
        [id_konten]
      );
      return res.status(200).json({
        detail_konten: detailRow,
        ulasan: ulasanRes.rows,
      });
    }
    return res.status(404).json({ message: 'Materi edukasi tidak ditemukan di Supabase.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat detail edukasi dari Supabase.', error: err.message });
  }
}

// UC-06: Tambah ulasan & rating pada konten edukasi
export async function tambahUlasanEdukasi(req, res) {
  const { id_konten } = req.params;
  const { isi_ulasan, rating = 5 } = req.body;
  const idUser = req.user?.id_akun;

  if (!idUser) {
    return res.status(401).json({ message: 'Anda harus login untuk menulis ulasan.' });
  }
  if (!isi_ulasan || !isi_ulasan.trim()) {
    return res.status(400).json({ message: 'Isi ulasan wajib diisi.' });
  }

  try {
    const insertRes = await query(
      `INSERT INTO ulasan_edukasi (id_konten, id_user, isi_ulasan, rating)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id_konten, idUser, isi_ulasan.trim(), Number(rating)]
    );
    if (insertRes && insertRes.rows.length > 0) {
      return res.status(201).json({ ulasan_baru: insertRes.rows[0] });
    }
    return res.status(400).json({ message: 'Gagal menambahkan ulasan ke database.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menyimpan ulasan ke Supabase.', error: err.message });
  }
}

// UC-07: Edit Konten (Ulasan Edukasi)
export async function editUlasanEdukasi(req, res) {
  const { id_ulasan } = req.params;
  const { isi_ulasan, rating = 5 } = req.body;
  const idUser = req.user?.id_akun;

  if (!idUser) {
    return res.status(401).json({ message: 'Anda harus login untuk mengubah ulasan.' });
  }
  if (!isi_ulasan || !isi_ulasan.trim()) {
    return res.status(400).json({ message: 'Konten tidak boleh kosong.' });
  }

  try {
    const updateRes = await query(
      `UPDATE ulasan_edukasi
       SET isi_ulasan = $1, rating = $2, is_edited = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id_ulasan = $3 AND id_user = $4
       RETURNING *`,
      [isi_ulasan.trim(), Number(rating), id_ulasan, idUser]
    );
    if (updateRes && updateRes.rows.length > 0) {
      return res.status(200).json({ ulasan_updated: updateRes.rows[0] });
    }
    return res.status(404).json({ message: 'Ulasan tidak ditemukan atau Anda tidak berhak mengeditnya.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui ulasan di Supabase.', error: err.message });
  }
}
