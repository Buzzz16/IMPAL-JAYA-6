/**
 * ============================================================================
 * LAYANAN PETA & GEOCODING OPENSTREETMAP API
 * File: src/services/osmMapService.js
 * Mengacu pada: Requirement #6 (OpenStreetMap API) & UC-03 / UC-09 SKPL-1000
 * ============================================================================
 *
 * [EXTERNAL API INTEGRATION — OPENSTREETMAP NOMINATIM & HTML5 GEOLOCATION]
 *
 * 1. Endpoint Reverse Geocoding (Koordinat GPS -> Nama Kota/Kecamatan/Jalan):
 *    GET https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=16&addressdetails=1
 *    Command uji coba terminal:
 *      curl -A "PoluSeeWebPlatform/2.0" "https://nominatim.openstreetmap.org/reverse?format=json&lat=-0.5022&lon=117.1536"
 *
 * 2. Endpoint Forward Geocoding / Pencarian Lokasi (Nama Tempat -> Koordinat Lat/Lon):
 *    GET https://nominatim.openstreetmap.org/search?format=json&q={query}&countrycodes=id&limit=5
 *    Command uji coba terminal:
 *      curl -A "PoluSeeWebPlatform/2.0" "https://nominatim.openstreetmap.org/search?format=json&q=Samarinda&countrycodes=id&limit=5"
 * ============================================================================
 */

import { EXTERNAL_API_CONFIG } from '../config/externalApi';
import { CITY_COORDINATES, findNearestSupportedCity } from '../features/map/stationsData';

/**
 * Mengambil koordinat GPS pengguna menggunakan HTML5 Geolocation API (UC-03 Langkah 1-2)
 * kemudian menerjemahkannya menjadi nama jalan/area & kota menggunakan OpenStreetMap Nominatim API.
 */
export async function detectUserLocationViaOpenStreetMap() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Browser tidak mendukung HTML5 Geolocation API.');
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000,
    });
  });

  const lat = Number(position.coords.latitude.toFixed(6));
  const lon = Number(position.coords.longitude.toFixed(6));

  // Panggil OpenStreetMap Nominatim Reverse Geocoding API
  const reverseData = await reverseGeocodeOpenStreetMap(lat, lon);
  const nearestCity = findNearestSupportedCity(lat, lon);

  return {
    latitude: lat,
    longitude: lon,
    city: nearestCity,
    area: reverseData.area || `${nearestCity} Pusat`,
    displayName: reverseData.displayName || `${nearestCity}, Indonesia`,
  };
}

/**
 * [EXTERNAL API CALL] OpenStreetMap Nominatim Reverse Geocoding API
 * Mengubah koordinat (lat, lon) menjadi nama jalan/kelurahan/kota.
 */
export async function reverseGeocodeOpenStreetMap(lat, lon) {
  try {
    const url = `${EXTERNAL_API_CONFIG.OPENSTREETMAP.NOMINATIM_BASE_URL}/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&zoom=16&addressdetails=1&accept-language=id`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) throw new Error(`OSM Nominatim status ${response.status}`);
    const data = await response.json();
    const addr = data.address || {};
    const area =
      addr.suburb ||
      addr.village ||
      addr.neighbourhood ||
      addr.road ||
      addr.city_district ||
      addr.town ||
      '';
    const city =
      addr.city || addr.town || addr.county || addr.state_district || '';

    return {
      area,
      city,
      displayName: data.display_name || '',
      raw: data,
    };
  } catch {
    const nearestCity = findNearestSupportedCity(lat, lon);
    return {
      area: `${nearestCity} Kota`,
      city: nearestCity,
      displayName: `${nearestCity}, Indonesia`,
      raw: null,
    };
  }
}

/**
 * [EXTERNAL API CALL] OpenStreetMap Nominatim Search API
 * Mencari titik koordinat berdasarkan kata kunci lokasi/alamat di Indonesia.
 */
export async function searchLocationOpenStreetMap(query) {
  if (!query || !query.trim()) return [];
  try {
    const url = `${EXTERNAL_API_CONFIG.OPENSTREETMAP.NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(
      query.trim()
    )}&countrycodes=id&limit=5&addressdetails=1&accept-language=id`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) throw new Error(`OSM Search status ${response.status}`);
    const items = await response.json();
    return items.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      city:
        item.address?.city ||
        item.address?.town ||
        item.address?.county ||
        findNearestSupportedCity(parseFloat(item.lat), parseFloat(item.lon)),
    }));
  } catch {
    // Fallback ke koordinat kota jika offline
    const match = Object.entries(CITY_COORDINATES).find(([name]) =>
      name.toLowerCase().includes(query.trim().toLowerCase())
    );
    if (!match) return [];
    const [cityName, coords] = match;
    return [
      {
        name: `${cityName}, ${coords.province}, Indonesia`,
        lat: coords.lat,
        lon: coords.lon,
        city: cityName,
      },
    ];
  }
}
