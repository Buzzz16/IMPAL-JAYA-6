/**
 * ============================================================================
 * MODUL BACKEND: KONTEN EDUKASI & ULASAN (UC-06 & UC-07 SKPL-1000)
 * File: backend/src/modules/edukasi/edukasi.controller.js
 * ============================================================================
 */

import { query } from '../../config/db.js';
import { dbStore } from '../../data/dbStore.js';

// UC-06: Ambil daftar konten edukasi
export async function getDaftarEdukasi(_req, res) {
  try {
    const result = await query(
      `SELECT * FROM konten_edukasi
       WHERE status_publikasi = 'PUBLISHED'
       ORDER BY published_at DESC`
    );
    if (result && result.rows.length > 0) {
      return res.status(200).json({ list_konten: result.rows });
    }
  } catch {
    // Gunakan dbStore
  }
  return res.status(200).json({ list_konten: dbStore.getArticles() });
}

// UC-06: Ambil detail konten edukasi beserta daftar ulasan
export async function getDetailEdukasi(req, res) {
  const { id_konten } = req.params;
  try {
    const kontenRes = await query('SELECT * FROM konten_edukasi WHERE id_konten = $1', [
      id_konten,
    ]);
    if (kontenRes && kontenRes.rows.length > 0) {
      const ulasanRes = await query(
        `SELECT u.*, a.nama_lengkap
         FROM ulasan_edukasi u
         JOIN akun a ON u.id_user = a.id_akun
         WHERE u.id_konten = $1
         ORDER BY u.created_at DESC`,
        [id_konten]
      );
      return res.status(200).json({
        detail_konten: kontenRes.rows[0],
        ulasan: ulasanRes.rows,
      });
    }
  } catch {
    // Gunakan dbStore
  }

  const art = dbStore.getArticleById(id_konten);
  if (!art) {
    return res.status(404).json({ message: 'Materi edukasi tidak ditemukan.' });
  }
  return res.status(200).json({
    detail_konten: art,
    ulasan: art.reviews || [],
  });
}

// UC-06: Tambah ulasan & rating pada konten edukasi
export async function tambahUlasanEdukasi(req, res) {
  const { id_konten } = req.params;
  const { isi_ulasan, rating = 5 } = req.body;
  const idUser = req.user?.id_akun || '11111111-1111-1111-1111-111111111111';

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
  } catch {
    // Simpan ke dbStore
  }

  const newRev = {
    id: `rev-${Date.now()}`,
    userName: req.user?.nama_lengkap || 'Aditya Nugraha',
    rating: Number(rating),
    comment: isi_ulasan.trim(),
    createdAt: new Date().toISOString(),
  };
  dbStore.addArticleReview(id_konten, newRev);
  return res.status(201).json({ ulasan_baru: newRev });
}

// UC-07: Edit Konten (Ulasan Edukasi)
export async function editUlasanEdukasi(req, res) {
  const { id_ulasan } = req.params;
  const { isi_ulasan, rating = 5 } = req.body;

  if (!isi_ulasan || !isi_ulasan.trim()) {
    return res.status(400).json({ message: 'Konten tidak boleh kosong.' });
  }

  try {
    const updateRes = await query(
      `UPDATE ulasan_edukasi
       SET isi_ulasan = $1, rating = $2, is_edited = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id_ulasan = $3
       RETURNING *`,
      [isi_ulasan.trim(), Number(rating), id_ulasan]
    );
    if (updateRes && updateRes.rows.length > 0) {
      return res.status(200).json({ ulasan_updated: updateRes.rows[0] });
    }
  } catch {
    // Selesai
  }

  return res.status(200).json({
    ulasan_updated: {
      id_ulasan,
      isi_ulasan: isi_ulasan.trim(),
      rating: Number(rating),
      is_edited: true,
      updated_at: new Date().toISOString(),
    },
  });
}
