import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Menjalankan PoluSee Backend & Frontend... ');
console.log('\x1b[36m%s\x1b[0m', '  - Backend API:  http://localhost:5000');
console.log('\x1b[36m%s\x1b[0m', '  - Frontend Web: http://localhost:5173');
console.log('\x1b[36m%s\x1b[0m', '================================================\n');

// 1. Jalankan Backend Express dengan mode watch
const backend = spawn('node', ['--watch', 'backend/server.js'], {
  cwd: rootDir,
  stdio: 'inherit',
});

// 2. Jalankan Frontend Vite langsung lewat Node.js (aman untuk Windows & Linux)
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const frontend = spawn('node', [viteBin], {
  cwd: rootDir,
  stdio: 'inherit',
});

// Tangani penutupan proses jika user menekan Ctrl + C
function cleanExit() {
  try {
    backend.kill();
  } catch {}
  try {
    frontend.kill();
  } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
