<script setup>
/**
 * ============================================================================
 * HALAMAN DETAIL REKOMENDASI KESEHATAN (FR-05 / UC-05 LIHAT REKOMENDASI KESEHATAN)
 * File: src/features/health/HealthRecommendations.vue
 * ============================================================================
 */
import { ref, computed, onMounted } from 'vue';
import HealthIcon from '../../components/common/HealthIcon.vue';

const props = defineProps({
  city: {
    type: String,
    required: true,
  },
  aqi: {
    type: Number,
    required: true,
  },
  healthData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['back', 'profile']);

const heading = ref(null);

onMounted(() => {
  heading.value?.focus();
  window.scrollTo(0, 0);
});

const good = computed(() => props.aqi <= 50);
const moderate = computed(() => props.aqi > 50 && props.aqi <= 100);

const status = computed(() =>
  good.value
    ? 'Baik'
    : moderate.value
      ? 'Sedang'
      : props.aqi <= 150
        ? 'Tidak sehat bagi kelompok sensitif'
        : props.aqi <= 200
          ? 'Tidak sehat'
          : props.aqi <= 300
            ? 'Sangat tidak sehat'
            : 'Berbahaya'
);

const recommendations = computed(() => {
  if (props.healthData?.rekomendasi) {
    const r = props.healthData.rekomendasi;
    return [
      {
        icon: 'exercise',
        title: props.aqi > 100 ? 'Kurangi aktivitas di luar ruangan.' : 'Aktivitas fisik di luar ruangan.',
        text: r.saran_aktivitas_luar,
      },
      {
        icon: 'mask',
        title: 'Perlindungan pernapasan & masker.',
        text: r.saran_perlindungan_diri,
      },
      {
        icon: 'window',
        title: 'Ventilasi & ruangan dalam.',
        text: props.aqi > 100 ? 'Tutup ventilasi dan jendela saat siang/sore hari, gunakan pembersih udara jika tersedia.' : 'Buka jendela saat pagi hari untuk sirkulasi udara segar di dalam rumah.',
      },
      {
        icon: 'vulnerable',
        title: 'Perhatian khusus kelompok rentan.',
        text: r.saran_kelompok_rentan,
      },
    ];
  }
  return [
    {
      icon: 'exercise',
      title: good.value
        ? 'Nikmati aktivitas di luar ruangan.'
        : moderate.value
          ? 'Beraktivitas dengan bijak.'
          : 'Kurangi olahraga di luar ruangan.',
      text: good.value
        ? 'Kualitas udara mendukung jalan santai, bersepeda, dan aktivitas luar ruangan.'
        : 'Pindahkan olahraga ke ruangan dengan udara lebih bersih saat angka polusi meningkat.',
      steps: [
        'Periksa AQI sebelum berangkat dan selama aktivitas panjang.',
        'Hindari rute dekat jalan padat, pembakaran, dan sumber asap.',
        'Hentikan aktivitas jika muncul batuk, mengi, atau sesak.',
      ],
    },
    {
    icon: 'window',
    title: good.value
      ? 'Buka jendela untuk udara segar.'
      : moderate.value
        ? 'Atur ventilasi sesuai kondisi udara.'
        : 'Tutup jendela saat udara luar tercemar.',
    text: good.value
      ? 'Jika udara luar lebih bersih daripada udara dalam dan cuaca mendukung, buka jendela untuk membantu pertukaran udara.'
      : moderate.value
        ? 'Buka jendela saat udara luar lebih bersih. Tutup kembali jika ada asap, debu, atau kualitas udara memburuk.'
        : 'Kurangi masuknya polusi dari luar. Buka kembali saat kualitas udara membaik; tetap perhatikan panas dan kebutuhan ventilasi ruangan.',
    steps: [
      'Jangan merokok atau membakar dupa di dalam ruangan.',
      'Gunakan penghisap asap saat memasak jika tersedia.',
      'Pantau kualitas udara dalam, bukan hanya angka AQI luar.',
    ],
  },
  {
    icon: 'mask',
    title: good.value
      ? 'Masker sesuai kebutuhan paparan.'
      : moderate.value
        ? 'Siapkan masker jika diperlukan.'
        : 'Gunakan masker saat harus keluar.',
    text: good.value
      ? 'Masker khusus polusi tidak selalu diperlukan saat udara baik. Pertimbangkan jika berada dekat debu atau asap lokal.'
      : moderate.value
        ? 'Orang yang sensitif dapat mempertimbangkan respirator saat berada dekat sumber polusi atau saat kualitas udara menurun.'
        : 'Respirator N95 atau KN95 yang pas dapat mengurangi paparan partikel. Masker bukan pengganti mengurangi waktu di area tercemar.',
    steps: [
      'Pastikan hidung dan mulut tertutup tanpa celah di sisi wajah.',
      'Ganti jika basah, kotor, rusak, atau sulit digunakan bernapas.',
      'Respirator partikel tidak melindungi dari semua gas; konsultasikan penggunaannya jika memiliki kondisi medis.',
    ],
    guide: 'mask-guide',
    link: 'Panduan memilih masker',
  },
  {
    icon: 'purifier',
    title: good.value
      ? 'Jaga udara dalam tetap bersih.'
      : moderate.value
        ? 'Pertimbangkan penyaring udara.'
        : 'Jalankan pembersih udara.',
    text: 'Pembersih udara dengan filter HEPA dapat membantu mengurangi partikel di ruangan. Pilih kapasitas yang sesuai dan jangan mengandalkannya untuk menghilangkan semua gas.',
    steps: [
      'Tempatkan di ruang yang paling sering digunakan.',
      'Jangan menutup saluran masuk atau keluar udara.',
      'Rawat dan ganti filter sesuai petunjuk produsen.',
    ],
    guide: 'purifier-guide',
    link: 'Panduan pembersih udara',
  },
  {
    icon: 'monitor',
    title: 'Pantau udara, bukan hanya perkiraan.',
    text: 'Monitor PM2.5 membantu melihat perubahan partikel di dalam rumah. Sensor konsumen memberikan indikasi, bukan diagnosis kesehatan atau pengganti alat pemantau resmi.',
    steps: [
      'Letakkan jauh dari kompor, jendela terbuka, dan aliran langsung AC.',
      'Perhatikan tren beberapa pengukuran, bukan satu angka.',
      'Bandingkan kondisi dalam ruangan dengan informasi udara luar.',
    ],
    guide: 'monitor-guide',
    link: 'Panduan monitor udara',
  },
  {
    icon: 'user',
    title: 'Beri perlindungan ekstra untuk kelompok sensitif.',
    text: 'Anak-anak, lansia, ibu hamil, serta orang dengan asma, penyakit paru atau jantung mungkin memerlukan langkah pencegahan tambahan.',
    steps: [
      'Ikuti rencana pengobatan yang diberikan tenaga kesehatan.',
      'Siapkan obat yang diresepkan dan kontak bantuan.',
      'Sesuaikan aktivitas dengan gejala, bukan hanya kategori AQI.',
    ],
  },
];
});

const guides = [
  {
    id: 'mask-guide',
    icon: 'mask',
    title: 'Masker & respirator',
    text: 'Cari N95 atau KN95 dari sumber tepercaya dengan standar sertifikasi yang dapat diverifikasi. Kecocokan di wajah sangat penting; jangan gunakan respirator dewasa untuk anak tanpa panduan yang tepat.',
  },
  {
    id: 'purifier-guide',
    icon: 'purifier',
    title: 'Pembersih udara',
    text: 'Pilih filter HEPA dan CADR sesuai luas ruangan. Pertimbangkan biaya filter pengganti dan kebisingan. Hindari perangkat yang sengaja menghasilkan ozon.',
  },
  {
    id: 'monitor-guide',
    icon: 'monitor',
    title: 'Monitor kualitas udara',
    text: 'Utamakan pengukuran PM2.5, informasi akurasi, dan perawatan sensor. Sensor CO₂ membantu memahami ventilasi tetapi bukan pengukur PM2.5. Monitor udara bukan pengganti alarm karbon monoksida.',
  },
];
</script>

<template>
  <div class="health-detail">
    <button class="text-link detail-back" @click="emit('back')">← Kembali ke dashboard</button>
    <div class="detail-title">
      <div>
        <span class="eyebrow">POLUSEE / REKOMENDASI KESEHATAN</span>
        <h1 ref="heading" tabindex="-1">Napas lebih aman.<br />Langkah lebih bijak.</h1>
        <p>Panduan aktivitas dan perlindungan sehari-hari di {{ city }}.</p>
      </div>
      <span class="detail-demo">BERDASARKAN DATA AQI DEMO</span>
    </div>
    <section class="health-summary">
      <div>
        <span class="eyebrow">KONDISI UDARA / {{ city.toUpperCase() }}</span>
        <h2>{{ status }}</h2>
        <p>
          {{
            good
              ? 'Waktu yang baik untuk menikmati udara luar, dengan tetap memperhatikan kondisi setempat.'
              : moderate
                ? 'Udara cukup baik bagi sebagian besar orang. Kelompok sensitif tetap perlu memperhatikan gejala.'
                : 'Kurangi paparan polusi dan prioritaskan udara yang lebih bersih, terutama untuk kelompok sensitif.'
          }}
        </p>
      </div>
      <div class="health-summary-number">
        <strong>{{ aqi }}</strong>
        <span>US AQI · DEMO</span>
      </div>
    </section>
    <div class="health-section-intro">
      <span class="eyebrow">ENAM LANGKAH UNTUK HARI INI</span>
      <h2>Perlindungan dimulai dari kebiasaan.</h2>
    </div>
    <div class="health-grid">
      <article v-for="(item, index) in recommendations" :key="item.icon" class="health-card">
        <div class="health-card-top">
          <span class="health-icon">
            <HealthIcon :name="item.icon" />
          </span>
          <span class="eyebrow">0{{ index + 1 }}</span>
        </div>
        <h2>{{ item.title }}</h2>
        <p>{{ item.text }}</p>
        <ul>
          <li v-for="step in item.steps" :key="step">{{ step }}</li>
        </ul>
        <a v-if="item.guide" class="text-link" :href="`#${item.guide}`">{{ item.link }} ↓</a>
      </article>
    </div>
    <section class="health-guides">
      <span class="eyebrow">PILIH PERLINDUNGAN DENGAN TEPAT</span>
      <h2>Panduan perlengkapan.</h2>
      <p>Informasi edukasi, bukan rekomendasi merek atau tautan pembelian.</p>
      <div class="health-guide-grid">
        <article v-for="guide in guides" :id="guide.id" :key="guide.id">
          <HealthIcon :name="guide.icon" />
          <h3>{{ guide.title }}</h3>
          <p>{{ guide.text }}</p>
        </article>
      </div>
    </section>
    <section class="health-personalize">
      <div>
        <span class="eyebrow">KEBUTUHAN SETIAP ORANG BERBEDA</span>
        <h2>Kenali kebutuhan kesehatanmu.</h2>
        <p>Atur preferensi kesehatan dan peringatan kualitas udara di Profil.</p>
      </div>
      <button class="primary-button" @click="emit('profile')">Buka Profil →</button>
    </section>
    <p class="health-disclaimer">
      Panduan ini bersifat umum dan edukatif, bukan diagnosis atau pengganti saran dokter. Data AQI masih demonstrasi. Jika mengalami sesak berat, nyeri dada, atau gejala memburuk, segera cari pertolongan medis.
    </p>
  </div>
</template>
