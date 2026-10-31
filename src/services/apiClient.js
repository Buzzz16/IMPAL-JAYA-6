/**
 * ============================================================================
 * HTTP CLIENT SERVICE (KOMUNIKASI FRONTEND VUE.JS <-> BACKEND EXPRESS.JS)
 * File: src/services/apiClient.js
 * Mengacu pada: Bab 4.3 & Bab 4.4 SKPL-1000 (REST API JSON + JWT Authorization)
 * ============================================================================
 */

import { EXTERNAL_API_CONFIG } from '../config/externalApi';

const TOKEN_STORAGE_KEY = 'polusee_jwt_token';
const USER_STORAGE_KEY = 'polusee_active_user';
const CLIENT_STORAGE_KEY = 'polusee_client_id';

export function getOrCreateClientId() {
  try {
    let cid = sessionStorage.getItem(CLIENT_STORAGE_KEY) || localStorage.getItem(CLIENT_STORAGE_KEY);
    if (!cid) {
      cid = 'client-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now();
      sessionStorage.setItem(CLIENT_STORAGE_KEY, cid);
      localStorage.setItem(CLIENT_STORAGE_KEY, cid);
    }
    return cid;
  } catch {
    return 'client-anonymous';
  }
}

export function getStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function getStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user) {
  if (!user) return;
  try {
    const serialized = JSON.stringify(user);
    sessionStorage.setItem(USER_STORAGE_KEY, serialized);
    localStorage.setItem(USER_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function setStoredSession(token, user) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    if (user) {
      saveStoredUser(user);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function clearStoredSession() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Mengirimkan request HTTP ke Backend Express.js (`/api/...`)
 * dengan header Authorization Bearer JWT otomatis dan identitas x-client-id.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const clientId = getOrCreateClientId();
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'x-client-id': clientId,
    ...(options.headers || {}),
  };

  const response = await fetch(`${EXTERNAL_API_CONFIG.BACKEND_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP Error ${response.status}`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

/**
 * Menyukai atau membatalkan suka (toggle like) pada post komunitas ke Supabase
 */
export async function togglePostLikeApi(postId) {
  const cleanId = String(postId).replace(/^post-/, '').replace(/^rep-/, '');
  return await apiRequest(`/komunitas/post/${cleanId}/like`, {
    method: 'POST',
    body: JSON.stringify({ client_id: getOrCreateClientId() }),
  });
}

/**
 * Menambahkan komentar baru pada post komunitas ke Supabase
 */
export async function addPostCommentApi(postId, text, authorName) {
  const cleanId = String(postId).replace(/^post-/, '').replace(/^rep-/, '');
  return await apiRequest(`/komunitas/post/${cleanId}/komentar`, {
    method: 'POST',
    body: JSON.stringify({
      text,
      isi_komentar: text,
      name: authorName,
      author: authorName,
    }),
  });
}
