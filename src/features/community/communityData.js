/**
 * ============================================================================
 * DATA LAPORAN & FEED KOMUNITAS (FR-08, FR-09, FR-10, FR-14 SKPL-1000)
 * File: src/features/community/communityData.js
 * ============================================================================
 */

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `rep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newReport(city = 'Samarinda') {
  return {
    id: generateId(),
    nomor_tiket: `POL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    caption: '',
    image: '',
    city,
    area: '',
    latitude: null,
    longitude: null,
    condition: 'normal',
    source: '',
    observedAt: '',
    suggestion: '',
    status_verifikasi: 'TERVERIFIKASI',
    likes: 0,
    liked: false,
    comments: [],
  };
}

export const initialReports = [];
