import { Router } from 'express';
import {
  getMonitoringAQI,
  simpanDataAQI,
  getDaftarRekomendasiAdmin,
  updateRekomendasiAdmin,
  getAntreanModerasi,
  updateStatusModerasi,
  getDaftarEdukasiAdmin,
  simpanAtauUbahEdukasiAdmin,
  hapusEdukasiAdmin,
} from './admin.controller.js';
import { optionalToken } from '../../middleware/authMiddleware.js';

const router = Router();

// UC-12: Monitoring Data AQI
router.get('/aqi-monitor', optionalToken, getMonitoringAQI);
router.post('/aqi-monitor', optionalToken, simpanDataAQI);

// UC-13: Kelola Rekomendasi Kesehatan
router.get('/rekomendasi', optionalToken, getDaftarRekomendasiAdmin);
router.put('/rekomendasi/:id', optionalToken, updateRekomendasiAdmin);

// UC-14: Moderasi Konten Komunitas
router.get('/moderasi', optionalToken, getAntreanModerasi);
router.patch('/moderasi/:id', optionalToken, updateStatusModerasi);

// UC-15: Bagikan Dan Ubah Konten Edukasi
router.get('/edukasi', optionalToken, getDaftarEdukasiAdmin);
router.post('/edukasi', optionalToken, simpanAtauUbahEdukasiAdmin);
router.put('/edukasi', optionalToken, simpanAtauUbahEdukasiAdmin);
router.delete('/edukasi/:id', optionalToken, hapusEdukasiAdmin);

export default router;
