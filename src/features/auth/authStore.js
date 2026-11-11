/**
 * ============================================================================
 * STATE & SERVICE AUTENTIKASI / PROFIL PENGGUNA (FR-01, FR-02, FR-11 SKPL-1000)
 * File: src/features/auth/authStore.js
 * ============================================================================
 */

import { reactive, watch } from 'vue';
import {
  apiRequest,
  setStoredSession,
  clearStoredSession,
  getStoredUser,
  saveStoredUser,
} from '../../services/apiClient';

function getInitialProfile() {
  const storedUser = getStoredUser();
  if (storedUser && (storedUser.email || storedUser.nama_lengkap || storedUser.id_akun)) {
    return {
      id_akun: storedUser.id_akun || '',
      nama_lengkap: storedUser.nama_lengkap || '',
      username: storedUser.username || '',
      email: storedUser.email || '',
      umur: storedUser.umur ?? null,
      lokasi_default: storedUser.lokasi_default || 'Samarinda',
      kategori_rentan: storedUser.kategori_rentan || 'Umum',
      peringatan_aqi_100: storedUser.peringatan_aqi_100 ?? false,
      foto_profil: storedUser.foto_profil || '',
      role: storedUser.role || '',
    };
  }

  return {
    id_akun: '',
    nama_lengkap: '',
    username: '',
    email: '',
    umur: null,
    lokasi_default: 'Samarinda',
    kategori_rentan: 'Umum',
    peringatan_aqi_100: false,
    foto_profil: '',
    role: '',
  };
}

export const userProfileStore = reactive(getInitialProfile());

watch(
  userProfileStore,
  (val) => {
    saveStoredUser(val);
  },
  { deep: true }
);

/**
 * Autentikasi Login (UC-01 SKPL: POST /api/auth/login)
 * Terhubung 100% ke Backend Express.js + PostgreSQL Supabase (tanpa simulasi lokal).
 */
export async function loginAccount(email, password) {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res && res.token) {
    const profilData = res.profil || res.user;
    if (profilData) {
      Object.assign(userProfileStore, profilData);
    }
    setStoredSession(res.token, userProfileStore);
    return {
      success: true,
      role: res.role || userProfileStore.role || 'USER',
      fromBackend: true,
    };
  }
  throw new Error('Gagal melakukan autentikasi ke database Supabase.');
}

/**
 * Registrasi Akun Baru (UC-02 SKPL: POST /api/auth/register)
 * Terhubung 100% ke Backend Express.js + PostgreSQL Supabase (tanpa simulasi lokal).
 */
export async function registerAccount({ name, email, password, confirmPassword, lokasi_default }) {
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
    const userData = res.user || res.profil;
    if (userData) {
      Object.assign(userProfileStore, userData);
    }
    setStoredSession(res.token, userProfileStore);
    return { success: true, fromBackend: true };
  }
  throw new Error('Gagal mendaftarkan akun ke database Supabase.');
}

/**
 * Update Profil Pengguna (UC-11 SKPL: PUT /api/profile)
 */
export async function updateProfileData(payload) {
  try {
    const res = await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res && res.profil_user) {
      Object.assign(userProfileStore, payload, res.profil_user);
      saveStoredUser(userProfileStore);
    }
    return userProfileStore;
  } catch (err) {
    console.error('[authStore] Gagal memperbarui profil ke Supabase:', err);
    throw err;
  }
}

export async function forgotPasswordAccount({ email, newPassword, confirmPassword }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (newPassword || '').trim();

  const res = await apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({
      email: cleanEmail,
      password: cleanPassword,
      newPassword: cleanPassword,
      confirmPassword,
    }),
  });
  return {
    success: true,
    message:
      res.message || 'Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.',
  };
}

export function logoutAccount() {
  clearStoredSession();
  Object.assign(userProfileStore, {
    id_akun: '',
    nama_lengkap: '',
    username: '',
    email: '',
    umur: null,
    lokasi_default: 'Samarinda',
    kategori_rentan: 'Umum',
    peringatan_aqi_100: false,
    foto_profil: '',
    role: '',
  });
}
