/**
 * ============================================================================
 * DATA & KONSTANTA AQI PER KOTA
 * File: src/features/aqi/aqiData.js
 * ============================================================================
 */

export const DEFAULT_CITY_AQI = {
  Samarinda: 150,
  Balikpapan: 78,
  Jakarta: 163,
  Bandung: 62,
};

export const HOME_ARTICLES = [
  {
    category: 'KENALI UDARAMU',
    title: 'Apa itu AQI dan mengapa kita perlu peduli?',
    description:
      'Memahami angka di balik udara yang kita hirup adalah langkah pertama untuk melindungi diri.',
    body: 'AQI (Air Quality Index) adalah indeks yang menunjukkan seberapa bersih atau tercemarnya udara. Nilai 0–50 berarti baik, 51–100 sedang, 101–150 tidak sehat bagi kelompok sensitif, dan di atas 150 tidak sehat. Semakin tinggi angkanya, semakin besar risiko kesehatan.',
    type: 'aqi',
    time: '4 menit baca',
  },
  {
    category: 'KESEHATAN',
    title: 'Masker yang tepat, perlindungan yang lebih baik.',
    description:
      'Tidak semua masker sama. Kenali perlindungan yang tepat saat kualitas udara menurun.',
    body: 'Masker N95 yang terpasang rapat dapat membantu menyaring partikel halus. Pastikan masker menutup hidung dan mulut, tidak ada celah di samping, dan ganti bila kotor atau rusak. Kurangi paparan polusi bila memungkinkan.',
    type: 'mask',
    time: '5 menit baca',
  },
  {
    category: 'LINGKUNGAN',
    title: 'Ruang hijau, napas baru untuk kota kita.',
    description:
      'Bagaimana pepohonan dan ruang terbuka membantu menjaga kualitas udara perkotaan.',
    body: 'Pepohonan dapat menangkap sebagian partikel polusi dan menyejukkan kota. Dukung ruang hijau di lingkunganmu, gunakan transportasi ramah lingkungan, dan hindari membakar sampah.',
    type: 'forest',
    time: '3 menit baca',
  },
];

export function getAqiCategory(aqi) {
  if (aqi > 300) return 'Berbahaya';
  if (aqi > 200) return 'Sangat tidak sehat';
  if (aqi > 150) return 'Tidak sehat';
  if (aqi > 100) return 'Tidak sehat bagi kelompok sensitif';
  if (aqi > 50) return 'Sedang';
  return 'Baik';
}

export function getHomeAqiStatus(aqi) {
  return getAqiCategory(aqi);
}

/**
 * Palet warna standar 6-tingkat AQI resmi yang seragam di seluruh aplikasi:
 * - 0 - 50    : Baik (#a1b699, teks #162e15)
 * - 51 - 100  : Sedang (#d4c66e, teks #263b3e)
 * - 101 - 150 : Tidak Sehat bagi Kelompok Sensitif (#c79854, teks #ffffff)
 * - 151 - 200 : Tidak Sehat (#c27c65, teks #ffffff)
 * - 201 - 300 : Sangat Tidak Sehat (#9c7e91, teks #ffffff)
 * - > 300     : Berbahaya (#87636b, teks #ffffff)
 */
export function getAqiColor(val) {
  const v = Number(val) || 0;
  if (v <= 50) return { bg: '#a1b699', text: '#162e15', label: 'Baik', border: '#84a17c', tier: 'good' };
  if (v <= 100) return { bg: '#d4c66e', text: '#263b3e', label: 'Sedang', border: '#b8aa53', tier: 'moderate' };
  if (v <= 150) return { bg: '#c79854', text: '#ffffff', label: 'Tidak sehat bagi kelompok sensitif', border: '#a87a38', tier: 'sensitive' };
  if (v <= 200) return { bg: '#c27c65', text: '#ffffff', label: 'Tidak sehat', border: '#a15f4a', tier: 'unhealthy' };
  if (v <= 300) return { bg: '#9c7e91', text: '#ffffff', label: 'Sangat tidak sehat', border: '#7f6375', tier: 'very-unhealthy' };
  return { bg: '#87636b', text: '#ffffff', label: 'Berbahaya', border: '#68444c', tier: 'hazardous' };
}

export function getForecastAqiStyle(val) {
  const color = getAqiColor(val);
  return {
    backgroundColor: color.bg,
    color: color.text,
  };
}

export function getForecastAqiClass(val) {
  const v = Number(val) || 0;
  if (v <= 50) return 'forecast-good';
  if (v <= 100) return 'forecast-moderate';
  if (v <= 150) return 'forecast-sensitive';
  if (v <= 200) return 'forecast-unhealthy';
  if (v <= 300) return 'forecast-very-unhealthy';
  return 'forecast-hazardous';
}

/**
 * Palet tema warna tampilan dinamis berbasis indikator kesehatan AQI resmi:
 * - 0 - 50    : Baik (Hijau mentok kiri: #a1b699)
 * - 51 - 100  : Sedang (Kuning: #d4c66e)
 * - 101 - 150 : Sensitif (Oranye: #c79854)
 * - 151 - 200 : Tidak Sehat (Merah: #c27c65)
 * - 201 - 300 : Sangat Tidak Sehat (Ungu: #9c7e91)
 * - > 300     : Berbahaya (Ungu Tua / Marun mentok kanan: #87636b)
 */
export function getAqiTheme(aqi) {
  const val = Number(aqi) || 0;

  if (val > 300) {
    // Balok 6: Berbahaya (Ungu Tua / Marun mentok kanan)
    return {
      tier: 'hazardous',
      level: 6,
      label: 'Berbahaya',
      cardBg: '#e9d5dc',
      cardBorder: '#bfa1aa',
      textColor: '#2f131a',
      badgeBg: '#87636b',
      badgeText: '#ffffff',
      badgeBorder: '#68444c',
      badgeDot: '#ffffff',
      sunArt: '#7d4957',
      divider: '#c8a6b0',
      scalePointer: '#5e1e2d',
      unitColor: '#79404d',
      descColor: '#66333f',
      description: 'Bahaya darurat kesehatan: Kualitas udara sangat berbahaya. Hindari semua aktivitas di luar ruangan dan tutup rapat ventilasi.',
    };
  }

  if (val > 200) {
    // Balok 5: Sangat Tidak Sehat (Ungu)
    return {
      tier: 'very-unhealthy',
      level: 5,
      label: 'Sangat tidak sehat',
      cardBg: '#f0e1ec',
      cardBorder: '#ccadc4',
      textColor: '#2d1326',
      badgeBg: '#9c7e91',
      badgeText: '#ffffff',
      badgeBorder: '#8e6581',
      badgeDot: '#ffffff',
      sunArt: '#935a85',
      divider: '#d6b7ce',
      scalePointer: '#772968',
      unitColor: '#7d4d73',
      descColor: '#6b3d62',
      description: 'Kualitas udara sangat tidak sehat. Hindari aktivitas berat di luar ruangan dan gunakan pembersih udara di dalam rumah.',
    };
  }

  if (val > 150) {
    // Balok 4: Tidak Sehat (Merah)
    return {
      tier: 'unhealthy',
      level: 4,
      label: 'Tidak sehat',
      cardBg: '#f9dfd8',
      cardBorder: '#e2a89c',
      textColor: '#3f1711',
      badgeBg: '#c27c65',
      badgeText: '#ffffff',
      badgeBorder: '#be6957',
      badgeDot: '#ffffff',
      sunArt: '#c26754',
      divider: '#e5b2a7',
      scalePointer: '#a33725',
      unitColor: '#8f4d42',
      descColor: '#793c32',
      description: 'Kualitas udara tidak sehat untuk semua orang. Gunakan masker saat keluar rumah dan batasi waktu di luar ruangan.',
    };
  }

  if (val > 100) {
    // Balok 3: Tidak Sehat bagi Sensitif (Oranye)
    return {
      tier: 'sensitive',
      level: 3,
      label: 'Tidak sehat bagi kelompok sensitif',
      cardBg: '#f7e8d5',
      cardBorder: '#ddbc98',
      textColor: '#3a200a',
      badgeBg: '#c79854',
      badgeText: '#ffffff',
      badgeBorder: '#c78f49',
      badgeDot: '#ffffff',
      sunArt: '#c78342',
      divider: '#e2c29e',
      scalePointer: '#b35d0e',
      unitColor: '#8e5e2e',
      descColor: '#784c21',
      description: 'Kelompok rentan (anak-anak, lansia, ibu hamil, penderita asma) sebaiknya mengurangi aktivitas fisik berat di luar.',
    };
  }

  if (val > 50) {
    // Balok 2: Sedang (Kuning)
    return {
      tier: 'moderate',
      level: 2,
      label: 'Sedang',
      cardBg: '#f1e7c9',
      cardBorder: '#d6c89f',
      textColor: '#263b3e',
      badgeBg: '#e8c884',
      badgeText: '#263b3e',
      badgeBorder: '#d8b869',
      badgeDot: '#aa7a29',
      sunArt: '#bda657',
      divider: '#d0c6aa',
      scalePointer: '#aa7a29',
      unitColor: '#837b61',
      descColor: '#79755f',
      description: 'Kualitas udara mendukung aktivitas harian Anda dengan nyaman di sebagian besar waktu.',
    };
  }

  // Balok 1: Baik (Hijau mentok kiri)
  return {
    tier: 'good',
    level: 1,
    label: 'Baik',
    cardBg: '#e4ede2',
    cardBorder: '#9cb894',
    textColor: '#1c361b',
    badgeBg: '#a1b699',
    badgeText: '#162e15',
    badgeBorder: '#84a17c',
    badgeDot: '#2b5025',
    sunArt: '#6b9462',
    divider: '#bfd3b9',
    scalePointer: '#2f5629',
    unitColor: '#587c55',
    descColor: '#476645',
    description: 'Kualitas udara sangat baik dan menyegarkan! Bebas beraktivitas dan berolahraga di luar ruangan tanpa khawatir.',
  };
}

/**
 * Menghitung persentase posisi panah indikator tepat di atas 6 balok skala AQI:
 * Mentok kiri jika AQI <= 50 (misal 20 -> di balok hijau), mentok kanan jika AQI > 300 (di balok ungu)
 */
export function getAqiScalePercent(aqi) {
  const val = Number(aqi) || 0;
  if (val <= 0) return 3;
  if (val <= 50) {
    // Balok 1: 0 - 16.66% (Hijau mentok kiri)
    return Math.max(3, (val / 50) * 16.66);
  }
  if (val <= 100) {
    // Balok 2: 16.66% - 33.33% (Kuning)
    return 16.66 + ((val - 50) / 50) * 16.66;
  }
  if (val <= 150) {
    // Balok 3: 33.33% - 50% (Oranye)
    return 33.33 + ((val - 100) / 50) * 16.66;
  }
  if (val <= 200) {
    // Balok 4: 50% - 66.66% (Merah)
    return 50.0 + ((val - 150) / 50) * 16.66;
  }
  if (val <= 300) {
    // Balok 5: 66.66% - 83.33% (Ungu)
    return 66.66 + ((val - 200) / 100) * 16.66;
  }
  // Balok 6: > 300 (Ungu tua / Marun mentok kanan)
  const beyond = Math.min(1, (val - 300) / 100);
  return Math.min(95, 83.33 + beyond * 11.67);
}

export function getDefaultPollutants(city) {
  const pm25 =
    city === 'Samarinda'
      ? 55.4
      : city === 'Jakarta'
        ? 76.2
        : city === 'Balikpapan'
          ? 24.6
          : 17.8;
  return {
    pm25,
    pm10: Math.round(pm25 * 1.3),
    o3: 36,
    no2: 49,
    so2: 4,
    co: 1600,
  };
}
