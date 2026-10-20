/**
 * ============================================================================
 * STATE & SERVICE AUTENTIKASI / PROFIL PENGGUNA (FR-01, FR-02, FR-11 SKPL-1000)
 * File: src/features/auth/authStore.js
 * ============================================================================
 */

import { reactive } from 'vue';
import { apiRequest, setStoredSession, clearStoredSession } from '../../services/apiClient';

export const userProfileStore = reactive({
  id_akun: 'user-demo-001',
  nama_lengkap: 'Aditya Nugraha',
  username: '@adityanugraha',
  email: 'aditya@polusee.id',
  umur: 28,
  lokasi_default: 'Samarinda',
  kategori_rentan: 'Umum',
  peringatan_aqi_100: true,
  foto_profil:
    'https://images.unsplash.com/photo-1630678334641-0c5339dfd1a7?auto=format&fit=crop&w=500&q=85',
  role: 'USER',
});

/**
 * Autentikasi Login (UC-01 SKPL: POST /api/auth/login)
 * Mendukung koneksi langsung ke Backend Express.js + PostgreSQL maupun mode simulasi.
 */
export async function loginAccount(email, password) {
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res && res.token) {
      setStoredSession(res.token, res.profil);
      if (res.profil) {
        Object.assign(userProfileStore, res.profil);
      }
      return { success: true, role: res.role || 'USER', fromBackend: true };
    }
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      throw err;
    }
    // Jika server Express belum dijalankan, lanjutkan dengan sesi demo lokal
  }
  return { success: true, role: 'USER', fromBackend: false };
}

/**
 * Registrasi Akun Baru (UC-02 SKPL: POST /api/auth/register)
 */
export async function registerAccount({ name, email, password, confirmPassword, lokasi_default }) {
  try {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nama: name,
        email,
        password,
        konfirmasi: confirmPassword,
        lokasi_default: lokasi_default || 'Samarinda',
      }),
    });
    if (res && res.token) {
      setStoredSession(res.token, res.user);
      if (res.user) {
        Object.assign(userProfileStore, res.user);
      }
      return { success: true, fromBackend: true };
    }
  } catch (err) {
    if (err.status === 409 || err.status === 400) {
      throw err;
    }
  }

  // Simpan ke store lokal pada mode demo
  if (name) {
    userProfileStore.nama_lengkap = name;
  }
  if (email) {
    userProfileStore.email = email;
  }
  if (lokasi_default) {
    userProfileStore.lokasi_default = lokasi_default;
  }
  return { success: true, fromBackend: false };
}

/**
 * Update Profil Pengguna (UC-11 SKPL: PUT /api/profile)
 */
export async function updateProfileData(payload) {
  Object.assign(userProfileStore, payload);
  try {
    await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch {
    // Tetap tersimpan di sesi lokal apabila backend belum aktif
  }
  return userProfileStore;
}

export function logoutAccount() {
  clearStoredSession();
}
