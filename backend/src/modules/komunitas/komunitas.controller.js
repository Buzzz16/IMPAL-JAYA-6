/**
 * ============================================================================
 * MODUL BACKEND: FORUM KOMUNITAS & LAPOR KEJADIAN POLUSI (UC-08, UC-09, UC-10)
 * File: backend/src/modules/komunitas/komunitas.controller.js
 * ============================================================================
 */

import { query } from '../../config/db.js';

function mapSupabaseRowToReport(row) {
  const photo = row.url_foto_bukti || row.media_lampiran || '';
  return {
    id: `post-${row.id_post}`,
    id_post: row.id_post,
    ticket: row.nomor_tiket || `#TKT-${row.id_post}`,
    author: row.nama_lengkap || 'Pengguna PoluSee',
    user: `@${(row.nama_lengkap || 'pengguna').toLowerCase().replace(/\s+/g, '')}`,
    avatar: row.foto_profil || 'https://images.unsplash.com/photo-1630678334641-0c5339dfd1a7?auto=format&fit=crop&w=500&q=85',
    city: row.alamat_lokasi ? (row.alamat_lokasi.split(',').pop()?.trim() || 'Samarinda') : 'Samarinda',
    area: row.alamat_lokasi || 'Samarinda',
    address: row.alamat_lokasi || 'Samarinda',
    condition: row.kategori_polusi || 'Asap & Debu',
    category: row.kategori_polusi || 'Asap & Debu',
    caption: row.isi_konten || row.judul_post || '',
    time: row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID') : 'Baru saja',
    date: row.created_at || new Date().toISOString(),
    status: row.status_verifikasi || 'TERVERIFIKASI',
    badge: row.status_verifikasi || 'TERVERIFIKASI',
    photo: photo || 'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85',
    image: photo || 'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85',
    url_foto_bukti: photo,
    lat: row.latitude ? Number(row.latitude) : -0.5022,
    lon: row.longitude ? Number(row.longitude) : 117.1536,
    likes: 1,
    comments: [],
  };
}

// UC-08: Ambil Feed Komunitas langsung dari Supabase Database
export async function getFeedKomunitas(_req, res) {
  try {
    const result = await query(
      `SELECT p.*, l.id_laporan, l.nomor_tiket, l.kategori_polusi, l.deskripsi_kejadian,
              l.alamat_lokasi, l.latitude, l.longitude, l.url_foto_bukti, l.status_verifikasi,
              COALESCE(a.nama_lengkap, 'Pengguna PoluSee') as nama_lengkap,
              u.foto_profil
       FROM post_komunitas p
       LEFT JOIN laporan_polusi l ON p.id_post = l.id_post
       LEFT JOIN akun a ON p.id_user = a.id_akun
       LEFT JOIN users u ON p.id_user = u.id_akun
       WHERE p.status_moderasi = 'AKTIF'
       ORDER BY p.created_at DESC`
    );
    const count = result?.rows?.length || 0;
    console.log(
      `\x1b[36m[DB Supabase]\x1b[0m 📥 GET /api/komunitas/feed -> Berhasil query PostgreSQL Supabase (Ditemukan ${count} postingan).`
    );
    const reports = (result?.rows || []).map(mapSupabaseRowToReport);
    return res.status(200).json({
      feed_komunitas: reports,
      reports: reports,
    });
  } catch (err) {
    console.error(
      `\x1b[31m[DB Supabase Error]\x1b[0m ❌ GET /api/komunitas/feed -> Gagal query PostgreSQL:`,
      err.message
    );
    return res.status(500).json({
      message: 'Gagal mengambil feed komunitas dari database.',
      feed_komunitas: [],
      reports: [],
    });
  }
}

// UC-08: Buat Postingan Diskusi Baru
export async function createPostKomunitas(req, res) {
  try {
    const { judul_post, isi_konten, media_lampiran } = req.body;
    let idUser = req.user?.id_akun || '11111111-1111-1111-1111-111111111111';

    if (!judul_post || !isi_konten) {
      return res.status(400).json({ message: 'Judul dan isi post wajib diisi.' });
    }

    try {
      const checkUser = await query('SELECT id_akun FROM users WHERE id_akun = $1', [idUser]);
      if (!checkUser || checkUser.rows.length === 0) {
        await query(
          'INSERT INTO users (id_akun, lokasi_default) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [idUser, 'Samarinda']
        );
      }
    } catch {
      idUser = '11111111-1111-1111-1111-111111111111';
    }

    const insertRes = await query(
      `INSERT INTO post_komunitas (id_user, judul_post, isi_konten, media_lampiran, status_moderasi)
       VALUES ($1, $2, $3, $4, 'AKTIF')
       RETURNING *`,
      [idUser, judul_post.trim(), isi_konten.trim(), media_lampiran || null]
    );

    if (insertRes && insertRes.rows.length > 0) {
      return res.status(201).json({ post_baru: insertRes.rows[0] });
    }
  } catch (err) {
    console.error('[Create Post Error]:', err.message);
    return res.status(500).json({ message: 'Gagal membuat post di database' });
  }
}

// UC-09: Lapor Kejadian Polusi (Tersimpan ke Supabase Cloud)
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

  let idUser = req.user?.id_akun || '11111111-1111-1111-1111-111111111111';
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
    // Pastikan user ada di tabel users agar foreign key relasi tidak gagal
    const checkUser = await query('SELECT id_akun FROM users WHERE id_akun = $1', [idUser]);
    if (!checkUser || checkUser.rows.length === 0) {
      await query(
        'INSERT INTO users (id_akun, lokasi_default) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [idUser, kota]
      );
    }
  } catch {
    idUser = '11111111-1111-1111-1111-111111111111';
  }

  try {
    const postRes = await query(
      `INSERT INTO post_komunitas (id_user, judul_post, isi_konten, media_lampiran, status_moderasi)
       VALUES ($1, $2, $3, $4, 'AKTIF')
       RETURNING *`,
      [idUser, deskripsi.slice(0, 140), deskripsi, foto]
    );

    if (postRes && postRes.rows.length > 0) {
      const newPost = postRes.rows[0];
      const laporRes = await query(
        `INSERT INTO laporan_polusi (
           nomor_tiket, id_post, id_user, kategori_polusi, deskripsi_kejadian,
           alamat_lokasi, latitude, longitude, url_foto_bukti, status_verifikasi
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'TERVERIFIKASI')
         RETURNING *`,
        [
          nomorTiket,
          newPost.id_post,
          idUser,
          kategori,
          deskripsi,
          alamat,
          latitude || null,
          longitude || null,
          foto,
        ]
      );

      const fullRow = {
        ...newPost,
        ...(laporRes.rows[0] || {}),
        nama_lengkap: req.user?.nama_lengkap || 'Pengguna PoluSee',
        foto_profil: req.user?.foto_profil || '',
      };
      const mappedReport = mapSupabaseRowToReport(fullRow);
      console.log(`[Komunitas Supabase]: Laporan ${nomorTiket} berhasil disimpan ke database Supabase!`);

      return res.status(201).json({
        nomor_tiket: nomorTiket,
        status: 'TERVERIFIKASI',
        laporan: mappedReport,
        report: mappedReport,
      });
    }
  } catch (err) {
    console.error('[Komunitas Error]: Gagal simpan ke Supabase:', err.message);
    return res.status(500).json({ message: 'Gagal menyimpan laporan ke database Supabase', error: err.message });
  }
}

// UC-10: Melihat Detail Konten Komunitas dari Database
export async function getDetailPostKomunitas(req, res) {
  try {
    const { id_post } = req.params;
    const cleanId = String(id_post).replace(/^post-/, '').replace(/^rep-/, '');
    const result = await query(
      `SELECT p.*, l.id_laporan, l.nomor_tiket, l.kategori_polusi, l.deskripsi_kejadian,
              l.alamat_lokasi, l.latitude, l.longitude, l.url_foto_bukti, l.status_verifikasi,
              COALESCE(a.nama_lengkap, 'Pengguna PoluSee') as nama_lengkap,
              u.foto_profil
       FROM post_komunitas p
       LEFT JOIN laporan_polusi l ON p.id_post = l.id_post
       LEFT JOIN akun a ON p.id_user = a.id_akun
       LEFT JOIN users u ON p.id_user = u.id_akun
       WHERE p.id_post = $1 OR l.nomor_tiket = $2
       LIMIT 1`,
      [isNaN(Number(cleanId)) ? -1 : Number(cleanId), String(id_post)]
    );

    if (result && result.rows.length > 0) {
      return res.status(200).json({ detail_post: mapSupabaseRowToReport(result.rows[0]) });
    }
    return res.status(404).json({ message: 'Konten tidak ditemukan atau telah dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil detail konten', error: err.message });
  }
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
    author: req.user?.nama_lengkap || 'Pengguna PoluSee',
    text: text.trim(),
    time: 'Baru saja',
  };

  return res.status(201).json({ comment: commentObj });
}
