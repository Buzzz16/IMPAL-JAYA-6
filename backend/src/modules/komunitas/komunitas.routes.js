import { Router } from 'express';
import {
  getFeedKomunitas,
  createPostKomunitas,
  createLaporanPolusi,
  getDetailPostKomunitas,
  toggleLikePost,
  addCommentToPost,
} from './komunitas.controller.js';
import { optionalToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.get('/feed', optionalToken, getFeedKomunitas);
router.post('/post', optionalToken, createPostKomunitas);
router.post('/lapor', optionalToken, createLaporanPolusi);
router.get('/post/:id_post', optionalToken, getDetailPostKomunitas);
router.post('/post/:id_post/like', optionalToken, toggleLikePost);
router.post('/post/:id_post/komentar', optionalToken, addCommentToPost);

export default router;

