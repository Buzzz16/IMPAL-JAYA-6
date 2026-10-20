import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target file: backend/src/.env.local
const envLocalPath = path.resolve(__dirname, '../.env.local');
const fallbackPath = path.resolve(__dirname, '../../.env.local');

const targetPath = fs.existsSync(envLocalPath)
  ? envLocalPath
  : fs.existsSync(fallbackPath)
  ? fallbackPath
  : null;

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
