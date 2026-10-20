<script setup>
/**
 * ============================================================================
 * KARTU PETA PEMANTAUAN UDARA BERANDA — OPENSTREETMAP API + LIVE IQAIR
 * File: src/features/map/HomeMapCard.vue
 * ============================================================================
 */
import { computed } from 'vue';
import AppIcon from '../../components/common/AppIcon.vue';
import OpenStreetMapCanvas from '../../components/common/OpenStreetMapCanvas.vue';
import { getStationsForCity } from './stationsData';

const props = defineProps({
  city: {
    type: String,
    required: true,
  },
  aqi: {
    type: Number,
    required: true,
  },
  point: {
    type: String,
    required: true,
  },
  zoom: {
    type: Number,
    default: 1,
  },
  liveStations: {
    type: Array,
    default: () => [],
  },
  userLocation: {
    type: Object,
    default: null,
  },
  isLiveTracking: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:point', 'update:zoom', 'open-map-detail']);

const stations = computed(() => {
  if (props.liveStations && props.liveStations.length > 0) {
    return props.liveStations;
  }
  return getStationsForCity(props.city, props.aqi);
});

function handleCardClick(event) {
  if (!event.target.closest('button') && !event.target.closest('.leaflet-control') && !event.target.closest('.leaflet-popup')) {
    emit('open-map-detail');
  }
}

function selectStation(name) {
  emit('update:point', name);
  emit('open-map-detail');
}
</script>

<template>
  <section class="map-card map-panel-action" role="region" aria-label="Peta kualitas udara sekitarmu" @click="handleCardClick">
    <div class="section-heading map-card-header">
      <div class="header-titles">
        <span class="eyebrow">UDARA DI SEKITARMU · OPENSTREETMAP</span>
        <h2>Satu kota, titik pantau nyata.</h2>
      </div>
      <div class="heading-side">
        <span v-if="isLiveTracking && userLocation" class="live-gps-badge" title="Peta live tracking mengikuti posisi GPS perangkat Anda">
          <span class="live-gps-ping"></span>
          Live GPS Aktif
        </span>
        <span class="small-label"><AppIcon name="pin" :size="14" /> {{ stations.length }} titik pantau</span>
      </div>
    </div>
    <div class="map-canvas">
      <!-- Layer Peta Interaktif OpenStreetMap API dengan Marker Nyata IQAir & Live GPS -->
      <OpenStreetMapCanvas
        :city="city"
        :zoom-scale="zoom"
        :interactive="true"
        :stations="stations"
        :selected-station="point"
        :user-location="userLocation"
        :is-live-tracking="isLiveTracking"
        @select-station="selectStation"
      />

      <div class="map-tooltip">
        <i />
        <div class="tooltip-text">
          <strong>{{ point }}</strong>
          <span>Stasiun resmi · OpenStreetMap</span>
        </div>
      </div>

      <div class="map-zoom">
        <button
          aria-label="Perbesar peta"
          @click.stop="emit('update:zoom', Math.min(zoom + 0.2, 1.8))"
        >
          +
        </button>
        <button
          aria-label="Perkecil peta"
          @click.stop="emit('update:zoom', Math.max(zoom - 0.2, 1))"
        >
          −
        </button>
      </div>

      <div class="map-bottom-bar">
        <div class="map-key">
          <span><i class="green" />Baik</span>
          <span><i class="yellow" />Sedang</span>
          <span><i class="orange" />Sensitif</span>
        </div>
        <span class="map-attribution">OSM · IQAir Verified</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.heading-side {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.live-gps-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 9999px;
  white-space: nowrap;
}

.live-gps-ping {
  position: relative;
  display: inline-flex;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #2563eb;
}

.live-gps-ping::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1.5px solid #3b82f6;
  animation: live-ping-anim 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.map-tooltip {
  max-width: calc(100% - 72px);
  z-index: 5;
  box-sizing: border-box;
}

.tooltip-text {
  min-width: 0;
  overflow: hidden;
}

.tooltip-text strong {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-bottom-bar {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 5;
  pointer-events: none;
  gap: 6px;
}

.map-bottom-bar .map-key,
.map-bottom-bar .map-attribution {
  position: static;
  pointer-events: auto;
}

.map-bottom-bar .map-key {
  margin: 0;
}

.map-bottom-bar .map-attribution {
  font-size: 10.5px;
  background: rgba(250, 251, 241, 0.85);
  backdrop-filter: blur(4px);
  padding: 3px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

@keyframes live-ping-anim {
  75%, 100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

/* Responsif Mobile (< 640px) */
@media (max-width: 640px) {
  .map-card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 16px;
  }

  .map-card-header h2 {
    font-size: 17px;
  }

  .heading-side {
    justify-content: space-between;
    width: 100%;
  }

  .map-canvas {
    height: 270px;
  }

  .map-tooltip {
    top: 8px;
    left: 8px;
    padding: 6px 10px;
    font-size: 11px;
  }

  .map-zoom {
    top: 8px;
    right: 8px;
  }

  .map-bottom-bar {
    bottom: 6px;
    left: 6px;
    right: 6px;
  }

  .map-key {
    padding: 4px 7px;
    gap: 8px;
    font-size: 11px;
  }
}
</style>
