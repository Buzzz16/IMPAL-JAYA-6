/**
 * ============================================================================
 * MODUL BACKEND: FORUM KOMUNITAS & LAPOR KEJADIAN POLUSI (UC-08, UC-09, UC-10)
 * File: backend/src/modules/komunitas/komunitas.controller.js
 * ============================================================================
 */

import { query } from '../../config/db.js';
import { dbStore } from '../../data/dbStore.js';

// UC-08: Ambil Feed Komunitas
export async function getFeedKomunitas(_req, res) {
  try {
    const result = await query(
      `SELECT p.*, l.nomor_tiket, l.kategori_polusi, l.alamat_lokasi, l.latitude, l.longitude,
              l.url_foto_bukti, l.status_verifikasi, a.nama_lengkap
       FROM post_komunitas p
       LEFT JOIN laporan_polusi l ON p.id_post = l.id_post
       LEFT JOIN akun a ON p.id_user = a.id_akun
       WHERE p.status_moderasi = 'AKTIF'
       ORDER BY p.created_at DESC`
    );
    if (result && result.rows.length > 0) {
      return res.status(200).json({ feed_komunitas: result.rows, reports: dbStore.getReports() });
    }
  } catch {
    // Gunakan dbStore
  }
  return res.status(200).json({
    feed_komunitas: dbStore.getReports(),
    reports: dbStore.getReports(),
  });
}

// UC-08: Buat Postingan Diskusi Baru
export async function createPostKomunitas(req, res) {
  try {
    const { judul_post, isi_konten, media_lampiran } = req.body;
    const idUser = req.user?.id_akun || '11111111-1111-1111-1111-111111111111';

    if (!judul_post || !isi_konten) {
      return res.status(400).json({ message: 'Judul dan isi post wajib diisi.' });
    }

    const insertRes = await query(
      `INSERT INTO post_komunitas (id_user, judul_post, isi_konten, media_lampiran, status_moderasi)
       VALUES ($1, $2, $3, $4, 'AKTIF')
       RETURNING *`,
      [idUser, judul_post.trim(), isi_konten.trim(), media_lampiran || null]
    ).catch(() => null);

    if (insertRes && insertRes.rows.length > 0) {
      return res.status(201).json({ post_baru: insertRes.rows[0] });
    }
  } catch {
    // Fallback
  }

  const newPost = {
    id: `post-${Date.now()}`,
    title: req.body.judul_post,
    caption: req.body.isi_konten,
    author: req.user?.nama_lengkap || 'Pengguna',
    time: 'Baru saja',
    date: new Date().toISOString(),
    photo: req.body.media_lampiran || '',
    likes: 0,
    comments: [],
  };
  return res.status(201).json({ post_baru: newPost });
}

// UC-09: Lapor Kejadian Polusi (Extend Akses Komunitas)
export async function createLaporanPolusi(req, res) {
  const {
    caption,
    deskripsi_kejadian,
    source,
    kategori_polusi,
    condition,
    city,
    area,
    address,
    alamat_lokasi,
    latitude,
    longitude,
    image,
    url_foto_bukti,
  } = req.body;

  const idUser = req.user?.id_akun || '11111111-1111-1111-1111-111111111111';
  const deskripsi = (deskripsi_kejadian || caption || '').trim();
  const kategori = kategori_polusi || source || condition || 'Asap & Debu';
  const kota = city || 'Samarinda';
  const alamat = alamat_lokasi || address || `${area || 'Pusat Kota'}, ${kota}`.trim();
  const foto = url_foto_bukti || image || '';
  const nomorTiket = `#TKT-2026-${Math.floor(100 + Math.random() * 900)}`;

  if (!deskripsi) {
    return res.status(400).json({ message: 'Deskripsi kejadian polusi wajib diisi.' });
  }

  try {
    const postRes = await query(
      `INSERT INTO post_komunitas (id_user, judul_post, isi_konten, media_lampiran, status_moderasi)
       VALUES ($1, $2, $3, $4, 'AKTIF')
       RETURNING id_post`,
      [idUser, deskripsi.slice(0, 140), deskripsi, foto]
    );

    if (postRes && postRes.rows.length > 0) {
      const idPost = postRes.rows[0].id_post;
      await query(
        `INSERT INTO laporan_polusi (
           nomor_tiket, id_post, id_user, kategori_polusi, deskripsi_kejadian,
           alamat_lokasi, latitude, longitude, url_foto_bukti, status_verifikasi
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
         RETURNING *`,
        [
          nomorTiket,
          idPost,
          idUser,
          kategori,
          deskripsi,
          alamat,
          latitude || null,
          longitude || null,
          foto,
        ]
      );
    }
  } catch {
    // Gunakan dbStore
  }

  const newReport = {
    id: `rep-${Date.now()}`,
    ticket: nomorTiket,
    author: req.user?.nama_lengkap || 'Pengguna',
    user: req.user?.username || (req.user?.email ? `@${req.user.email.split('@')[0]}` : '@pengguna'),
    avatar: req.user?.foto_profil || '',
    city: kota,
    area: area || `${kota} Pusat`,
    address: alamat,
    condition: kategori,
    category: kategori,
    caption: deskripsi,
    time: 'Baru saja',
    date: new Date().toISOString(),
    status: 'TERVERIFIKASI',
    badge: 'TERVERIFIKASI',
    photo: foto || 'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85',
    lat: latitude ? Number(latitude) : -0.5022,
    lon: longitude ? Number(longitude) : 117.1536,
    likes: 1,
    comments: [],
  };

  dbStore.addReport(newReport);

  return res.status(201).json({
    nomor_tiket: nomorTiket,
    status: 'TERVERIFIKASI',
    laporan: newReport,
  });
}

// UC-10: Melihat Detail Konten Komunitas
export async function getDetailPostKomunitas(req, res) {
  const { id_post } = req.params;
  const report = dbStore.getReportById(id_post);
  if (report) {
    return res.status(200).json({ detail_post: report });
  }
  return res.status(404).json({
    message: 'Konten tidak ditemukan atau telah dihapus.',
  });
}

// Tambah Komentar pada Post / Laporan
export async function addCommentToPost(req, res) {
  const { id_post } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Komentar tidak boleh kosong.' });
  }

  const commentObj = {
    id: `c-${Date.now()}`,
    author: req.user?.nama_lengkap || 'Pengguna',
    text: text.trim(),
    time: 'Baru saja',
  };

  const updated = dbStore.addReportComment(id_post, commentObj);
  return res.status(201).json({ comment: commentObj, report: updated });
}
