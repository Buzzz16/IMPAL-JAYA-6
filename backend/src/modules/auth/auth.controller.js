/**
 * ============================================================================
 * MODUL BACKEND: AUTENTIKASI (UC-01 LOGIN & UC-02 REGISTRASI)
 * File: backend/src/modules/auth/auth.controller.js
 * ============================================================================
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'polusee_super_secret_jwt_key_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// UC-01: Login Sistem (User & Admin)
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan kata sandi wajib diisi.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let account = null;

    try {
      const result = await query(
        `SELECT a.*, u.lokasi_default, u.latitude, u.longitude, u.kategori_rentan, u.foto_profil
         FROM akun a
         LEFT JOIN users u ON a.id_akun = u.id_akun
         WHERE LOWER(TRIM(a.email)) = $1`,
        [cleanEmail]
      );
      if (result && result.rows.length > 0) {
        account = result.rows[0];
      }
    } catch (err) {
      return res.status(500).json({ message: 'Gagal terhubung ke database Supabase.', error: err.message });
    }

    if (!account) {
      return res.status(401).json({
        message: 'Akun tidak ditemukan. Silakan periksa kembali email Anda atau lakukan registrasi.',
      });
    }

    // Verifikasi kata sandi dengan bcrypt
    let isPasswordValid = false;
    if (account.password_hash) {
      try {
        isPasswordValid = await bcrypt.compare(password, account.password_hash);
      } catch {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Kata sandi salah. Silakan coba lagi.',
      });
    }

    const userRole = account.role || 'USER';

    const token = jwt.sign(
      {
        id_akun: account.id_akun,
        email: account.email,
        role: userRole,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      token,
      role: userRole,
      profil: {
        id_akun: account.id_akun,
        nama_lengkap: account.nama_lengkap,
        email: account.email,
        role: userRole,
        lokasi_default: account.lokasi_default || 'Samarinda',
        kategori_rentan: account.kategori_rentan || 'Umum',
        foto_profil: account.foto_profil || '',
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memproses login.', error: err.message });
  }
}

// UC-02: Registrasi Akun Baru (<<include>> Login)
export async function register(req, res) {
  try {
    const { nama, email, password, konfirmasi, lokasi_default } = req.body;
    if (!nama || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Nama lengkap, email, dan kata sandi wajib diisi.' });
    }
    if (konfirmasi && password !== konfirmasi) {
      return res
        .status(400)
        .json({ message: 'Konfirmasi kata sandi belum cocok.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    try {
      const check = await query('SELECT id_akun FROM akun WHERE LOWER(TRIM(email)) = $1', [cleanEmail]);
      if (check && check.rows.length > 0) {
        return res
          .status(409)
          .json({ message: 'Email sudah terdaftar. Silakan login atau gunakan email lain.' });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Gagal memeriksa ketersediaan email di Supabase.', error: err.message });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertAkun = await query(
      `INSERT INTO akun (nama_lengkap, email, password_hash, role, status_aktif)
       VALUES ($1, $2, $3, 'USER', TRUE)
       RETURNING id_akun, nama_lengkap, email, role`,
      [nama.trim(), cleanEmail, passwordHash]
    );

    if (!insertAkun || insertAkun.rows.length === 0) {
      return res.status(500).json({ message: 'Gagal membuat akun di database Supabase.' });
    }

    const newAccount = insertAkun.rows[0];

    await query(
      `INSERT INTO users (id_akun, lokasi_default, kategori_rentan)
       VALUES ($1, $2, 'Umum')`,
      [newAccount.id_akun, lokasi_default || 'Samarinda']
    );

    // <<include>> UC-01 Login: Terbitkan JWT Token sesi langsung
    const token = jwt.sign(
      {
        id_akun: newAccount.id_akun,
        email: newAccount.email,
        role: newAccount.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      token,
      role: 'USER',
      user: {
        id_akun: newAccount.id_akun,
        nama_lengkap: newAccount.nama_lengkap,
        email: newAccount.email,
        role: 'USER',
        lokasi_default: lokasi_default || 'Samarinda',
        kategori_rentan: 'Umum',
      },
    });
  } catch (err) {
    return res
      .status(500)
<<<<<<< Updated upstream
      .json({ message: 'Gagal melakukan registrasi akun.', error: err.message });
=======
      .json({ message: 'Gagal melakukan registrasi akun di Supabase.', error: err.message });
>>>>>>> Stashed changes
  }
}
