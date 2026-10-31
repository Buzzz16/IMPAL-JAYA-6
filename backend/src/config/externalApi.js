/**
 * ============================================================================
 * KONFIGURASI API EKSTERNAL SISI SERVER (BACKEND EXPRESS.JS)
 * File: backend/src/config/externalApi.js
 * Mengacu pada: Requirement #5 & #6 serta Bab 4.3 / 4.4 SKPL-1000 Revisi C
 * ============================================================================
 *
 * [COMMAND UNTUK MEMASUKKAN API EKSTERNAL DI BACKEND]
 * 1. Salin file environment di folder backend:
 *      cp backend/.env.example backend/.env
 * 2. Masukkan token / API key pada file `backend/.env`:
 *      ENABLE_EXTERNAL_AQI_API=true
 *      AQICN_API_TOKEN=token_waqi_anda
 *      ENABLE_OPENWEATHER_API=true
 *      OPENWEATHER_API_KEY=api_key_openweather_anda
 * 3. Jalankan ulang server backend:
 *      npm run server
 * ============================================================================
 */

import './loadEnv.js';

export const BACKEND_EXTERNAL_API = {
  IQAIR: {
    ENABLED: process.env.ENABLE_IQAIR_API !== 'false',
    BASE_URL: process.env.IQAIR_API_BASE_URL || 'https://api.airvisual.com/v2',
    API_KEY: process.env.IQAIR_API_KEY || 'b960a0e6-771e-429d-8dc2-d53986eb697c',
  },
  AQICN: {
    ENABLED: process.env.ENABLE_EXTERNAL_AQI_API === 'true',
    BASE_URL: process.env.AQICN_API_BASE_URL || 'https://api.waqi.info',
    TOKEN: process.env.AQICN_API_TOKEN || '',
  },
  OPENWEATHER: {
    ENABLED: process.env.ENABLE_OPENWEATHER_API === 'true',
    BASE_URL:
      process.env.OPENWEATHER_API_BASE_URL ||
      'https://api.openweathermap.org/data/2.5',
    API_KEY: process.env.OPENWEATHER_API_KEY || '',
  },
  OPENSTREETMAP: {
    NOMINATIM_BASE_URL:
      process.env.OSM_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
  },
};
