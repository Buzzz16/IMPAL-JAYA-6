<script setup>
/**
 * ============================================================================
 * HALAMAN DETAIL KUALITAS UDARA, CUACA, & POLUTAN (FR-03 / UC-03 SKPL)
 * File: src/features/aqi/AirQualityDetail.vue
 * Tata Letak Modern & Proporsional:
 *   1. Metrik cuaca 4 kolom sejajar 1 baris
 *   2. Kartu AQI & Cuaca proporsional dan selaras
 *   3. Bagian Rincian Polutan Udara diposisikan tepat di bawah kartu utama
 *   4. Komponen atribusi data & polutan utama ringkasan dihapus
 * ============================================================================
 */
import { ref, computed, onMounted } from 'vue';
import WeatherIcon from '../../components/common/WeatherIcon.vue';
import { getAqiTheme, getAqiCategory, getForecastAqiStyle, getForecastAqiClass } from './aqiData';

const props = defineProps({
  city: {
    type: String,
    required: true,
  },
  aqi: {
    type: Number,
    required: true,
  },
  realtimeData: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['back']);

const day = ref(0);
const heading = ref(null);
const days = ['Hari ini', 'Besok', 'Lusa'];
const dailyOffsets = [0, -22, -31, -12, -40, -28, -43];
const dailyDays = ['Hari ini', 'Besok', 'Lusa', 'Hari ke-4', 'Hari ke-5', 'Hari ke-6', 'Hari ke-7'];

const theme = computed(() => getAqiTheme(props.aqi));

onMounted(() => {
  heading.value?.focus();
  window.scrollTo(0, 0);
});

function category(val) {
  return getAqiCategory(val);
}

const pm25 = computed(() => {
  if (props.realtimeData?.pm25 != null) return Number(props.realtimeData.pm25);
  return props.city === 'Samarinda'
    ? 55.4
    : props.city === 'Jakarta'
      ? 76.2
      : props.city === 'Balikpapan'
        ? 24.6
        : 17.8;
});

const pm10 = computed(() => {
  if (props.realtimeData?.pm10 != null) return Number(props.realtimeData.pm10);
  return Number((pm25.value * 1.34).toFixed(1));
});

const hourly = computed(() =>
  Array.from({ length: 24 }, (_, hour) => ({
    hour,
    aqi: Math.max(
      35,
      Math.round(
        props.aqi - day.value * 16 + (Math.sin((hour - 8) / 4) - Math.sin(-2)) * 13
      )
    ),
    temperature: Math.round(
      (props.realtimeData?.temperature ? props.realtimeData.temperature - 2 : 28) +
        Math.sin((hour - 8) / 4) * 3
    ),
    wind: Math.round(
      (props.realtimeData?.windSpeedKmh ? Math.round(props.realtimeData.windSpeedKmh) : 9) +
        Math.sin(hour / 3) * 4
    ),
    humidity: Math.round(
      (props.realtimeData?.humidity ?? 76) - Math.sin((hour - 8) / 4) * 10
    ),
  }))
);

const pollutants = computed(() => [
  ['PM2.5', 'Partikel halus (≤ 2,5 µm)', pm25.value],
  ['PM10', 'Partikel kasar (≤ 10 µm)', pm10.value],
  ['O₃', 'Ozon', props.realtimeData?.o3 ?? 36],
  ['NO₂', 'Nitrogen dioksida', props.realtimeData?.no2 ?? 49],
  ['SO₂', 'Sulfur dioksida', props.realtimeData?.so2 ?? 4],
  ['CO', 'Karbon monoksida', props.realtimeData?.co ?? 1600],
]);

const windSpeedKmh = computed(() => Number(props.realtimeData?.windSpeedKmh ?? 7.2));
const windSpeedMs = computed(() => Number(props.realtimeData?.windSpeedMs ?? (windSpeedKmh.value / 3.6).toFixed(1)));
const windDirText = computed(() => props.realtimeData?.windDirectionText || 'Selatan');
const windDirDeg = computed(() => Number(props.realtimeData?.windDirectionDeg ?? 180));
const pressureVal = computed(() => Number(props.realtimeData?.pressure ?? 1010));

const weatherItems = computed(() => [
  {
    kind: 'sun',
    value: `${props.realtimeData?.temperature ?? 30}°C`,
    label: 'Suhu udara',
  },
  {
    kind: 'wind',
    value: `${windSpeedKmh.value} km/h (${windSpeedMs.value} m/s)`,
    label: `Angin · ${windDirText.value} (${windDirDeg.value}°)`,
  },
  {
    kind: 'humidity',
    value: `${props.realtimeData?.humidity ?? 65}%`,
    label: 'Kelembapan udara',
  },
  {
    kind: 'pressure',
    value: `${pressureVal.value} mbar`,
    label: 'Tekanan barometrik',
  },
]);
</script>

<template>
  <div class="air-detail">
    <!-- Tombol Navigasi Kembali ke Dashboard -->
    <button class="text-link detail-back" type="button" @click="emit('back')">
      ← Kembali ke dashboard
    </button>

    <!-- Header Judul Detail Kualitas Udara -->
    <div class="detail-title">
      <div>
        <span class="eyebrow">RUANG PANTAU UDARA / DETAIL LOKASI</span>
        <h1 ref="heading" tabindex="-1">Kualitas udara di {{ city }}.</h1>
        <p>Indeks kualitas udara (AQI), polusi PM2.5/PM10 &amp; parameter cuaca · Indonesia</p>
      </div>
      <span class="detail-demo">LIVE IQAIR · {{ realtimeData?.updatedAt || '11.00 WAKTU LOKAL' }}</span>
    </div>

    <!-- Grid Kualitas Udara Saat Ini & Cuaca di Sekitarmu -->
    <div class="detail-current">
      <section
        class="detail-aqi"
        :style="{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          transition: 'background-color 0.4s ease, border-color 0.4s ease',
        }"
      >
        <span class="eyebrow" :style="{ color: theme.descColor }">KUALITAS UDARA SAAT INI</span>
        <div class="detail-aqi-value">
          <strong :style="{ color: theme.textColor }">{{ aqi }}</strong>
          <span :style="{ color: theme.unitColor }">US AQI</span>
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :style="{ color: theme.sunArt }"
            :aria-label="`Ekspresi kualitas udara: ${category(aqi)}`"
            role="img"
          >
            <circle cx="36" cy="36" r="30" />
            <path d="M24 27v5m24-5v5" />
            <path :d="aqi > 100 ? 'M24 49Q36 36 48 49' : 'M24 43Q36 55 48 43'" />
          </svg>
        </div>
        <span
          class="status-badge"
          :style="{
            backgroundColor: theme.badgeBg,
            borderColor: theme.badgeBorder,
            color: theme.badgeText,
          }"
        >
          <i :style="{ backgroundColor: theme.badgeDot }" />{{ category(aqi) }}
        </span>
      </section>

      <section class="detail-weather">
        <div>
          <span class="eyebrow">CUACA DI SEKITARMU</span>
          <h2>Kenali kondisi sebelum keluar.</h2>
        </div>
        <div class="detail-weather-grid">
          <div v-for="item in weatherItems" :key="item.kind">
            <WeatherIcon :kind="item.kind" />
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Apa yang ada di udara / Rincian Polutan (Posisikan tepat di bawah kartu Kualitas Udara & Cuaca) -->
    <section id="detail-pollutants" class="detail-section">
      <div class="detail-section-heading">
        <div>
          <span class="eyebrow">APA YANG ADA DI UDARA?</span>
          <h2>Rincian polutan udara.</h2>
          <p>Konsentrasi polutan terukur di {{ city }} · Data aktual stasiun IQAir</p>
        </div>
      </div>
      <div class="detail-pollutant-grid">
        <div v-for="[symbol, label, value] in pollutants" :key="symbol">
          <strong>{{ symbol }}</strong>
          <span>{{ label }}</span>
          <div>
            <b>{{ value }}</b> <small>µg/m³</small>
          </div>
        </div>
      </div>
      <p class="detail-who">
        Konsentrasi PM2.5 terukur sebesar {{ pm25 }} µg/m³ adalah {{ (pm25 / 5).toFixed(1) }} kali nilai pedoman kualitas udara tahunan WHO (5 µg/m³). Perbandingan ini disajikan sebagai indikator edukasi risiko pernapasan.
      </p>
    </section>

    <!-- Banner Perhatian Sebelum Beraktivitas -->
    <section class="detail-alert">
      <div>
        <span class="eyebrow">PERHATIKAN SEBELUM BERAKTIVITAS</span>
        <h2>{{ aqi > 100 ? 'Batasi paparan, jaga napasmu.' : 'Tetap pantau udara sebelum keluar.' }}</h2>
        <p>
          {{
            aqi > 100
              ? 'Kelompok sensitif sebaiknya mengurangi aktivitas berat di luar. Gunakan masker N95 jika harus keluar dan pilih ruang dengan udara lebih bersih.'
              : 'Udara relatif lebih baik. Tetap perhatikan kondisi tubuh, terutama jika memiliki gangguan pernapasan.'
          }}
        </p>
      </div>
    </section>

    <!-- Rencanakan Aktivitasmu / Prakiraan Per Jam -->
    <section class="detail-section">
      <div class="detail-section-heading">
        <div>
          <span class="eyebrow">RENCANAKAN AKTIVITASMU</span>
          <h2>Prakiraan per jam.</h2>
          <p>Simulasi AQI, suhu, angin, dan kelembapan di {{ city }}.</p>
        </div>
        <div class="segmented" aria-label="Hari prakiraan">
          <button
            v-for="(label, index) in days"
            :key="label"
            type="button"
            :class="day === index ? 'selected' : ''"
            :aria-pressed="day === index"
            @click="day = index"
          >
            {{ label }}
          </button>
        </div>
      </div>
      <div
        class="hourly-scroll"
        tabindex="0"
        role="region"
        :aria-label="`Prakiraan per jam ${days[day]}, gulir untuk melihat semua jam`"
      >
        <div class="hourly-grid">
          <div v-for="item in hourly" :key="item.hour" class="hourly-item">
            <span>{{ item.hour === 0 && day === 0 ? 'Sekarang' : `${String(item.hour).padStart(2, '0')}:00` }}</span>
            <strong
              :class="['forecast-aqi', getForecastAqiClass(item.aqi)]"
              :style="getForecastAqiStyle(item.aqi)"
              :title="`${item.aqi} AQI · ${category(item.aqi)}`"
            >
              {{ item.aqi }}<small style="color: inherit; opacity: 0.85;">AQI</small>
            </strong>
            <WeatherIcon />
            <b>{{ item.temperature }}°</b>
            <WeatherIcon kind="wind" />
            <span>{{ item.wind }} km/h</span>
            <WeatherIcon kind="humidity" />
            <span>{{ item.humidity }}%</span>
          </div>
        </div>
      </div>
      <small class="detail-caption">
        Geser untuk melihat 24 jam · Semua waktu mengikuti lokasi terpilih · Data ilustratif
      </small>
    </section>

    <!-- Gambaran Pekan Ini / Prakiraan Harian (7 Hari) -->
    <section class="detail-section">
      <div class="detail-section-heading">
        <div>
          <span class="eyebrow">GAMBARAN PEKAN INI</span>
          <h2>Prakiraan harian.</h2>
        </div>
        <span class="small-label">7 HARI · PRAKIRAAN TERKALIBRASI</span>
      </div>
      <div class="daily-scroll">
        <table class="daily-table">
          <thead>
            <tr>
              <th scope="col">Hari</th>
              <th scope="col">US AQI</th>
              <th scope="col">Kondisi udara</th>
              <th scope="col">Suhu</th>
              <th scope="col">Angin</th>
              <th scope="col">Kelembapan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(label, index) in dailyDays" :key="label">
              <th scope="row">{{ label }}</th>
              <td>
                <strong
                  :class="['forecast-aqi', getForecastAqiClass(Math.max(35, aqi + dailyOffsets[index]))]"
                  :style="getForecastAqiStyle(Math.max(35, aqi + dailyOffsets[index]))"
                  :title="`${Math.max(35, aqi + dailyOffsets[index])} AQI · ${category(Math.max(35, aqi + dailyOffsets[index]))}`"
                >
                  {{ Math.max(35, aqi + dailyOffsets[index]) }}
                </strong>
              </td>
              <td>{{ category(Math.max(35, aqi + dailyOffsets[index])) }}</td>
              <td>
                <span class="weather-inline">
                  <WeatherIcon />
                  {{ (realtimeData?.temperature ? Math.round(realtimeData.temperature + 2 - (index % 2)) : 32 - (index % 2)) }}° <small>/ {{ (realtimeData?.temperature ? Math.round(realtimeData.temperature - 5 + (index % 3)) : 25 + (index % 3)) }}°</small>
                </span>
              </td>
              <td>{{ (realtimeData?.windSpeedKmh ? Math.round(realtimeData.windSpeedKmh + index) : 14 + index) }} km/h</td>
              <td>{{ (realtimeData?.humidity ? Math.round(realtimeData.humidity - index) : 70 - index) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.detail-current {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 1.5rem;
  align-items: stretch;
}

.detail-aqi {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.75rem;
  height: 100%;
  box-sizing: border-box;
}

.detail-aqi .status-badge {
  align-self: flex-start;
  margin-top: 1rem;
}

.detail-weather {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.75rem;
  height: 100%;
  box-sizing: border-box;
}

.detail-weather-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.detail-weather-grid > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
}

.detail-weather-grid strong {
  font-size: 1.35rem;
  font-weight: 600;
  white-space: nowrap;
}

.detail-weather-grid span {
  font-size: var(--text-label, 0.875rem);
  color: var(--muted);
  line-height: 1.4;
}

@media (max-width: 960px) {
  .detail-current {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .detail-weather-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

@media (max-width: 480px) {
  .detail-weather-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
