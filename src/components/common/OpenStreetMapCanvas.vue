<script setup>
/**
 * ============================================================================
 * KOMPONEN PETA INTERAKTIF OPENSTREETMAP API (LEAFLET + REAL IQAIR STATIONS)
 * File: src/components/common/OpenStreetMapCanvas.vue
 * ============================================================================
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';
import { EXTERNAL_API_CONFIG } from '../../config/externalApi';
import { CITY_COORDINATES } from '../../features/map/stationsData';

const props = defineProps({
  city: {
    type: String,
    default: 'Samarinda',
  },
  zoomScale: {
    type: Number,
    default: 1,
  },
  interactive: {
    type: Boolean,
    default: true,
  },
  stations: {
    type: Array,
    default: () => [],
  },
  selectedStation: {
    type: String,
    default: '',
  },
  userLocation: {
    type: Object,
    default: null,
  },
  isLiveTracking: {
    type: Boolean,
    default: false,
  },
  showHeat: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select-station']);

const mapContainer = ref(null);
let mapInstance = null;
let markersLayer = null;
let heatLayer = null;
let userLocationMarker = null;

// Menggunakan skema warna yang identik dengan Card AQI di bagian Home (aqiData.js)
function getAqiColor(val) {
  const v = Number(val) || 0;
  if (v <= 50) return { bg: '#a1b699', text: '#162e15', label: 'Baik', border: '#84a17c' };
  if (v <= 100) return { bg: '#d4c66e', text: '#263b3e', label: 'Sedang', border: '#b8aa53' };
  if (v <= 150) return { bg: '#c79854', text: '#ffffff', label: 'Sensitif', border: '#a87a38' };
  if (v <= 200) return { bg: '#c27c65', text: '#ffffff', label: 'Tidak Sehat', border: '#a15f4a' };
  if (v <= 300) return { bg: '#9c7e91', text: '#ffffff', label: 'Sangat Tidak Sehat', border: '#7f6375' };
  return { bg: '#87636b', text: '#ffffff', label: 'Berbahaya', border: '#68444c' };
}

function getTargetZoom(city, scale) {
  const baseZoom = CITY_COORDINATES[city]?.zoom || 13;
  const zoomOffset = Math.round((scale - 1) * 5);
  return Math.min(18, Math.max(10, baseZoom + zoomOffset));
}

function renderHeatLayer() {
  if (!mapInstance || !L) return;

  if (heatLayer) {
    heatLayer.clearLayers();
  } else {
    heatLayer = L.layerGroup().addTo(mapInstance);
  }

  if (!props.showHeat) return;

  const list = props.stations && props.stations.length > 0
    ? props.stations
    : (CITY_COORDINATES[props.city]?.stations || []).map((s) => ({
        ...s,
        aqi: 100,
      }));

  list.forEach((st) => {
    if (st.lat == null || st.lon == null) return;
    const aqiVal = Number(st.aqi || st.value || 100);
    const theme = getAqiColor(aqiVal);

    // Halo atmosferik luar (dispersi luas)
    const outerRadius = aqiVal > 200 ? 24000 : aqiVal > 100 ? 18000 : 12000;
    const outerCircle = L.circle([st.lat, st.lon], {
      radius: outerRadius,
      fillColor: theme.bg,
      color: theme.bg,
      weight: 0,
      fillOpacity: aqiVal > 150 ? 0.18 : 0.12,
      interactive: false,
    });
    heatLayer.addLayer(outerCircle);

    // Inti konsentrasi partikulat (dispersi dekat stasiun)
    const innerRadius = aqiVal > 200 ? 12000 : aqiVal > 100 ? 8500 : 5500;
    const innerCircle = L.circle([st.lat, st.lon], {
      radius: innerRadius,
      fillColor: theme.bg,
      color: theme.bg,
      weight: 0,
      fillOpacity: aqiVal > 150 ? 0.38 : 0.28,
      interactive: false,
    });
    heatLayer.addLayer(innerCircle);
  });
}

function renderStationMarkers() {
  if (!mapInstance || !L) return;

  if (markersLayer) {
    markersLayer.clearLayers();
  } else {
    markersLayer = L.layerGroup().addTo(mapInstance);
  }

  const list = props.stations && props.stations.length > 0
    ? props.stations
    : (CITY_COORDINATES[props.city]?.stations || []).map((s) => ({
        ...s,
        aqi: 100,
      }));

  list.forEach((st) => {
    if (st.lat == null || st.lon == null) return;
    const isSelected = props.selectedStation && st.name === props.selectedStation;
    const aqiVal = Number(st.aqi || st.value || 100);
    const theme = getAqiColor(aqiVal);

    const markerHtml = `
      <div class="custom-osm-marker ${isSelected ? 'marker-selected' : ''} ${st.isPrimary ? 'primary-iqair' : ''}">
        <div class="marker-pill" style="background-color: ${theme.bg}; color: ${theme.text};">
          <span class="marker-val">${aqiVal}</span>
          ${st.isPrimary ? '<span class="marker-iqair-dot" title="Stasiun Fisik IQAir"></span>' : ''}
        </div>
        <div class="marker-arrow" style="border-top-color: ${theme.bg};"></div>
        <div class="marker-station-name">${st.name}</div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'osm-custom-div-icon',
      html: markerHtml,
      iconSize: [160, 60],
      iconAnchor: [80, 24],
      popupAnchor: [0, -26],
    });

    const marker = L.marker([st.lat, st.lon], { icon });

    const popupContent = `
      <div style="font-family: inherit; font-size: 13px; min-width: 175px; padding: 4px;">
        <div style="font-weight: 700; font-size: 13px; color: #111; margin-bottom: 4px;">${st.name}</div>
        <div style="display:flex; align-items:center; gap: 6px; margin: 6px 0;">
          <span style="display:inline-block; padding: 2px 7px; border-radius: 4px; font-size: 12px; font-weight: 700; background:${theme.bg}; color:${theme.text};">${aqiVal} AQI</span>
          <span style="font-weight: 600; font-size: 12px; color: #333;">${st.category || theme.label}</span>
        </div>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">PM2.5: <b>${st.pm25 || '--'} µg/m³</b></div>
        ${st.temperature ? `<div style="font-size: 11px; color: #666;">Suhu: <b>${st.temperature}°C</b> · Lembab: <b>${st.humidity || '--'}%</b></div>` : ''}
        ${st.isPrimary ? '<div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #eee; font-size: 10.5px; color: #0066cc; font-weight: 700;">★ Stasiun Fisik Resmi IQAir</div>' : '<div style="margin-top: 4px; font-size: 10px; color: #888;">Titik Pantau Terkalibrasi</div>'}
      </div>
    `;

    marker.bindPopup(popupContent);

    marker.on('click', () => {
      emit('select-station', st.name);
    });

    if (isSelected) {
      marker.openPopup();
    }

    markersLayer.addLayer(marker);
  });
}

function renderUserLocationMarker() {
  if (!mapInstance || !L) return;

  if (userLocationMarker) {
    userLocationMarker.remove();
    userLocationMarker = null;
  }

  if (!props.userLocation || props.userLocation.lat == null || props.userLocation.lon == null) {
    return;
  }

  const userHtml = `
    <div class="user-location-marker" title="Lokasi Perangkat Anda Saat Ini (Live GPS Tracking)">
      <div class="user-location-pulse"></div>
      <div class="user-location-dot"></div>
    </div>
  `;

  const icon = L.divIcon({
    className: 'osm-custom-div-icon',
    html: userHtml,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

  userLocationMarker = L.marker([props.userLocation.lat, props.userLocation.lon], {
    icon,
    zIndexOffset: 2000,
  }).addTo(mapInstance);

  const popupContent = `
    <div style="font-family: inherit; font-size: 13px; min-width: 175px; padding: 4px;">
      <div style="font-weight: 700; color: #1d4ed8; display:flex; align-items:center; gap: 6px;">
        <svg style="width:14px;height:14px;color:#1d4ed8;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></svg>
        <span>Posisi Perangkat Anda</span>
      </div>
      <div style="font-size: 11.5px; color: #334155; margin-top: 3px; font-weight: 600;">
        Live GPS Tracking Aktif
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-family: monospace;">
        Koordinat: ${props.userLocation.lat.toFixed(5)}, ${props.userLocation.lon.toFixed(5)}
      </div>
    </div>
  `;
  userLocationMarker.bindPopup(popupContent);
}

function initOpenStreetMap() {
  if (!mapContainer.value || mapInstance) return;

  const defaultCoords = CITY_COORDINATES[props.city] || CITY_COORDINATES.Samarinda;
  const selectedSt = (props.stations || []).find((s) => s.name === props.selectedStation);
  const initialCenter = (selectedSt && selectedSt.lat != null)
    ? [selectedSt.lat, selectedSt.lon]
    : [defaultCoords.lat, defaultCoords.lon];
  const initialZoom = getTargetZoom(props.city, props.zoomScale);

  mapInstance = L.map(mapContainer.value, {
    center: initialCenter,
    zoom: initialZoom,
    zoomControl: props.interactive,
    attributionControl: false,
    scrollWheelZoom: props.interactive,
    dragging: props.interactive,
    doubleClickZoom: props.interactive,
  });

  // OpenStreetMap Tile Layer
  L.tileLayer(EXTERNAL_API_CONFIG.OPENSTREETMAP.TILE_URL, {
    maxZoom: 19,
    attribution: EXTERNAL_API_CONFIG.OPENSTREETMAP.ATTRIBUTION,
  }).addTo(mapInstance);

  renderStationMarkers();
  renderHeatLayer();
  renderUserLocationMarker();
}

watch(
  () => props.showHeat,
  () => {
    renderHeatLayer();
  }
);

watch(
  () => props.city,
  (newCity) => {
    if (!mapInstance) return;
    const coords = CITY_COORDINATES[newCity] || CITY_COORDINATES.Samarinda;
    const targetZoom = getTargetZoom(newCity, props.zoomScale);
    mapInstance.setView([coords.lat, coords.lon], targetZoom, { animate: true });
    renderStationMarkers();
    renderHeatLayer();
  }
);

watch(
  () => props.selectedStation,
  (newSt) => {
    if (!mapInstance || !newSt) return;
    const st = (props.stations || []).find((s) => s.name === newSt);
    if (st && st.lat != null && st.lon != null) {
      const currentZoom = mapInstance.getZoom() || 13;
      const targetZoom = Math.max(12, currentZoom);
      mapInstance.setView([st.lat, st.lon], targetZoom, { animate: true });
    }
    renderStationMarkers();
    renderHeatLayer();
  }
);

watch(
  () => props.zoomScale,
  (newScale) => {
    if (!mapInstance) return;
    const targetZoom = getTargetZoom(props.city, newScale);
    mapInstance.setZoom(targetZoom, { animate: true });
  }
);

watch(
  () => props.stations,
  () => {
    renderStationMarkers();
    renderHeatLayer();
  },
  { deep: true }
);

watch(
  () => props.userLocation,
  (newLoc) => {
    if (!mapInstance) return;
    renderUserLocationMarker();
    if (newLoc && newLoc.lat != null && props.isLiveTracking) {
      mapInstance.setView([newLoc.lat, newLoc.lon], mapInstance.getZoom() || 14, { animate: true });
    }
  },
  { deep: true }
);

watch(
  () => props.isLiveTracking,
  (tracking) => {
    if (tracking && props.userLocation && props.userLocation.lat != null && mapInstance) {
      mapInstance.setView([props.userLocation.lat, props.userLocation.lon], 14, { animate: true });
      if (userLocationMarker) userLocationMarker.openPopup();
    }
  }
);

onMounted(() => {
  initOpenStreetMap();
});

onBeforeUnmount(() => {
  if (userLocationMarker) {
    userLocationMarker.remove();
    userLocationMarker = null;
  }
  if (heatLayer) {
    heatLayer.remove();
    heatLayer = null;
  }
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markersLayer = null;
  }
});
</script>

<template>
  <div ref="mapContainer" class="osm-map-layer" aria-label="Peta OpenStreetMap Interaktif" />
</template>

<style>
/* Leaflet custom marker styling */
.osm-custom-div-icon {
  background: transparent !important;
  border: none !important;
}

.custom-osm-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transform: translateZ(0);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.custom-osm-marker:hover,
.custom-osm-marker.marker-selected {
  transform: scale(1.15) translateY(-4px);
  z-index: 1000 !important;
}

.marker-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 38px;
  height: 24px;
  padding: 0 7px;
  border-radius: 9999px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25), 0 0 0 1.5px rgba(255, 255, 255, 0.85);
}

.marker-iqair-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 4px #ffffff;
}

.marker-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #111;
  margin-top: -1px;
}

.marker-station-name {
  margin-top: 3px;
  background: rgba(255, 255, 255, 0.95);
  color: #1e293b;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 650;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  white-space: nowrap;
  pointer-events: auto;
  transition: all 0.2s ease;
}

.custom-osm-marker.marker-selected .marker-station-name {
  background: #1e293b;
  color: #ffffff;
  border-color: #0f172a;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
  transform: translateY(1px);
}

.custom-osm-marker.marker-selected .marker-pill {
  box-shadow: 0 0 0 3px #111111, 0 6px 14px rgba(0, 0, 0, 0.35);
}

.custom-osm-marker.primary-iqair .marker-pill {
  border: 1px solid rgba(255, 255, 255, 0.9);
}

/* User Live Device Location Pulsating Marker */
.user-location-marker {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.user-location-dot {
  width: 14px;
  height: 14px;
  background: #2563eb;
  border: 2.5px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 7px rgba(0, 0, 0, 0.45);
  position: relative;
  z-index: 2;
}

.user-location-pulse {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.38);
  animation: user-loc-pulse 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
  z-index: 1;
}

@keyframes user-loc-pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}
</style>
