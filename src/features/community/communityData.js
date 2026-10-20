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

export const initialReports = [
  {
    ...newReport('Samarinda'),
    id: 'report-initial-1',
    nomor_tiket: 'POL-2025-1041',
    caption: 'Asap pembakaran sampah di sekitar Sungai Karang Mumus',
    area: 'Sungai Karang Mumus',
    latitude: -0.4948,
    longitude: 117.1562,
    condition: 'buruk',
    source: 'Pembakaran sampah',
    image:
      'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85',
    likes: 128,
    comments: [
      {
        name: 'peduliudara.smd',
        text: 'Terima kasih sudah melaporkan. Tim komunitas akan ikut memantau area ini.',
      },
    ],
  },
  {
    ...newReport('Samarinda'),
    id: 'report-initial-2',
    nomor_tiket: 'POL-2025-1042',
    caption: 'Udara pagi di area taman terasa lebih segar',
    area: 'Taman kota',
    latitude: -0.5022,
    longitude: 117.1536,
    condition: 'bagus',
    image:
      'https://images.unsplash.com/photo-1527965408463-82ae0731825c?auto=format&fit=crop&w=1200&q=85',
    likes: 94,
    comments: [
      {
        name: 'hijaukankota',
        text: 'Semoga ruang hijau kita terus bertambah.',
      },
    ],
  },
];
