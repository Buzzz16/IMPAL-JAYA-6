/**
 * ============================================================================
 * MODUL BACKEND: DATA AQI REAL-TIME, STASIUN, & RIWAYAT (IQAIR AIRVISUAL LIVE)
 * File: backend/src/modules/aqi/aqi.controller.js
 * ============================================================================
 */

import {
  getLiveIQAirData,
  getLiveCityStations,
  getLiveHistoryAQI,
  hitungKategoriAQI,
} from '../../services/iqairService.js';

// UC-03: Tampil AQI Real-time dari IQAir API secara dinamis
export async function getRealtimeAQI(req, res) {
  const { lat, lon, lokasi = 'Samarinda' } = req.query;

  try {
    const live = await getLiveIQAirData(lokasi, lat, lon);

    return res.status(200).json({
      source: live.source,
      nama_lokasi: live.city,
      provinsi: live.state,
      negara: live.country,
      nilai_aqi: live.aqi,
      nilai_aqi_us: live.aqiUs,
      nilai_aqi_cn: live.aqiCn,
      kategori_level: live.category,
      polutan_utama: live.mainPollutant,
      polutan_utama_kode: live.mainPollutantCode,
      pm25: live.pollutants.pm25,
      pm10: live.pollutants.pm10,
      o3: live.pollutants.o3,
      no2: live.pollutants.no2,
      so2: live.pollutants.so2,
      co: live.pollutants.co,
      latitude: live.stationCoordinates.latitude,
      longitude: live.stationCoordinates.longitude,
      station_coordinates: live.stationCoordinates,
      cuaca: live.weather,
      suhu: live.weather.temperature,
      kelembaban: live.weather.humidity,
      tekanan_udara: live.weather.pressure,
      kecepatan_angin: live.weather.windSpeedMs,
      kecepatan_angin_kmh: live.weather.windSpeedKmh,
      arah_angin_derajat: live.weather.windDirectionDeg,
      arah_angin_kompas: live.weather.windDirectionText,
      indeks_panas: live.weather.heatIndex,
      ikon_cuaca: live.weather.icon,
      deskripsi_cuaca: live.weather.description,
      waktu_ukur: live.timestamp,
      waktu_lokal: live.updatedAtFormatted,
      api_latency_ms: live.apiLatencyMs,
    });
  } catch (err) {
    console.error('[AQI Controller Error]:', err.message);
    return res.status(500).json({
      message: 'Gagal memuat data kualitas udara.',
      error: err.message,
    });
  }
}

// Stasiun titik pantau aktual di kota terpilih
export async function getStationsAQI(req, res) {
  const { lokasi = 'Samarinda' } = req.query;
  try {
    const stations = await getLiveCityStations(lokasi);
    return res.status(200).json({
      city: lokasi,
      stations,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Gagal memuat daftar stasiun titik pantau.',
      error: err.message,
    });
  }
}

// UC-04: View Grafik dan Riwayat AQI Dinamis
export async function getHistoryAQI(req, res) {
  const { lokasi = 'Samarinda', rentang = '24 jam' } = req.query;

  try {
    const history = await getLiveHistoryAQI(lokasi, rentang);
    return res.status(200).json(history);
  } catch (err) {
    return res.status(500).json({
      message: 'Gagal memuat riwayat AQI.',
      error: err.message,
    });
  }
}

// Daftar Semua Kota yang Tersedia dari IQAir API
export async function getCitiesList(req, res) {
  try {
    const { getSupportedCities } = await import('../../services/iqairService.js');
    const cities = getSupportedCities();
    return res.status(200).json({
      status: 'success',
      total: cities.length,
      cities,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Gagal memuat daftar kota.',
      error: err.message,
    });
  }
}
