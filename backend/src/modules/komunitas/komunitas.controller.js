/**
 * ============================================================================
 * MODUL BACKEND: FORUM KOMUNITAS & LAPOR KEJADIAN POLUSI (UC-08, UC-09, UC-10)
 * File: backend/src/modules/komunitas/komunitas.controller.js
 * ============================================================================
 */

import { query } from '../../config/db.js';


function mapSupabaseRowToReport(row) {
  const photo = row.url_foto_bukti || row.media_lampiran || '';
  const parsedLikes = typeof row.likes_count === 'number' ? row.likes_count : parseInt(row.likes_count || '0', 10);
  const parsedComments = Array.isArray(row.comments) ? row.comments : [];
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
    likes: parsedLikes,
    liked: Boolean(row.liked),
    comments: parsedComments,
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const feedCache = new Map();
const FEED_CACHE_TTL = 30000; // 30 detik TTL

export function invalidateFeedCache() {
  feedCache.clear();
}

export function isValidUuid(id) {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

async function getValidDbUserId(id) {
  if (!isValidUuid(id)) return null;
  try {
    const res = await query('SELECT id_akun FROM users WHERE id_akun = $1', [id.trim()]);
    if (res && res.rows.length > 0) return id.trim();
  } catch {
    return null;
  }
  return null;
}

// UC-08: Ambil Feed Komunitas langsung dari Supabase Database (termasuk Like & Komentar)
export async function getFeedKomunitas(req, res) {
  try {
    const rawUserId = req.user?.id_akun || null;
    const currentUserId = isValidUuid(rawUserId) ? rawUserId : null;
    const currentClientId = req.headers['x-client-id'] || req.query.client_id || null;

    const cacheKey = `${currentUserId || 'anon'}_${currentClientId || 'anon'}`;
    const cached = feedCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < FEED_CACHE_TTL)) {
      return res.status(200).json(cached.payload);
    }

    const result = await query(
      `SELECT p.*, l.id_laporan, l.nomor_tiket, l.kategori_polusi, l.deskripsi_kejadian,
              l.alamat_lokasi, l.latitude, l.longitude, l.url_foto_bukti, l.status_verifikasi,
              COALESCE(a.nama_lengkap, 'Pengguna PoluSee') as nama_lengkap,
              u.foto_profil,
              COALESCE(p.jumlah_like, 0) AS likes_count,
              (
                CASE WHEN (
                  ($1::text IS NOT NULL AND $1::text = ANY(p.liked_by))
                  OR ($2::text IS NOT NULL AND $2::text = ANY(p.liked_by))
                ) THEN true ELSE false END
              ) AS liked,
              (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'id', CONCAT('c-', kp.id_komentar),
                      'id_komentar', kp.id_komentar,
                      'name', COALESCE(kp.nama_pengguna, a_comm.nama_lengkap, 'Pengguna PoluSee'),
                      'author', COALESCE(kp.nama_pengguna, a_comm.nama_lengkap, 'Pengguna PoluSee'),
                      'text', kp.isi_komentar,
                      'isi', kp.isi_komentar,
                      'created_at', kp.created_at,
                      'time', TO_CHAR(kp.created_at, 'DD/MM/YYYY HH24:MI')
                    ) ORDER BY kp.created_at ASC
                  ),
                  '[]'::json
                )
                FROM komentar_post kp
                LEFT JOIN akun a_comm ON kp.id_user = a_comm.id_akun
                WHERE kp.id_post = p.id_post
              ) AS comments
       FROM post_komunitas p
       LEFT JOIN laporan_polusi l ON p.id_post = l.id_post
       LEFT JOIN akun a ON p.id_user = a.id_akun
       LEFT JOIN users u ON p.id_user = u.id_akun
       WHERE p.status_moderasi = 'AKTIF'
       ORDER BY p.created_at DESC`,
      [currentUserId, currentClientId]
    );
    const count = result?.rows?.length || 0;
    res.locals.dbLog = `Ditemukan ${count} postingan`;
    const reports = (result?.rows || []).map(mapSupabaseRowToReport);
    const responsePayload = {
      feed_komunitas: reports,
      reports: reports,
    };
    feedCache.set(cacheKey, { timestamp: Date.now(), payload: responsePayload });
    return res.status(200).json(responsePayload);
  } catch (err) {
    res.locals.dbLog = `Gagal query: ${err.message}`;
    return res.status(500).json({ message: 'Gagal memuat feed komunitas dari database Supabase.', error: err.message });
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
      `INSERT INTO post_komunitas (id_user, judul_post, isi_konten, media_lampiran, status_moderasi, jumlah_like, liked_by)
       VALUES ($1, $2, $3, $4, 'AKTIF', 0, '{}')
       RETURNING *`,
      [idUser, judul_post.trim(), isi_konten.trim(), media_lampiran || null]
    );

    if (insertRes && insertRes.rows.length > 0) {
      invalidateFeedCache();
      res.locals.dbLog = `Post #${insertRes.rows[0].id_post} berhasil dibuat`;
      return res.status(201).json({ post_baru: insertRes.rows[0] });
    }
  } catch (err) {
    res.locals.dbLog = `Gagal buat post: ${err.message}`;
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
      `INSERT INTO post_komunitas (id_user, judul_post, isi_konten, media_lampiran, status_moderasi, jumlah_like, liked_by)
       VALUES ($1, $2, $3, $4, 'AKTIF', 0, '{}')
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
        likes_count: 0,
        liked: false,
        comments: [],
      };
      const mappedReport = mapSupabaseRowToReport(fullRow);
      invalidateFeedCache();
      res.locals.dbLog = `Laporan ${nomorTiket} berhasil disimpan`;

      return res.status(201).json({
        nomor_tiket: nomorTiket,
        status: 'TERVERIFIKASI',
        laporan: mappedReport,
        report: mappedReport,
      });
    }
  } catch (err) {
    res.locals.dbLog = `Gagal simpan laporan: ${err.message}`;
    return res.status(500).json({ message: 'Gagal menyimpan laporan ke database Supabase', error: err.message });
  }
}

// UC-10: Melihat Detail Konten Komunitas dari Database (termasuk Like & Komentar)
export async function getDetailPostKomunitas(req, res) {
  try {
    const { id_post } = req.params;
    const cleanId = String(id_post).replace(/^post-/, '').replace(/^rep-/, '');
    const rawUserId = req.user?.id_akun || null;
    const currentUserId = isValidUuid(rawUserId) ? rawUserId : null;
    const currentClientId = req.headers['x-client-id'] || req.query.client_id || null;

    const result = await query(
      `SELECT p.*, l.id_laporan, l.nomor_tiket, l.kategori_polusi, l.deskripsi_kejadian,
              l.alamat_lokasi, l.latitude, l.longitude, l.url_foto_bukti, l.status_verifikasi,
              COALESCE(a.nama_lengkap, 'Pengguna PoluSee') as nama_lengkap,
              u.foto_profil,
              COALESCE(p.jumlah_like, 0) AS likes_count,
              (
                CASE WHEN (
                  ($1::text IS NOT NULL AND $1::text = ANY(p.liked_by))
                  OR ($2::text IS NOT NULL AND $2::text = ANY(p.liked_by))
                ) THEN true ELSE false END
              ) AS liked,
              (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'id', CONCAT('c-', kp.id_komentar),
                      'id_komentar', kp.id_komentar,
                      'name', COALESCE(kp.nama_pengguna, a_comm.nama_lengkap, 'Pengguna PoluSee'),
                      'author', COALESCE(kp.nama_pengguna, a_comm.nama_lengkap, 'Pengguna PoluSee'),
                      'text', kp.isi_komentar,
                      'isi', kp.isi_komentar,
                      'created_at', kp.created_at,
                      'time', TO_CHAR(kp.created_at, 'DD/MM/YYYY HH24:MI')
                    ) ORDER BY kp.created_at ASC
                  ),
                  '[]'::json
                )
                FROM komentar_post kp
                LEFT JOIN akun a_comm ON kp.id_user = a_comm.id_akun
                WHERE kp.id_post = p.id_post
              ) AS comments
       FROM post_komunitas p
       LEFT JOIN laporan_polusi l ON p.id_post = l.id_post
       LEFT JOIN akun a ON p.id_user = a.id_akun
       LEFT JOIN users u ON p.id_user = u.id_akun
       WHERE p.id_post = $3 OR l.nomor_tiket = $4
       LIMIT 1`,
      [
        currentUserId,
        currentClientId,
        isNaN(Number(cleanId)) ? -1 : Number(cleanId),
        String(id_post),
      ]
    );

    if (result && result.rows.length > 0) {
      res.locals.dbLog = `Detail post #${cleanId} ditemukan`;
      return res.status(200).json({ detail_post: mapSupabaseRowToReport(result.rows[0]) });
    }
    return res.status(404).json({ message: 'Konten tidak ditemukan atau telah dihapus.' });
  } catch (err) {
    res.locals.dbLog = `Gagal ambil detail: ${err.message}`;
    return res.status(500).json({ message: 'Gagal mengambil detail konten', error: err.message });
  }
}

// Toggle Like pada Post Komunitas langsung di dalam tabel post_komunitas
export async function toggleLikePost(req, res) {
  try {
    const { id_post } = req.params;
    const cleanId = String(id_post).replace(/^post-/, '').replace(/^rep-/, '');
    const postId = Number(cleanId);

    if (isNaN(postId)) {
      return res.status(400).json({ message: 'ID post tidak valid.' });
    }

    const rawUserId = req.user?.id_akun || null;
    const currentUserId = isValidUuid(rawUserId) ? rawUserId : null;
    const clientId = req.body?.client_id || req.headers['x-client-id'] || 'client-anonymous';
    const userIdentifier = currentUserId || clientId;

    // Pastikan post ada dan ambil liked_by & jumlah_like saat ini
    const postCheck = await query(
      'SELECT id_post, jumlah_like, liked_by FROM post_komunitas WHERE id_post = $1',
      [postId]
    );
    if (!postCheck || postCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Post tidak ditemukan.' });
    }

    const currentPost = postCheck.rows[0];
    const currentLikedBy = Array.isArray(currentPost.liked_by) ? currentPost.liked_by : [];
    const isAlreadyLiked = currentLikedBy.includes(userIdentifier);

    let updatedRes;
    let liked = false;

    if (isAlreadyLiked) {
      // BATALKAN SUKA (UNLIKE): hapus userIdentifier dari liked_by & kurangi jumlah_like
      updatedRes = await query(
        `UPDATE post_komunitas
         SET liked_by = array_remove(liked_by, $1),
             jumlah_like = GREATEST(0, jumlah_like - 1)
         WHERE id_post = $2
         RETURNING jumlah_like, liked_by`,
        [userIdentifier, postId]
      );
      liked = false;
    } else {
      // SUKAI POST (LIKE): tambahkan userIdentifier ke liked_by & tambah jumlah_like
      updatedRes = await query(
        `UPDATE post_komunitas
         SET liked_by = array_append(liked_by, $1),
             jumlah_like = jumlah_like + 1
         WHERE id_post = $2
         RETURNING jumlah_like, liked_by`,
        [userIdentifier, postId]
      );
      liked = true;
    }

    const totalLikes = updatedRes.rows[0]?.jumlah_like || 0;
    res.locals.dbLog = `Post #${postId} ${liked ? 'disukai' : 'batal disukai'} (${totalLikes} suka)`;

    invalidateFeedCache();
    return res.status(200).json({
      success: true,
      liked,
      likes: totalLikes,
      id_post: postId,
    });
  } catch (err) {
    res.locals.dbLog = `Gagal update like: ${err.message}`;
    return res.status(500).json({
      message: 'Gagal memperbarui status like di database Supabase.',
      error: err.message,
    });
  }
}

// Tambah Komentar pada Post Komunitas / Laporan ke Supabase
export async function addCommentToPost(req, res) {
  try {
    const { id_post } = req.params;
    const cleanId = String(id_post).replace(/^post-/, '').replace(/^rep-/, '');
    const postId = Number(cleanId);

    if (isNaN(postId)) {
      return res.status(400).json({ message: 'ID post tidak valid.' });
    }

    const { text, isi_komentar, name, author } = req.body;
    const isi = (text || isi_komentar || '').trim();
    if (!isi) {
      return res.status(400).json({ message: 'Komentar tidak boleh kosong.' });
    }

    // Pastikan post ada
    const postCheck = await query('SELECT id_post FROM post_komunitas WHERE id_post = $1', [postId]);
    if (!postCheck || postCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Post tidak ditemukan.' });
    }

    const rawUserId = req.user?.id_akun || null;
    const currentUserId = await getValidDbUserId(rawUserId);
    let authorName = (name || author || req.user?.nama_lengkap || '').trim();

    if (!authorName) {
      authorName = currentUserId ? 'Pengguna PoluSee' : 'Warga Peduli';
    }

    const insertRes = await query(
      `INSERT INTO komentar_post (id_post, id_user, nama_pengguna, isi_komentar)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [postId, currentUserId, authorName, isi]
    );

    const saved = insertRes.rows[0];
    const commentObj = {
      id: `c-${saved.id_komentar}`,
      id_komentar: saved.id_komentar,
      name: saved.nama_pengguna || authorName,
      author: saved.nama_pengguna || authorName,
      text: saved.isi_komentar,
      isi: saved.isi_komentar,
      created_at: saved.created_at,
      time: 'Baru saja',
    };

    res.locals.dbLog = `Komentar baru pada post #${postId} oleh "${commentObj.name}"`;

    // Ambil seluruh komentar post ini dari Supabase
    const allCommentsRes = await query(
      `SELECT kp.*, COALESCE(kp.nama_pengguna, a.nama_lengkap, 'Pengguna PoluSee') as display_author
       FROM komentar_post kp
       LEFT JOIN akun a ON kp.id_user = a.id_akun
       WHERE kp.id_post = $1
       ORDER BY kp.created_at ASC`,
      [postId]
    );

    const allComments = (allCommentsRes.rows || []).map((row) => ({
      id: `c-${row.id_komentar}`,
      id_komentar: row.id_komentar,
      name: row.display_author || row.nama_pengguna || 'Pengguna PoluSee',
      author: row.display_author || row.nama_pengguna || 'Pengguna PoluSee',
      text: row.isi_komentar,
      isi: row.isi_komentar,
      created_at: row.created_at,
      time: new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }));

    invalidateFeedCache();
    return res.status(201).json({
      success: true,
      comment: commentObj,
      comments: allComments,
      total_comments: allComments.length,
    });
  } catch (err) {
    res.locals.dbLog = `Gagal tambah komentar: ${err.message}`;
    return res.status(500).json({
      message: 'Gagal menambahkan komentar ke database Supabase.',
      error: err.message,
    });
  }
}
