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
              u.lokasi_default, u.latitude, u.longitude, u.kategori_rentan, u.foto_profil,
              u.username, u.umur, u.peringatan_aqi_100
       FROM akun a
       LEFT JOIN users u ON a.id_akun = u.id_akun
       WHERE a.id_akun = $1`,
      [idAkun]
    );

    if (result && result.rows.length > 0) {
      const row = result.rows[0];
      res.locals.dbLog = 'Data profil pengguna dimuat dari Supabase';
      return res.status(200).json({
        profil_user: {
          ...row,
          username: row.username || `@${(row.email || 'pengguna').split('@')[0]}`,
          umur: row.umur != null ? row.umur : 25,
          peringatan_aqi_100: row.peringatan_aqi_100 ?? false,
          lokasi_default: row.lokasi_default || 'Samarinda',
          kategori_rentan: row.kategori_rentan || 'Umum',
          foto_profil: row.foto_profil || '',
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
  const {
    nama_lengkap,
    nama,
    lokasi_default,
    latitude,
    longitude,
    kategori_rentan,
    foto_profil,
    username,
    umur,
    peringatan_aqi_100,
  } = req.body;

  const namaBaru = (nama_lengkap || nama || '').trim();

  try {
    if (namaBaru) {
      await query(
        'UPDATE akun SET nama_lengkap = $1, updated_at = CURRENT_TIMESTAMP WHERE id_akun = $2',
        [namaBaru, idAkun]
      );
    }

    const lokasiProvided = lokasi_default !== undefined;
    const lokasiVal = lokasiProvided && String(lokasi_default).trim() ? String(lokasi_default).trim() : 'Samarinda';

    const kategoriProvided = kategori_rentan !== undefined;
    const kategoriVal = kategoriProvided && String(kategori_rentan).trim() ? String(kategori_rentan).trim() : 'Umum';

    const fotoProvided = foto_profil !== undefined;
    const fotoVal = fotoProvided && foto_profil ? String(foto_profil).trim() : null;

    const usernameProvided = username !== undefined;
    const usernameVal = usernameProvided && String(username).trim()
      ? (String(username).trim().startsWith('@') ? String(username).trim() : `@${String(username).trim()}`)
      : null;

    const umurProvided = umur !== undefined && umur !== null && umur !== '';
    const umurVal = umurProvided ? Number(umur) : 25;

    const alertProvided = peringatan_aqi_100 !== undefined;
    const alertVal = alertProvided ? Boolean(peringatan_aqi_100) : true;

    const latProvided = latitude != null && !isNaN(Number(latitude));
    const latVal = latProvided ? Number(latitude) : null;

    const lngProvided = longitude != null && !isNaN(Number(longitude));
    const lngVal = lngProvided ? Number(longitude) : null;

    // Gunakan UPSERT dengan conditional update per-kolom
    await query(
      `INSERT INTO users (
         id_akun, lokasi_default, latitude, longitude, kategori_rentan,
         foto_profil, username, umur, peringatan_aqi_100
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id_akun) DO UPDATE
       SET lokasi_default = CASE WHEN $10 THEN EXCLUDED.lokasi_default ELSE users.lokasi_default END,
           latitude = CASE WHEN $11 THEN EXCLUDED.latitude ELSE users.latitude END,
           longitude = CASE WHEN $12 THEN EXCLUDED.longitude ELSE users.longitude END,
           kategori_rentan = CASE WHEN $13 THEN EXCLUDED.kategori_rentan ELSE users.kategori_rentan END,
           foto_profil = CASE WHEN $14 THEN EXCLUDED.foto_profil ELSE users.foto_profil END,
           username = CASE WHEN $15 THEN EXCLUDED.username ELSE users.username END,
           umur = CASE WHEN $16 THEN EXCLUDED.umur ELSE users.umur END,
           peringatan_aqi_100 = CASE WHEN $17 THEN EXCLUDED.peringatan_aqi_100 ELSE users.peringatan_aqi_100 END`,
      [
        idAkun,
        lokasiVal,
        latVal,
        lngVal,
        kategoriVal,
        fotoVal,
        usernameVal,
        umurVal,
        alertVal,
        lokasiProvided,
        latProvided,
        lngProvided,
        kategoriProvided,
        fotoProvided,
        usernameProvided,
        umurProvided,
        alertProvided,
      ]
    );

    const checkRes = await query(
      `SELECT a.id_akun, a.nama_lengkap, a.email, a.role,
              u.lokasi_default, u.latitude, u.longitude, u.kategori_rentan, u.foto_profil,
              u.username, u.umur, u.peringatan_aqi_100
       FROM akun a
       LEFT JOIN users u ON a.id_akun = u.id_akun
       WHERE a.id_akun = $1`,
      [idAkun]
    );

    const updatedRow = checkRes?.rows?.[0] || {};
    res.locals.dbLog = 'Data profil pengguna diperbarui di Supabase';

    return res.status(200).json({
      message: 'Profil berhasil diperbarui di Supabase',
      profil_user: {
        ...updatedRow,
        username: updatedRow.username || `@${(updatedRow.email || 'pengguna').split('@')[0]}`,
        umur: updatedRow.umur != null ? updatedRow.umur : 25,
        peringatan_aqi_100: updatedRow.peringatan_aqi_100 ?? false,
        foto_profil: updatedRow.foto_profil || '',
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui profil di Supabase.', error: err.message });
  }
}
