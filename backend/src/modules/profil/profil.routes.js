import { Router } from 'express';
import { getProfil, updateProfil } from './profil.controller.js';
import { optionalToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalToken, getProfil);
router.put('/', optionalToken, updateProfil);

export default router;
