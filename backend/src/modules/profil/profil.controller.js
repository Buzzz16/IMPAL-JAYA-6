/**
 * ============================================================================
 * MODUL BACKEND: KELOLA PROFIL PENGGUNA (UC-11 SKPL-1000)
 * File: backend/src/modules/profil/profil.controller.js
 * ============================================================================
 */

import { query } from '../../config/db.js';
import { dbStore } from '../../data/dbStore.js';

export async function getProfil(req, res) {
  const idAkun = req.user?.id_akun || '11111111-1111-1111-1111-111111111111';
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
      res.locals.dbLog = 'Data profil pengguna dimuat';
      return res.status(200).json({ profil_user: result.rows[0] });
    }
  } catch {
    // Gunakan dbStore
  }

  const user = dbStore.findUserById(idAkun) || dbStore.getUsers()[0];
  return res.status(200).json({ profil_user: user });
}

export async function updateProfil(req, res) {
  const idAkun = req.user?.id_akun || '11111111-1111-1111-1111-111111111111';
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
  } catch {
    // Selesai
  }

  const updated = dbStore.updateUser(idAkun, {
    ...(namaBaru ? { nama_lengkap: namaBaru } : {}),
    ...(username ? { username } : {}),
    ...(umur ? { umur: Number(umur) } : {}),
    ...(lokasi_default ? { lokasi_default } : {}),
    ...(kategori_rentan ? { kategori_rentan } : {}),
    ...(foto_profil ? { foto_profil } : {}),
    ...(peringatan_aqi_100 !== undefined ? { peringatan_aqi_100: Boolean(peringatan_aqi_100) } : {}),
  });

  return res.status(200).json({ message: 'Profil berhasil diperbarui', profil_user: updated });
}
