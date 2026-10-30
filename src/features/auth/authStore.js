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

const storedUser = getStoredUser();

export const userProfileStore = reactive({
  id_akun: storedUser?.id_akun || 'user-demo-001',
  nama_lengkap: storedUser?.nama_lengkap || '',
  username: storedUser?.username || '',
  email: storedUser?.email || '',
  umur: storedUser?.umur ?? 28,
  lokasi_default: storedUser?.lokasi_default || 'Samarinda',
  kategori_rentan: storedUser?.kategori_rentan || 'Umum',
  peringatan_aqi_100: storedUser?.peringatan_aqi_100 ?? true,
  foto_profil:
    storedUser?.foto_profil ||
    'https://images.unsplash.com/photo-1630678334641-0c5339dfd1a7?auto=format&fit=crop&w=500&q=85',
  role: storedUser?.role || 'USER',
});

// Sinkronisasi otomatis ke sessionStorage dan localStorage setiap kali state profil berubah
watch(
  userProfileStore,
  (val) => {
    saveStoredUser(val);
  },
  { deep: true }
);

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
      const profilData = res.profil || res.user;
      if (profilData) {
        Object.assign(userProfileStore, profilData);
      }
      setStoredSession(res.token, userProfileStore);
      return { success: true, role: res.role || userProfileStore.role || 'USER', fromBackend: true };
    }
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      throw err;
    }
    // Jika server Express belum dijalankan, lanjutkan dengan sesi demo lokal
  }
  return { success: true, role: userProfileStore.role || 'USER', fromBackend: false };
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
      const userData = res.user || res.profil;
      if (userData) {
        Object.assign(userProfileStore, userData);
      }
      setStoredSession(res.token, userProfileStore);
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
  saveStoredUser(userProfileStore);
  return { success: true, fromBackend: false };
}

/**
 * Update Profil Pengguna (UC-11 SKPL: PUT /api/profile)
 */
export async function updateProfileData(payload) {
  Object.assign(userProfileStore, payload);
  saveStoredUser(userProfileStore);
  try {
    const res = await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res && res.profil_user) {
      Object.assign(userProfileStore, res.profil_user);
      saveStoredUser(userProfileStore);
    }
  } catch {
    // Tetap tersimpan di sesi lokal apabila backend belum aktif
  }
  return userProfileStore;
}


/**
 * Lupa & Atur Ulang Kata Sandi Akun (POST /api/auth/forgot-password)
 */
export async function forgotPasswordAccount({ email, newPassword, confirmPassword }) {
  try {
    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: newPassword,
        newPassword,
        confirmPassword,
      }),
    });
    return {
      success: true,
      message: res.message || 'Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.',
    };
  } catch (err) {
    if (err.status === 400 || err.status === 404) {
      throw err;
    }
    // Fallback mode demo
    return {
      success: true,
      message: 'Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.',
    };
  }
}

export function logoutAccount() {
  clearStoredSession();
  userProfileStore.nama_lengkap = '';
  userProfileStore.username = '';
  userProfileStore.email = '';
}
