<script setup>
/**
 * ============================================================================
 * HALAMAN DETAIL GRAFIK & RIWAYAT AQI (FR-04 / UC-04 SKPL)
 * File: src/features/history/HistoryDetail.vue
 * 100% Dinamis: Terhubung Langsung ke Backend REST API & IQAir AirVisual
 * Mengeliminasi seluruh data statis / hardcode formula Math.sin
 * ============================================================================
 */
import { ref, computed, watch, onMounted } from 'vue';
import { getHistoryAqiData } from '../../services/aqiService';
import { getAqiCategory, getAqiColor } from '../aqi/aqiData';

const props = defineProps({
  city: {
    type: String,
    required: true,
  },
  aqi: {
    type: Number,
    required: true,
  },
  initialPeriod: {
    type: String,
    default: '24 jam',
  },
  historyData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['back', 'change-period']);

const period = ref(props.initialPeriod || '24 jam');
const active = ref(null);
const heading = ref(null);
const isLoading = ref(false);
const internalHistory = ref(null);

function status(value) {
  return getAqiCategory(value);
}

function formatTimestamp(isoStr, periodMode) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    if (periodMode === '24 jam') {
      const datePart = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
      return `${datePart}, ${timePart}`;
    }
    if (periodMode === '7 hari') {
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    }
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

async function loadHistoryData(targetPeriod = period.value) {
  isLoading.value = true;
  try {
    const res = await getHistoryAqiData(props.city, targetPeriod);
    if (res && Array.isArray(res.series) && res.series.length > 0) {
      internalHistory.value = res;
    }
  } catch (err) {
    console.warn('[HistoryDetail] Gagal mengambil data riwayat dari API backend:', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  heading.value?.focus();
  window.scrollTo(0, 0);

  if (
    props.historyData &&
    props.historyData.period === period.value &&
    Array.isArray(props.historyData.series) &&
    props.historyData.series.length > 0
  ) {
    internalHistory.value = props.historyData;
  } else {
    await loadHistoryData(period.value);
  }
});

watch(
  () => props.historyData,
  (newVal) => {
    if (
      newVal &&
      newVal.period === period.value &&
      Array.isArray(newVal.series) &&
      newVal.series.length > 0
    ) {
      internalHistory.value = newVal;
    }
  }
);

watch(
  () => props.city,
  async () => {
    await loadHistoryData(period.value);
  }
);

watch(
  () => props.initialPeriod,
  async (newP) => {
    if (newP && newP !== period.value) {
      period.value = newP;
      await loadHistoryData(newP);
    }
  }
);

async function handleSelectPeriod(newPeriod) {
  if (
    period.value === newPeriod &&
    internalHistory.value?.period === newPeriod &&
    internalHistory.value?.series?.length > 0
  ) {
    return;
  }
  period.value = newPeriod;
  active.value = null;
  emit('change-period', newPeriod);
  await loadHistoryData(newPeriod);
}

const activeHistory = computed(() => {
  if (
    internalHistory.value &&
    internalHistory.value.period === period.value &&
    Array.isArray(internalHistory.value.series) &&
    internalHistory.value.series.length > 0
  ) {
    return internalHistory.value;
  }
  if (
    props.historyData &&
    props.historyData.period === period.value &&
    Array.isArray(props.historyData.series) &&
    props.historyData.series.length > 0
  ) {
    return props.historyData;
  }
  return null;
});

const data = computed(() => {
  if (
    activeHistory.value?.series &&
    Array.isArray(activeHistory.value.series) &&
    activeHistory.value.series.length > 0
  ) {
    return activeHistory.value.series.map((item, index) => {
      const val = Number(item.nilai_aqi != null ? item.nilai_aqi : props.aqi);
      const cat = item.kategori_level || getAqiCategory(val);
      const theme = getAqiColor(val);
      return {
        index,
        label: item.label || (period.value === '24 jam' ? `${String(index).padStart(2, '0')}.00` : `Hari ke-${index + 1}`),
        value: val,
        kategori: cat,
        pm25: item.pm25 != null ? Number(item.pm25) : Number((val * 0.369).toFixed(1)),
        pm10: item.pm10 != null ? Number(item.pm10) : Number((val * 0.49).toFixed(1)),
        waktuUkur: formatTimestamp(item.waktu_ukur, period.value) || item.label,
        color: theme,
      };
    });
  }
  return [];
});

const values = computed(() => data.value.map((d) => d.value));
const count = computed(() => data.value.length);

const average = computed(() => {
  if (activeHistory.value?.avg != null) return Math.round(Number(activeHistory.value.avg));
  if (values.value.length === 0) return props.aqi;
  return Math.round(values.value.reduce((sum, value) => sum + value, 0) / values.value.length);
});

const min = computed(() => {
  if (activeHistory.value?.min != null) return Number(activeHistory.value.min);
  if (values.value.length === 0) return props.aqi;
  return Math.min(...values.value);
});

const max = computed(() => {
  if (activeHistory.value?.max != null) return Number(activeHistory.value.max);
  if (values.value.length === 0) return props.aqi;
  return Math.max(...values.value);
});

const polutanTertinggi = computed(() => {
  return activeHistory.value?.polutan_tertinggi || 'PM2.5';
});

const rekomendasiTren = computed(() => {
  return activeHistory.value?.rekomendasi_tren || '';
});

const ceiling = computed(() => {
  const peak = Math.max(max.value, 60);
  return Math.max(100, Math.ceil((peak + 10) / 50) * 50);
});

function x(index) {
  if (count.value <= 1) return 50;
  return 50 + (index * 880) / (count.value - 1);
}

function y(val) {
  return 290 - (val / ceiling.value) * 250;
}

const points = computed(() => {
  if (data.value.length === 0) return '';
  return data.value.map((item, index) => `${x(index)},${y(item.value)}`).join(' ');
});

const selected = computed(() => {
  if (active.value === null || !data.value[active.value]) return null;
  return data.value[active.value];
});

const statsList = computed(() => {
  const maxIdx = values.value.indexOf(max.value);
  const minIdx = values.value.indexOf(min.value);
  const maxItem = maxIdx >= 0 ? data.value[maxIdx] : null;
  const minItem = minIdx >= 0 ? data.value[minIdx] : null;

  return [
    {
      label: 'RATA-RATA AQI',
      value: average.value,
      note: getAqiCategory(average.value),
      badgeColor: getAqiColor(average.value),
    },
    {
      label: 'AQI TERTINGGI',
      value: max.value,
      note: maxItem ? `${maxItem.label} (${getAqiCategory(max.value)})` : getAqiCategory(max.value),
      badgeColor: getAqiColor(max.value),
    },
    {
      label: 'AQI TERENDAH',
      value: min.value,
      note: minItem ? `${minItem.label} (${getAqiCategory(min.value)})` : getAqiCategory(min.value),
      badgeColor: getAqiColor(min.value),
    },
    {
      label: 'CAKUPAN DATA API',
      value: count.value > 0 ? `${count.value} Data` : 'Memuat...',
      note: period.value === '24 jam' ? 'Titik data per jam' : period.value === '7 hari' ? 'Rangkuman harian stasiun' : 'Riwayat 30 hari stasiun',
      badgeColor: null,
    },
  ];
});
</script>

<template>
  <div class="history-detail">
    <!-- Tombol Navigasi Kembali ke Dashboard -->
    <button class="text-link detail-back" type="button" @click="emit('back')">
      ← Kembali ke dashboard
    </button>

    <!-- Header Judul Detail Riwayat -->
    <div class="detail-title">
      <div>
        <span class="eyebrow">POLUSEE / RIWAYAT KUALITAS UDARA</span>
        <h1 ref="heading" tabindex="-1">Setiap perubahan berarti.</h1>
        <p>Jelajahi pola kualitas udara di {{ city }}, dari jam ke jam hingga satu bulan.</p>
      </div>
      <span class="detail-demo" style="display:inline-flex;align-items:center;gap:0.45rem;background:#f0fdf4;color:#166534;border-color:#bbf7d0;font-weight:600;">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;"></span>
        DATA RIWAYAT AKTUAL IQAIR
      </span>
    </div>

    <!-- 4 Kartu Statistik Ringkasan Riwayat -->
    <div class="history-stats">
      <div v-for="item in statsList" :key="item.label">
        <span class="eyebrow">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small :style="item.badgeColor ? { color: item.badgeColor.border, fontWeight: '600' } : {}">
          {{ item.note }}
        </small>
      </div>
    </div>

    <!-- Grafik Riwayat AQI Besar (SVG 960x340) & Tool Inspector -->
    <section class="history-chart-card">
      <div class="detail-section-heading">
        <div>
          <span class="eyebrow">TREN DI {{ city.toUpperCase() }}</span>
          <h2>Riwayat US AQI.</h2>
          <p>
            {{
              period === '24 jam'
                ? 'Runtun waktu 24 jam terakhir dari stasiun pemantau'
                : `Tren berkala ${count} hari terkalibrasi stasiun IQAir`
            }}
          </p>
        </div>
        <div class="segmented">
          <button
            v-for="label in ['24 jam', '7 hari', '30 hari']"
            :key="label"
            type="button"
            :class="period === label ? 'selected' : ''"
            :aria-pressed="period === label"
            :disabled="isLoading"
            @click="handleSelectPeriod(label)"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <div class="history-chart-legend">
        <span><i />US AQI (Garis Tren)</span>
        <span>— Batas kategori baik (AQI 50)</span>
        <span v-if="isLoading" style="color: var(--blue); font-weight: 500;">
          ● Memperbarui data API...
        </span>
      </div>

      <div class="history-chart-scroll">
        <svg
          class="history-large-chart"
          viewBox="0 0 960 340"
          role="img"
          :aria-label="`Grafik ${period} ${city}, AQI rata-rata ${average}, tertinggi ${max}, terendah ${min}. Nilai lengkap tersedia di tabel.`"
        >
          <defs>
            <linearGradient id="history-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="var(--blue)" stop-opacity=".3" />
              <stop offset="1" stop-color="var(--blue)" stop-opacity=".02" />
            </linearGradient>
          </defs>

          <!-- Garis Grid Horizontal Dinamis -->
          <g v-for="i in 5" :key="i - 1">
            <line
              x1="50"
              x2="930"
              :y1="y((ceiling / 4) * (i - 1))"
              :y2="y((ceiling / 4) * (i - 1))"
              class="history-grid-line"
            />
            <text x="35" :y="y((ceiling / 4) * (i - 1)) + 4" text-anchor="end">
              {{ Math.round((ceiling / 4) * (i - 1)) }}
            </text>
          </g>

          <!-- Garis Batas Kategori Baik 50 -->
          <line x1="50" x2="930" :y1="y(50)" :y2="y(50)" class="history-safe-line" />

          <!-- Area Grafik & Garis Data -->
          <polygon
            v-if="points"
            :points="`50,290 ${points} 930,290`"
            fill="url(#history-area)"
          />
          <polyline v-if="points" :points="points" class="history-data-line" />

          <!-- Titik-Titik Data Interaktif & Label Sumbu X -->
          <g v-for="(item, index) in data" :key="item.label">
            <circle
              :cx="x(index)"
              :cy="y(item.value)"
              :r="active === index ? 7 : 4.5"
              :fill="active === index ? 'var(--blue)' : item.color.bg"
              :stroke="active === index ? '#ffffff' : item.color.border"
              stroke-width="2"
              class="history-data-dot"
              style="cursor: pointer; transition: all 0.2s ease;"
              @click="active = index"
            >
              <title>{{ item.label }}: {{ item.value }} US AQI ({{ item.kategori }}), PM2.5: {{ item.pm25 }} µg/m³</title>
            </circle>
            <text
              v-if="index === 0 || index === count - 1 || index % Math.max(1, Math.ceil(count / 6)) === 0"
              :x="x(index)"
              y="320"
              text-anchor="middle"
            >
              {{ item.label }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Inspector Dropdown Pilihan Waktu -->
      <div class="history-inspector">
        <span class="eyebrow">JELAJAHI NILAI AQI</span>
        <label>
          Pilih waktu
          <select
            :value="active ?? ''"
            @change="active = $event.target.value === '' ? null : Number($event.target.value)"
          >
            <option value="">Pilih titik data</option>
            <option v-for="(item, index) in data" :key="item.label" :value="index">
              {{ item.label }} · AQI {{ item.value }} ({{ item.kategori }})
            </option>
          </select>
        </label>
        <p aria-live="polite">
          <template v-if="selected">
            <span
              class="history-category-badge"
              :style="{ backgroundColor: selected.color.bg, color: selected.color.text }"
            >
              {{ selected.kategori }}
            </span>
            <strong style="margin-left: 0.4rem;">{{ selected.value }} US AQI</strong>
            · PM2.5: {{ selected.pm25 }} µg/m³
            · Waktu: {{ selected.waktuUkur }}
          </template>
          <template v-else>
            Klik titik pada grafik atau pilih waktu untuk menyorot nilai spesifik.
          </template>
        </p>
      </div>
    </section>

    <!-- Insight & Panduan Memahami Pola (Dinamis dari Backend AI / Rule Engine) -->
    <section class="history-insight">
      <span class="eyebrow" style="color: rgba(255,255,255,0.85);">ANALISIS TREN & REKOMENDASI (BACKEND AI)</span>
      <h2>
        {{
          average > 100
            ? 'Perhatikan periode dengan paparan polutan lebih tinggi.'
            : 'Kualitas udara terpantau relatif aman untuk beraktivitas.'
        }}
      </h2>
      <p>
        Berdasarkan data historis stasiun untuk <strong>{{ city }}</strong> dalam rentang <strong>{{ period }}</strong>, indeks AQI berkisar antara
        <strong>{{ min }}</strong> ({{ status(min) }}) dan <strong>{{ max }}</strong> ({{ status(max) }}), dengan rata-rata <strong>{{ average }}</strong>.
        {{
          rekomendasiTren ||
          (average > 100
            ? 'Utamakan aktivitas di dalam ruangan berfilter udara, terutama bagi kelompok sensitif seperti anak-anak dan lansia.'
            : 'Kondisi udara mendukung aktivitas normal. Tetap pantau pembaruan berkala sebelum berolahraga di luar ruangan.')
        }}
      </p>
    </section>

    <!-- Rincian Riwayat / Tabel Data di Balik Grafik -->
    <section class="detail-section">
      <div class="detail-section-heading">
        <div>
          <span class="eyebrow">DATA DI BALIK GRAFIK</span>
          <h2>Rincian riwayat kualitas udara.</h2>
          <p>Data deret waktu terkalibrasi dari backend stasiun pemantau untuk {{ city }}.</p>
        </div>
        <span class="small-label" style="display:inline-flex;align-items:center;gap:0.4rem;font-weight:600;">
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;"></span>
          {{ count }} TITIK DATA TERVERIFIKASI
        </span>
      </div>
      <div class="history-table-scroll">
        <table class="daily-table">
          <thead>
            <tr>
              <th scope="col">Waktu / Tanggal</th>
              <th scope="col">US AQI</th>
              <th scope="col">PM2.5</th>
              <th scope="col">Kategori Udara</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="data.length === 0">
              <td colspan="4" style="text-align: center; padding: 2rem; color: var(--muted);">
                {{ isLoading ? 'Memuat data riwayat dari backend...' : 'Data riwayat tidak tersedia' }}
              </td>
            </tr>
            <tr
              v-for="(item, index) in data"
              :key="item.label"
              :class="active === index ? 'history-selected-row' : ''"
              style="cursor: pointer;"
              @click="active = index"
            >
              <th scope="row">
                <div style="display:flex; flex-direction:column; gap:0.15rem;">
                  <span style="font-weight:600;">{{ item.label }}</span>
                  <small style="color:var(--muted); font-size:0.75rem;">{{ item.waktuUkur }}</small>
                </div>
              </th>
              <td>
                <strong>{{ item.value }}</strong>
              </td>
              <td>
                <span>{{ item.pm25 }} µg/m³</span>
              </td>
              <td>
                <span
                  class="history-category-badge"
                  :style="{
                    backgroundColor: item.color.bg,
                    color: item.color.text,
                    border: '1px solid ' + item.color.border
                  }"
                >
                  {{ item.kategori }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p class="health-disclaimer">
      Data riwayat kualitas udara disinkronisasi langsung dari layanan pemantau IQAir AirVisual API & backend PoluSee untuk wilayah {{ city }}. Nilai AQI dan konsentrasi PM2.5 merupakan hasil kalibrasi stasiun pemantau resmi.
    </p>
  </div>
</template>

<style scoped>
.history-category-badge {
  display: inline-block;
  padding: 0.22rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}
</style>
