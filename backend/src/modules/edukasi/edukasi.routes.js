import { Router } from 'express';
import {
  getDaftarEdukasi,
  getDetailEdukasi,
  tambahUlasanEdukasi,
  editUlasanEdukasi,
} from './edukasi.controller.js';
import { optionalToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalToken, getDaftarEdukasi);
router.get('/:id_konten', optionalToken, getDetailEdukasi);
router.post('/:id_konten/ulasan', optionalToken, tambahUlasanEdukasi);
router.put('/ulasan/:id_ulasan', optionalToken, editUlasanEdukasi);

export default router;
