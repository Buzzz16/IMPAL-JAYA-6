<script setup>
/**
 * ============================================================================
 * KARTU AQI REAL-TIME BERANDA (FR-03 / UC-03 TAMPIL AQI REAL-TIME)
 * File: src/features/aqi/AqiRealtimeCard.vue
 * Terintegrasi penuh dengan IQAir AirVisual API & Backend
 * Warna tampilan adaptif secara dinamis sesuai indikator warna kesehatan AQI
 * Grid 2x2 Presisi Pixel-Perfect (Polutan, Cuaca, Angin, Timestamp)
 * ============================================================================
 */
import { computed } from 'vue';
import AppIcon from '../../components/common/AppIcon.vue';
import { getDefaultPollutants, getAqiTheme, getAqiScalePercent } from './aqiData';

const props = defineProps({
  city: {
    type: String,
    required: true,
  },
  aqi: {
    type: Number,
    required: true,
  },
  pm25: {
    type: Number,
    default: null,
  },
  pm10: {
    type: Number,
    default: null,
  },
  updatedAt: {
    type: String,
    default: '11.00 WITA',
  },
  weather: {
    type: Object,
    default: () => ({}),
  },
  realtimeData: {
    type: Object,
    default: () => ({}),
  },
  source: {
    type: String,
    default: 'IQAIR_LIVE_API',
  },
});

const emit = defineEmits(['open-detail']);

const theme = computed(() => getAqiTheme(props.aqi));
const pointerPos = computed(() => getAqiScalePercent(props.aqi));

// 1. Polutan PM2.5
const displayPm25 = computed(() => props.pm25 ?? props.realtimeData?.pm25 ?? getDefaultPollutants(props.city).pm25);

// 2. Suhu (°C)
const tempVal = computed(() => props.weather?.temperature ?? props.realtimeData?.temperature ?? 30);

const cardStyles = computed(() => ({
  backgroundColor: theme.value.cardBg,
  borderColor: theme.value.cardBorder,
  transition: 'background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease',
}));

function handleKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emit('open-detail');
  }
}
</script>

<template>
  <section
    class="aqi-card aqi-card-action"
    :class="`aqi-tier-${theme.tier}`"
    :style="cardStyles"
    role="link"
    tabindex="0"
    :aria-label="`Lihat detail kualitas udara di ${city}`"
    @click="emit('open-detail')"
    @keydown="handleKeydown"
  >
    <div class="panel-top">
      <span class="eyebrow" :style="{ color: theme.descColor }">KUALITAS UDARA SAAT INI</span>
    </div>
    <div class="aqi-main">
      <div>
        <span class="aqi-number" :style="{ color: theme.textColor }">{{ aqi }}</span>
        <span class="aqi-unit" :style="{ color: theme.unitColor }">US AQI</span>
      </div>
      <div class="sun-art" :style="{ color: theme.sunArt }">
        <AppIcon name="sun" :size="90" />
      </div>
    </div>
    <div
      class="status-badge"
      :style="{
        backgroundColor: theme.badgeBg,
        borderColor: theme.badgeBorder,
        color: theme.badgeText,
      }"
    >
      <i :style="{ backgroundColor: theme.badgeDot }" />{{ theme.label }}
    </div>
    <p class="aqi-description" :style="{ color: theme.descColor }">
      {{ theme.description }}
    </p>
    <div class="aqi-scale">
      <span :class="{ 'scale-active': theme.level === 1 }" />
      <span :class="{ 'scale-active': theme.level === 2 }" />
      <span :class="{ 'scale-active': theme.level === 3 }" />
      <span :class="{ 'scale-active': theme.level === 4 }" />
      <span :class="{ 'scale-active': theme.level === 5 }" />
      <span :class="{ 'scale-active': theme.level === 6 }" />
      <b :style="{ left: `${pointerPos}%`, color: theme.scalePointer }">▾</b>
    </div>
    <div class="scale-labels">
      <span :style="{ color: theme.level === 1 ? theme.textColor : theme.descColor, fontWeight: theme.level === 1 ? '700' : '500' }">
        0 · Baik
      </span>
      <span :style="{ color: theme.level === 6 ? theme.textColor : theme.descColor, fontWeight: theme.level === 6 ? '700' : '500' }">
        300+ · Berbahaya
      </span>
    </div>

    <!-- Rincian Polutan PM2.5 & Suhu Real-Time -->
    <div class="aqi-metrics-grid" :style="{ borderTopColor: theme.divider }">
      <!-- Kolom 1: POLUTAN PM2.5 -->
      <div class="metric-cell metric-cell-left" :style="{ borderRightColor: theme.divider }">
        <span class="metric-label" :style="{ color: theme.descColor }">POLUTAN PM2.5</span>
        <strong class="metric-value" :style="{ color: theme.textColor }">
          <span>PM2.5 {{ displayPm25 }}</span>
          <small :style="{ color: theme.unitColor }">µg/m³</small>
        </strong>
      </div>

      <!-- Kolom 2: SUHU -->
      <div class="metric-cell metric-cell-right">
        <span class="metric-label" :style="{ color: theme.descColor }">SUHU</span>
        <strong class="metric-value" :style="{ color: theme.textColor }">
          <AppIcon name="sun" :size="14" />
          <span>{{ tempVal }}°C</span>
        </strong>
      </div>
    </div>
  </section>
</template>

<style scoped>
.aqi-scale {
  position: relative;
}
.aqi-scale b {
  position: absolute;
  top: -16px;
  transform: translateX(-50%);
  font-size: 16px;
  line-height: 1;
  transition: left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}
.scale-active {
  box-shadow: 0 0 0 1.5px rgba(38, 59, 62, 0.45);
  transform: scaleY(1.3);
  border-radius: 1px;
}

/* Layout 1 Row 2 Kolom (Polutan PM2.5 & Suhu) */
.aqi-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top-width: 1px;
  border-top-style: solid;
  margin-top: 1.15rem;
  padding: 0;
  width: 100%;
}

.metric-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
}

.metric-cell-left {
  padding: 0.85rem 1rem 0.85rem 0;
  border-right-width: 1px;
  border-right-style: solid;
}

.metric-cell-right {
  padding: 0.85rem 0 0.85rem 1.15rem;
}

.metric-label {
  font-size: var(--text-caption);
  letter-spacing: 1.1px;
  font-weight: 650;
  display: block;
  margin-bottom: 0.4rem;
  line-height: 1.2;
}

.metric-value {
  font-size: var(--text-label);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  line-height: 1.3;
}

.metric-value small {
  font-size: var(--text-caption);
  font-weight: 400;
}
</style>
