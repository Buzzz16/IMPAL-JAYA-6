import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cari file .env.local atau .env di root (luar), backend/, atau backend/src/
const candidatePaths = [
  path.resolve(__dirname, '../../../.env.local'), // 1. Root .env.local (di luar)
  path.resolve(__dirname, '../../../.env'),       // 2. Root .env (di luar)
  path.resolve(__dirname, '../.env.local'),       // 3. backend/src/.env.local
  path.resolve(__dirname, '../../.env.local'),    // 4. backend/.env.local
  path.resolve(__dirname, '../../.env'),          // 5. backend/.env
  path.resolve(process.cwd(), '.env.local'),      // 6. Current working dir .env.local
  path.resolve(process.cwd(), '.env'),            // 7. Current working dir .env
];

let targetPath = null;
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    targetPath = p;
    break;
  }
}

if (targetPath) {
  // Dukung native Node.js loadEnvFile (Node 20+)
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(targetPath);
    } catch {
      // Abaikan jika sudah di-load
    }
  }

  // Juga dukung dotenv jika terpasang
  try {
    const { default: dotenv } = await import('dotenv');
    dotenv.config({ path: targetPath });
  } catch {
    // Paket dotenv belum di-install, native loadEnvFile sudah menangani
  }
}
