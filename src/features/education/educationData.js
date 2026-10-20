/**
 * ============================================================================
 * DATA MATERI EDUKASI & ULASAN PENGGUNA (FR-06, FR-07, FR-15 SKPL-1000)
 * File: src/features/education/educationData.js
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
  {
    topic: 'Kesehatan',
    title: 'Asma dan polusi: kenali pemicunya.',
    minutes: 5,
    audience: 'Kelompok sensitif',
    summary: 'Langkah lebih waspada bagi penderita asma.',
    sections: [
      'Polusi udara dapat memicu gejala asma, seperti batuk, mengi, dan sesak. Pantau AQI sebelum keluar rumah.',
      'Ikuti rencana penanganan asma dari dokter dan gunakan obat sesuai resep. Pilih aktivitas di ruang dengan udara lebih bersih saat polusi meningkat.',
      'Jika mengalami sesak berat, sulit berbicara, atau obat pereda tidak membantu, segera cari pertolongan medis.',
    ],
  },
  {
    topic: 'Kesehatan',
    title: 'Melindungi anak dan lansia saat udara buruk.',
    minutes: 4,
    audience: 'Kelompok sensitif',
    summary: 'Perhatian ekstra untuk orang-orang yang kita sayangi.',
    sections: [
      'Anak-anak, lansia, serta orang dengan penyakit paru atau jantung lebih rentan terhadap dampak polusi.',
      'Pindahkan aktivitas berat ke dalam ruangan ketika AQI meningkat. Hindari asap rokok, pembakaran sampah, dan sumber polusi dalam rumah.',
      'Perhatikan batuk, kelelahan, atau sesak yang tidak biasa. Diskusikan kebutuhan perlindungan dengan tenaga kesehatan; jangan memaksakan respirator yang tidak sesuai.',
    ],
  },
  {
    topic: 'Aktivitas sehari-hari',
    title: 'Tetap aktif tanpa mengabaikan kualitas udara.',
    minutes: 3,
    audience: 'Semua orang',
    summary: 'Atur waktu, intensitas, dan lokasi aktivitasmu.',
    sections: [
      'Periksa kualitas udara sebelum berolahraga. Jangan menganggap pagi hari selalu lebih bersih; gunakan data setempat.',
      'Saat udara buruk, kurangi durasi dan intensitas aktivitas luar. Pilih rute jauh dari lalu lintas atau berolahraga di ruang dengan udara lebih bersih.',
      'Hentikan aktivitas bila muncul sesak, nyeri dada, atau pusing. Cari bantuan medis jika gejala berat atau menetap.',
    ],
  },
  {
    topic: 'Lingkungan',
    title: 'Udara lebih bersih dimulai dari kebiasaan kita.',
    minutes: 5,
    audience: 'Semua orang',
    summary: 'Perubahan kecil untuk mengurangi sumber polusi.',
    sections: [
      'Jangan membakar sampah. Pembakaran terbuka menghasilkan partikel dan zat pencemar yang membahayakan warga sekitar.',
      'Bila memungkinkan, gunakan transportasi umum, berbagi kendaraan, berjalan, atau bersepeda ketika kualitas udara mendukung.',
      'Dukung ruang hijau dan pengelolaan sampah. Pepohonan membantu lingkungan, tetapi tidak menggantikan pengurangan emisi dari sumbernya.',
    ],
  },
];

export const initialLessons = baseLessons.map((item, index) => ({
  ...item,
  id: `lesson-${index}`,
  cover: '',
  status_publikasi: 'PUBLISHED',
  views: [2840, 1960, 1750, 1320, 980, 760, 540][index],
}));

/**
 * Data awal Ulasan Konten Edukasi (Tabel `ulasan_edukasi` pada SKPL UC-06 & UC-07)
 */
export const initialLessonReviews = {};
