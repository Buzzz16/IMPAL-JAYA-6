import { Router } from 'express';
import { getRealtimeAQI, getHistoryAQI, getStationsAQI, getCitiesList } from './aqi.controller.js';
import { optionalToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.get('/cities', getCitiesList);
router.get('/realtime', optionalToken, getRealtimeAQI);
router.get('/stations', optionalToken, getStationsAQI);
router.get('/history', optionalToken, getHistoryAQI);

export default router;

