/**
 * ============================================================================
 * MIDDLEWARE OTENTIKASI JWT & OTORISASI ROLE (USER / ADMIN)
 * File: backend/src/middleware/authMiddleware.js
 * Mengacu pada: NFR-03 & UC-01 SKPL-1000 Revisi C
 * ============================================================================
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'polusee_super_secret_jwt_key_2025';

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token autentikasi tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: 'Sesi tidak valid atau telah berakhir.' });
  }
}

export function optionalToken(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch {
      req.user = null;
    }
  }
  return next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Akses ditolak. Hanya untuk Admin.' });
  }
  return next();
}
