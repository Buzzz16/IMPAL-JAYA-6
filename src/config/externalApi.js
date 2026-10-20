/**
 * ============================================================================
 * PUSAT KONFIGURASI API EKSTERNAL — POLUSEE WEB PLATFORM
 * File: src/config/externalApi.js
 * Mengacu pada: Dokumen SKPL-1000 Revisi C (Bab 2.4, Bab 2.6, Bab 4.3, Bab 4.4)
 * ============================================================================
 *
 * PANDUAN COMMAND UNTUK MEMASUKKAN API EKSTERNAL:
 *
 * 1. Salin file template environment (.env.example -> .env) di terminal:
 *    Command:
 *      cp .env.example .env
 *
 * 2. Masukkan API Key pada file `.env` (atau langsung pada variabel fallback di bawah):
 *    - WAQI / AQICN API (Data Indeks Kualitas Udara Real-time):
 *      Daftar token gratis di: https://aqicn.org/data-platform/token/
 *      Command uji coba di terminal:
 *        curl "https://api.waqi.info/feed/geo:-0.5022;117.1536/?token=MASUKKAN_TOKEN_ANDA"
 *
 *    - OpenWeatherMap Air Pollution & Weather API (Cuaca & Rincian Polutan PM2.5/PM10/O3/NO2/SO2/CO):
 *      Daftar API key di: https://openweathermap.org/api/air-pollution
 *      Command uji coba di terminal:
 *        curl "https://api.openweathermap.org/data/2.5/air_pollution?lat=-0.5022&lon=117.1536&appid=MASUKKAN_API_KEY_ANDA"
 *
 *    - OpenStreetMap API (Tile Server Peta & Nominatim Geocoding/Reverse Geocoding):
 *      OpenStreetMap bersifat Open-Source & aktif secara langsung tanpa API Key berbayar.
 *      Command uji coba Reverse Geocoding di terminal:
 *        curl "https://nominatim.openstreetmap.org/reverse?format=json&lat=-0.5022&lon=117.1536"
 * ============================================================================
 */

export const EXTERNAL_API_CONFIG = {
  // --------------------------------------------------------------------------
  // [BAGIAN 1] BACKEND EXPRESS.JS REST API INTERNAL (PostgreSQL)
  // --------------------------------------------------------------------------
  BACKEND_API_URL: import.meta.env.VITE_API_BASE_URL || '/api',

  // --------------------------------------------------------------------------
  // [BAGIAN 2] OPENSTREETMAP API (PETA INTERAKTIF & GEOCODING LOKASI)
  // Digunakan pada:
  // - src/components/common/OpenStreetMapCanvas.vue (Peta Beranda & MapDetail)
  // - src/services/osmMapService.js (Nominatim Geocoding & Reverse Geocoding)
  // - src/features/community/ReportDialog.vue (Deteksi alamat laporan polusi)
  // --------------------------------------------------------------------------
  OPENSTREETMAP: {
    TILE_URL:
      import.meta.env.VITE_OSM_TILE_URL ||
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    NOMINATIM_BASE_URL:
      import.meta.env.VITE_OSM_NOMINATIM_BASE_URL ||
      'https://nominatim.openstreetmap.org',
  },

  // --------------------------------------------------------------------------
  // [BAGIAN 3] EXTERNAL AQI API — IQAIR AIRVISUAL (LIVE DATA & CUACA)
  // --------------------------------------------------------------------------
  IQAIR: {
    ENABLED: import.meta.env.VITE_ENABLE_IQAIR_API !== 'false',
    BASE_URL: import.meta.env.VITE_IQAIR_API_BASE_URL || 'https://api.airvisual.com/v2',
    API_KEY: import.meta.env.VITE_IQAIR_API_KEY || 'b960a0e6-771e-429d-8dc2-d53986eb697c',
  },

  // --------------------------------------------------------------------------
  // [BAGIAN 4] EXTERNAL AQI API — WAQI / AQICN (FR-03 & FR-12 SKPL)
  // Digunakan pada:
  // - src/services/aqiService.js -> fetchRealtimeAqiFromExternal()
  // - backend/src/modules/aqi/aqi.controller.js
  // Command untuk mengaktifkan:
  //   Set VITE_ENABLE_EXTERNAL_AQI_API=true dan isi VITE_AQICN_API_TOKEN di file .env
  // --------------------------------------------------------------------------
  AQICN: {
    ENABLED: import.meta.env.VITE_ENABLE_EXTERNAL_AQI_API === 'true',
    BASE_URL: import.meta.env.VITE_AQICN_API_BASE_URL || 'https://api.waqi.info',
    // >>> MASUKKAN TOKEN WAQI / AQICN ANDA DI `.env` ATAU GANTI STRING DI BAWAH INI <<<
    TOKEN: import.meta.env.VITE_AQICN_API_TOKEN || '',
  },

  // --------------------------------------------------------------------------
  // [BAGIAN 4] EXTERNAL WEATHER & POLLUTANT API — OPENWEATHERMAP (FR-03 & FR-04)
  // Digunakan pada:
  // - src/services/aqiService.js -> fetchWeatherAndPollutantsFromExternal()
  // Command untuk mengaktifkan:
  //   Set VITE_ENABLE_OPENWEATHER_API=true dan isi VITE_OPENWEATHER_API_KEY di file .env
  // --------------------------------------------------------------------------
  OPENWEATHER: {
    ENABLED: import.meta.env.VITE_ENABLE_OPENWEATHER_API === 'true',
    BASE_URL:
      import.meta.env.VITE_OPENWEATHER_API_BASE_URL ||
      'https://api.openweathermap.org/data/2.5',
    // >>> MASUKKAN API KEY OPENWEATHERMAP ANDA DI `.env` ATAU GANTI STRING DI BAWAH INI <<<
    API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY || '',
  },
};
