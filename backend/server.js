/**
 * ============================================================================
 * SERVER UTAMA BACKEND EXPRESS.JS — POLUSEE WEB PLATFORM
 * File: backend/server.js
 * Arsitektur: JavaScript (ES6+), Express.js, PostgreSQL
 * Mengacu pada: Dokumen SKPL-1000 Revisi C
 * ============================================================================
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './src/modules/auth/auth.routes.js';
import aqiRoutes from './src/modules/aqi/aqi.routes.js';
import rekomendasiRoutes from './src/modules/rekomendasi/rekomendasi.routes.js';
import edukasiRoutes from './src/modules/edukasi/edukasi.routes.js';
import komunitasRoutes from './src/modules/komunitas/komunitas.routes.js';
import profilRoutes from './src/modules/profil/profil.routes.js';
import adminRoutes from './src/modules/admin/admin.routes.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    platform: 'PoluSee Web Platform (Vue.js + Express.js + PostgreSQL)',
    document_ref: 'SKPL-1000 Revisi C',
    timestamp: new Date().toISOString(),
  });
});

// Routing Modular 15 Use Case SKPL-1000
app.use('/api/auth', authRoutes);
app.use('/api/aqi', aqiRoutes);
app.use('/api/rekomendasi', rekomendasiRoutes);
app.use('/api/edukasi', edukasiRoutes);
app.use('/api/komunitas', komunitasRoutes);
app.use('/api/profile', profilRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`[PoluSee Backend] Express.js server berjalan pada http://localhost:${PORT}`);
});
