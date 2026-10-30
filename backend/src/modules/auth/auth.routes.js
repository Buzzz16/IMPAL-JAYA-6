import { Router } from 'express';
import { login, register, forgotPassword } from './auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', forgotPassword);

export default router;
