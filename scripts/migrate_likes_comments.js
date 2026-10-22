import '../backend/src/config/loadEnv.js';
import { query } from '../backend/src/config/db.js';

async function migrate() {
  console.log('Migrating like_post and komentar_post tables to Supabase...');
  await query(`
    CREATE TABLE IF NOT EXISTS like_post (
      id_like SERIAL PRIMARY KEY,
      id_post INTEGER NOT NULL REFERENCES post_komunitas(id_post) ON DELETE CASCADE,
      id_user UUID REFERENCES users(id_akun) ON DELETE CASCADE,
      client_id VARCHAR(100),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS unq_like_user ON like_post (id_post, id_user) WHERE id_user IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS unq_like_client ON like_post (id_post, client_id) WHERE client_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_like_post_id ON like_post (id_post);

    CREATE TABLE IF NOT EXISTS komentar_post (
      id_komentar SERIAL PRIMARY KEY,
      id_post INTEGER NOT NULL REFERENCES post_komunitas(id_post) ON DELETE CASCADE,
      id_user UUID REFERENCES users(id_akun) ON DELETE SET NULL,
      nama_pengguna VARCHAR(100),
      isi_komentar TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_komentar_post_id ON komentar_post (id_post);
  `);
  console.log('MIGRATION_SUCCESS');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
