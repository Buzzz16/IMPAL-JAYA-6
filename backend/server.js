/**
 * ============================================================================
 * SERVER UTAMA BACKEND EXPRESS.JS — POLUSEE WEB PLATFORM
 * File: backend/server.js
 * Arsitektur: JavaScript (ES6+), Express.js, PostgreSQL
 * Mengacu pada: Dokumen SKPL-1000 Revisi C
 * ============================================================================
 */

import './src/config/loadEnv.js';
import express from 'express';
import cors from 'cors';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './src/modules/auth/auth.routes.js';
import aqiRoutes from './src/modules/aqi/aqi.routes.js';
import rekomendasiRoutes from './src/modules/rekomendasi/rekomendasi.routes.js';
import edukasiRoutes from './src/modules/edukasi/edukasi.routes.js';
import komunitasRoutes from './src/modules/komunitas/komunitas.routes.js';
import profilRoutes from './src/modules/profil/profil.routes.js';
import adminRoutes from './src/modules/admin/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// ============================================================================
// HTTP REQUEST LOGGER MIDDLEWARE (Log Status API, Code 200, 404, 500, Response Time)
// ============================================================================
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Warna status code: 2xx Hijau, 3xx Biru, 4xx Kuning/Oranye, 5xx Merah
    let statusColor = '\x1b[32m'; // Hijau (2xx)
    if (statusCode >= 500) statusColor = '\x1b[31m'; // Merah (5xx)
    else if (statusCode >= 400) statusColor = '\x1b[33m'; // Kuning (4xx)
    else if (statusCode >= 300) statusColor = '\x1b[36m'; // Cyan (3xx)

    const reset = '\x1b[0m';
    const dim = '\x1b[2m';
    const bold = '\x1b[1m';
    const time = new Date().toLocaleTimeString();

    // Log request API dan Web
    if (originalUrl.startsWith('/api')) {
      const dbTag = res.locals.dbLog
        ? ` \x1b[36m[DB Supabase]\x1b[0m ${res.locals.dbLog}`
        : '';
      console.log(
        `${dim}[${time}]${reset} ${bold}[API]${reset} ${bold}${method.padEnd(6)}${reset} ${originalUrl} ` +
        `-> ${statusColor}${bold}${statusCode} ${res.statusMessage || ''}${reset} ${dim}(${duration}ms)${reset}${dbTag}`
      );
    } else if (originalUrl === '/' || statusCode >= 400) {
      console.log(
        `${dim}[${time}]${reset} ${bold}[WEB]${reset} ${method.padEnd(6)} ${originalUrl} ` +
        `-> ${statusColor}${statusCode}${reset} ${dim}(${duration}ms)${reset}`
      );
    }
  });

  next();
});

// Sajikan static assets frontend (dist) langsung di port 5000
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

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
// SPA Fallback: Arahkan seluruh rute browser (non-API) langsung ke frontend Vue (index.html)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).send('Frontend build belum ditemukan. Jalankan "npm run build" terlebih dahulu.');
});

app.listen(PORT, () => {
  console.log(`[PoluSee Backend] Express.js server berjalan pada http://localhost:${PORT}`);
});
