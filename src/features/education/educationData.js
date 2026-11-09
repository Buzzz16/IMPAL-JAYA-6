/**
 * ============================================================================
 * DATA MATERI EDUKASI & ULASAN PENGGUNA (FR-06, FR-07, FR-15 SKPL-1000)
 * File: src/features/education/educationData.js
 * Sinkron 100% dengan Database PoluSee (3 Materi Edukasi Terverifikasi)
 * ============================================================================
 */

const baseLessons = [
  {
    topic: 'Kenali udara',
    title: 'AQI: membaca angka, memahami risiko.',
    minutes: 4,
    audience: 'Semua orang',
    summary: 'Kenali indeks kualitas udara sebelum merencanakan aktivitas.',
    sections: [
      'AQI menggambarkan tingkat pencemaran udara. Nilai yang lebih tinggi menunjukkan risiko kesehatan yang lebih besar.',
      '0–50: baik. 51–100: sedang. 101–150: tidak sehat bagi kelompok sensitif. 151–200: tidak sehat. 201–300: sangat tidak sehat. Di atas 300: berbahaya.',
      'Pantau informasi dari stasiun pemantau resmi terdekat. Kondisi dapat berubah sepanjang hari; sesuaikan aktivitas dengan angka terbaru.',
    ],
  },
  {
    topic: 'Bahaya polusi',
    title: 'PM2.5: kecil partikelnya, besar dampaknya.',
    minutes: 6,
    audience: 'Semua orang',
    summary: 'Mengapa partikel halus perlu mendapat perhatian khusus?',
    sections: [
      'PM2.5 adalah partikel berdiameter 2,5 mikrometer atau lebih kecil. Sumbernya antara lain pembakaran bahan bakar, kebakaran, dan proses industri.',
      'Partikel halus dapat masuk jauh ke paru-paru. Paparan polusi dikaitkan dengan gangguan pernapasan dan penyakit kardiovaskular.',
      'Kurangi paparan saat udara buruk: batasi aktivitas berat di luar, hindari sumber asap, dan gunakan ruang dengan udara lebih bersih.',
    ],
  },
  {
    topic: 'Perlindungan diri',
    title: 'Memilih masker yang benar-benar melindungi.',
    minutes: 3,
    audience: 'Semua orang',
    summary: 'Panduan praktis memilih dan memakai respirator.',
    sections: [
      'Respirator N95 yang sesuai dan terpasang rapat dapat membantu mengurangi partikel yang terhirup. Masker kain tidak memberi perlindungan setara terhadap partikel halus.',
      'Tutup hidung dan mulut, sesuaikan penjepit hidung, dan periksa celah di tepi masker. Ganti jika rusak, kotor, atau sulit digunakan untuk bernapas.',
      'Respirator tidak melindungi dari semua gas. Mengurangi paparan tetap menjadi langkah utama; konsultasikan dengan tenaga kesehatan bila memiliki kondisi medis.',
    ],
  },
];

export const initialLessons = baseLessons.map((item, index) => ({
  ...item,
  id: `lesson-${index}`,
  cover: '',
  status_publikasi: 'PUBLISHED',
  views: [2840, 1960, 1750][index] || 1500,
}));

/**
 * Data awal Ulasan Konten Edukasi (Tabel `ulasan_edukasi` pada SKPL UC-06 & UC-07)
 */
export const initialLessonReviews = {
  'lesson-0': [
    {
      id_ulasan: 'rev-1',
      id_konten: 'lesson-0',
      author: 'Warga Peduli',
      handle: '@wargapeduli',
      isOwner: false,
      rating: 5,
      isi_ulasan: 'Penjelasan rentang angka AQI sangat mudah dipahami untuk memantau udara harian di Samarinda.',
      is_edited: false,
      updated_at: 'Hari ini',
    },
    {
      id_ulasan: 'rev-2',
      id_konten: 'lesson-0',
      author: 'Rina Kusuma',
      handle: '@rinakusuma',
      isOwner: false,
      rating: 5,
      isi_ulasan: 'Sangat membantu sebagai panduan sebelum mengajak anak beraktivitas di luar.',
      is_edited: false,
      updated_at: 'Kemarin',
    },
  ],
  'lesson-1': [
    {
      id_ulasan: 'rev-3',
      id_konten: 'lesson-1',
      author: 'Ahmad Faiz',
      handle: '@ahmadfaiz',
      isOwner: false,
      rating: 5,
      isi_ulasan: 'Sangat informatif mengenai bahaya partikel halus PM2.5 bagi pernapasan.',
      is_edited: false,
      updated_at: '2 hari lalu',
    },
  ],
  'lesson-2': [
    {
      id_ulasan: 'rev-4',
      id_konten: 'lesson-2',
      author: 'Dr. Hendra',
      handle: '@drhendra',
      isOwner: false,
      rating: 5,
      isi_ulasan: 'Panduan tepat untuk memilih masker N95 saat polusi udara sedang memburuk.',
      is_edited: false,
      updated_at: '3 hari lalu',
    },
  ],
};
