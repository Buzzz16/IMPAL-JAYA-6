import { Router } from 'express';
import { getRekomendasiByAQI } from './rekomendasi.controller.js';
import { optionalToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalToken, getRekomendasiByAQI);
router.get('/current', optionalToken, getRekomendasiByAQI);

export default router;
