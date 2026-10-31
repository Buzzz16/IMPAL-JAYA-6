/**
 * ============================================================================
 * MODUL BACKEND: KELOLA PROFIL PENGGUNA (UC-11 SKPL-1000)
 * File: backend/src/modules/profil/profil.controller.js
 * ============================================================================
 */

import { query } from '../../config/db.js';

export async function getProfil(req, res) {
  const idAkun = req.user?.id_akun;
  if (!idAkun) {
    return res.status(200).json({ profil_user: null });
  }

  try {
    const result = await query(
      `SELECT a.id_akun, a.nama_lengkap, a.email, a.role,
              u.lokasi_default, u.latitude, u.longitude, u.kategori_rentan, u.foto_profil
       FROM akun a
       LEFT JOIN users u ON a.id_akun = u.id_akun
       WHERE a.id_akun = $1`,
      [idAkun]
    );

    if (result && result.rows.length > 0) {
      const row = result.rows[0];
      res.locals.dbLog = 'Data profil pengguna dimuat';
      return res.status(200).json({
        profil_user: {
          ...row,
          username: row.username || `@${(row.email || 'pengguna').split('@')[0]}`,
          umur: row.umur || 25,
          peringatan_aqi_100: row.peringatan_aqi_100 ?? false,
        },
      });
    }
    return res.status(404).json({ message: 'Profil pengguna tidak ditemukan di database.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat profil pengguna dari Supabase.', error: err.message });
  }

  
}

export async function updateProfil(req, res) {
  const idAkun = req.user?.id_akun;
  if (!idAkun) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu untuk memperbarui profil.' });
  }
  const { nama_lengkap, nama, lokasi_default, latitude, longitude, kategori_rentan, foto_profil, username, umur, peringatan_aqi_100 } = req.body;
  const namaBaru = (nama_lengkap || nama || '').trim();

  try {
    if (namaBaru) {
      await query(
        'UPDATE akun SET nama_lengkap = $1, updated_at = CURRENT_TIMESTAMP WHERE id_akun = $2',
        [namaBaru, idAkun]
      );
    }

    await query(
      `UPDATE users
       SET lokasi_default = COALESCE($1, lokasi_default),
           latitude = COALESCE($2, latitude),
           longitude = COALESCE($3, longitude),
           kategori_rentan = COALESCE($4, kategori_rentan),
           foto_profil = COALESCE($5, foto_profil)
       WHERE id_akun = $6`,
      [
        lokasi_default || null,
        latitude != null ? Number(latitude) : null,
        longitude != null ? Number(longitude) : null,
        kategori_rentan || null,
        foto_profil || null,
        idAkun
      ]
    );

    const checkRes = await query(
      `SELECT a.id_akun, a.nama_lengkap, a.email, a.role,
              u.lokasi_default, u.latitude, u.longitude, u.kategori_rentan, u.foto_profil
       FROM akun a
       LEFT JOIN users u ON a.id_akun = u.id_akun
       WHERE a.id_akun = $1`,
      [idAkun]
    );

    return res.status(200).json({
      message: 'Profil berhasil diperbarui di Supabase',
      profil_user: checkRes?.rows?.[0] || {}
    });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui profil di Supabase.', error: err.message });
  }
}
