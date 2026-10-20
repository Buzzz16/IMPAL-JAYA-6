/**
 * ============================================================================
 * PENYIMPANAN DATA DINAMIS BACKEND (DATABASE PERSISTENCE & MEMORY STORE)
 * File: backend/src/data/dbStore.js
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'database.json');

const INITIAL_DATA = {
  users: [
    {
      id_akun: '11111111-1111-1111-1111-111111111111',
      nama_lengkap: 'Pengguna PoluSee (User)',
      username: '@userpolusee',
      email: 'user@polusee.id',
      password_hash: '$2a$10$pZEMX.ept7/tiCTYhVTXmelsXkh6TKftgAOnYV8fQFv.ELPkCmx2e', // user123 & password123
      role: 'USER',
      status_aktif: true,
      umur: 28,
      lokasi_default: 'Samarinda',
      latitude: -0.5022,
      longitude: 117.1536,
      kategori_rentan: 'Umum',
      peringatan_aqi_100: true,
      foto_profil:
        'https://images.unsplash.com/photo-1630678334641-0c5339dfd1a7?auto=format&fit=crop&w=500&q=85',
    },
    {
      id_akun: '11111111-1111-1111-1111-111111111112',
      nama_lengkap: 'Aditya Nugraha',
      username: '@adityanugraha',
      email: 'aditya@polusee.id',
      password_hash: '$2a$10$pZEMX.ept7/tiCTYhVTXmelsXkh6TKftgAOnYV8fQFv.ELPkCmx2e', // user123 & password123
      role: 'USER',
      status_aktif: true,
      umur: 28,
      lokasi_default: 'Samarinda',
      latitude: -0.5022,
      longitude: 117.1536,
      kategori_rentan: 'Umum',
      peringatan_aqi_100: true,
      foto_profil:
        'https://images.unsplash.com/photo-1630678334641-0c5339dfd1a7?auto=format&fit=crop&w=500&q=85',
    },
    {
      id_akun: '22222222-2222-2222-2222-222222222222',
      nama_lengkap: 'Admin PoluSee (Pengelola)',
      username: '@adminpolusee',
      email: 'admin@polusee.id',
      password_hash: '$2a$10$19ajoQl9Cb7oyXXMEVQrVOHPg8IIlbNSpBUAN/XgX1Fyq2WvcVy6e', // admin123 & password123
      role: 'ADMIN',
      status_aktif: true,
      umur: 35,
      lokasi_default: 'Samarinda',
      latitude: -0.5022,
      longitude: 117.1536,
      kategori_rentan: 'Umum',
      peringatan_aqi_100: false,
      foto_profil: '',
    },
  ],
  rekomendasi: [
    {
      id_rekomendasi: 1,
      kategori_aqi: 'Baik',
      batas_bawah_aqi: 0,
      batas_atas_aqi: 50,
      saran_aktivitas_luar: 'Kualitas udara mendukung jalan santai, bersepeda, dan aktivitas luar ruangan.',
      saran_perlindungan_diri: 'Masker khusus polusi tidak selalu diperlukan saat udara baik.',
      saran_kelompok_rentan: 'Dapat beraktivitas di luar ruangan seperti biasa.',
    },
    {
      id_rekomendasi: 2,
      kategori_aqi: 'Sedang',
      batas_bawah_aqi: 51,
      batas_atas_aqi: 100,
      saran_aktivitas_luar: 'Sebagian besar orang dapat beraktivitas seperti biasa.',
      saran_perlindungan_diri: 'Siapkan masker jika berada dekat sumber debu atau asap.',
      saran_kelompok_rentan: 'Jika sensitif terhadap polusi, kurangi durasi dan intensitas saat merasa tidak nyaman.',
    },
    {
      id_rekomendasi: 3,
      kategori_aqi: 'Tidak sehat bagi kelompok sensitif',
      batas_bawah_aqi: 101,
      batas_atas_aqi: 150,
      saran_aktivitas_luar: 'Kurangi aktivitas berat di luar, terutama siang hari.',
      saran_perlindungan_diri: 'Gunakan respirator N95 atau KN95 saat berada di area terpapar.',
      saran_kelompok_rentan: 'Anak-anak, lansia, dan penderita asma perlu mengurangi paparan di luar ruangan.',
    },
    {
      id_rekomendasi: 4,
      kategori_aqi: 'Tidak sehat',
      batas_bawah_aqi: 151,
      batas_atas_aqi: 200,
      saran_aktivitas_luar: 'Pindahkan olahraga ke ruangan dengan udara lebih bersih.',
      saran_perlindungan_diri: 'Gunakan masker N95 saat harus keluar dan tutup jendela saat udara luar tercemar.',
      saran_kelompok_rentan: 'Kelompok sensitif wajib menghindari aktivitas berat di luar ruangan.',
    },
    {
      id_rekomendasi: 5,
      kategori_aqi: 'Sangat tidak sehat / Berbahaya',
      batas_bawah_aqi: 201,
      batas_atas_aqi: 500,
      saran_aktivitas_luar: 'Hindari seluruh aktivitas fisik di luar ruangan.',
      saran_perlindungan_diri: 'Tetap di dalam ruangan dengan penyaring udara HEPA aktif.',
      saran_kelompok_rentan: 'Segera cari pertolongan medis bila mengalami sesak napas atau gejala memburuk.',
    },
  ],
  edukasi: [
    {
      id: 'lesson-1',
      id_konten: 1,
      title: 'AQI: membaca angka, memahami risiko.',
      topic: 'Kenali udara',
      summary: 'AQI menggambarkan tingkat pencemaran udara. Nilai yang lebih tinggi menunjukkan risiko kesehatan yang lebih besar.',
      sections: [
        'AQI menggambarkan tingkat pencemaran udara. Nilai yang lebih tinggi menunjukkan risiko kesehatan yang lebih besar.',
        '0–50: baik. 51–100: sedang. 101–150: tidak sehat bagi kelompok sensitif. 151–200: tidak sehat. 201–300: sangat tidak sehat. Di atas 300: berbahaya.',
        'Pantau informasi dari stasiun pemantau resmi terdekat. Kondisi dapat berubah sepanjang hari; sesuaikan aktivitas dengan angka terbaru.',
      ],
      audience: 'Semua orang',
      minutes: 3,
      views: 1240,
      cover: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=85',
      reviews: [
        {
          id: 'rev-1',
          userName: 'Aditya Nugraha',
          rating: 5,
          comment: 'Penjelasan rentang angka AQI sangat mudah dipahami untuk memantau udara harian di Samarinda.',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'lesson-2',
      id_konten: 2,
      title: 'PM2.5: kecil partikelnya, besar dampaknya.',
      topic: 'Bahaya polusi',
      summary: 'PM2.5 adalah partikel berdiameter 2,5 mikrometer atau lebih kecil yang dapat menembus sistem pernapasan terdalam.',
      sections: [
        'PM2.5 adalah partikel berdiameter 2,5 mikrometer atau lebih kecil. Sumbernya antara lain pembakaran bahan bakar, kebakaran, dan proses industri.',
        'Partikel halus dapat masuk jauh ke paru-paru. Paparan polusi dikaitkan dengan gangguan pernapasan dan penyakit kardiovaskular.',
        'Kurangi paparan saat udara buruk: batasi aktivitas berat di luar, hindari sumber asap, dan gunakan ruang dengan udara lebih bersih.',
      ],
      audience: 'Kelompok rentan',
      minutes: 4,
      views: 980,
      cover: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=85',
      reviews: [],
    },
    {
      id: 'lesson-3',
      id_konten: 3,
      title: 'Memilih masker yang benar-benar melindungi.',
      topic: 'Perlindungan diri',
      summary: 'Respirator N95/KN95 memberi perlindungan lebih baik dibanding masker kain terhadap partikel halus polusi.',
      sections: [
        'Respirator N95 yang sesuai dan terpasang rapat dapat membantu mengurangi partikel yang terhirup. Masker kain tidak memberi perlindungan setara terhadap partikel halus.',
        'Tutup hidung dan mulut, sesuaikan penjepit hidung, dan periksa celah di tepi masker. Ganti jika rusak, kotor, atau sulit digunakan untuk bernapas.',
      ],
      audience: 'Pengguna jalan & komuter',
      minutes: 2,
      views: 1530,
      cover: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=1200&q=85',
      reviews: [],
    },
  ],
  laporan: [
    {
      id: 'rep-001',
      id_post: 1,
      ticket: '#TKT-2026-081',
      author: 'Aditya Nugraha',
      user: '@adityanugraha',
      avatar: 'https://images.unsplash.com/photo-1630678334641-0c5339dfd1a7?auto=format&fit=crop&w=500&q=85',
      city: 'Samarinda',
      area: 'Sungai Karang Mumus',
      address: 'Jl. Lambung Mangkurat, Samarinda',
      condition: 'Asap pembakaran sampah',
      category: 'Asap & Debu',
      caption: 'Asap pembakaran sampah pekat di sekitar bantaran sungai mengganggu jarak pandang dan napas warga pagi ini.',
      time: 'Baru saja',
      date: new Date().toISOString(),
      status: 'TERVERIFIKASI',
      badge: 'TERVERIFIKASI',
      photo: 'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85',
      lat: -0.4952,
      lon: 117.1580,
      likes: 14,
      comments: [
        {
          id: 'c-1',
          author: 'Warga Peduli',
          text: 'Sudah dilaporkan juga ke pihak kelurahan setempat, terima kasih informasinya!',
          time: '15 menit lalu',
        },
      ],
    },
    {
      id: 'rep-002',
      id_post: 2,
      ticket: '#TKT-2026-082',
      author: 'Budi Santoso',
      user: '@budisantoso',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=85',
      city: 'Samarinda',
      area: 'Taman Samarendah',
      address: 'Kawasan Taman Samarendah, Samarinda Kota',
      condition: 'Udara bersih & segar',
      category: 'Kondisi Baik',
      caption: 'Udara pagi di area taman terasa sejuk dan cocok untuk olahraga santai bersama keluarga.',
      time: '2 jam lalu',
      date: new Date(Date.now() - 2 * 3600000).toISOString(),
      status: 'TERVERIFIKASI',
      badge: 'TERVERIFIKASI',
      photo: 'https://images.unsplash.com/photo-1527965408463-82ae0731825c?auto=format&fit=crop&w=1200&q=85',
      lat: -0.5015,
      lon: 117.1475,
      likes: 29,
      comments: [],
    },
  ],
};

class DataStore {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[DataStore] Gagal membaca file data, menggunakan memori:', e.message);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[DataStore] Gagal menyimpan file data:', e.message);
    }
  }

  getUsers() {
    return this.data.users;
  }

  findUserByEmail(email) {
    return this.data.users.find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );
  }

  findUserById(id) {
    return this.data.users.find((u) => u.id_akun === id);
  }

  addUser(user) {
    this.data.users.push(user);
    this.saveData();
    return user;
  }

  updateUser(id, payload) {
    const idx = this.data.users.findIndex((u) => u.id_akun === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...payload };
      this.saveData();
      return this.data.users[idx];
    }
    return null;
  }

  getRekomendasi(aqi = 150) {
    const num = Number(aqi);
    return (
      this.data.rekomendasi.find(
        (r) => num >= r.batas_bawah_aqi && num <= r.batas_atas_aqi
      ) || this.data.rekomendasi[2]
    );
  }

  getAllRekomendasi() {
    return this.data.rekomendasi;
  }

  updateRekomendasi(id, payload) {
    const idx = this.data.rekomendasi.findIndex(
      (r) => r.id_rekomendasi === Number(id)
    );
    if (idx !== -1) {
      this.data.rekomendasi[idx] = { ...this.data.rekomendasi[idx], ...payload };
      this.saveData();
      return this.data.rekomendasi[idx];
    }
    return null;
  }

  getArticles() {
    return this.data.edukasi;
  }

  getArticleById(id) {
    return this.data.edukasi.find(
      (a) => String(a.id) === String(id) || String(a.id_konten) === String(id)
    );
  }

  saveArticle(article) {
    const idx = this.data.edukasi.findIndex((a) => a.id === article.id);
    if (idx !== -1) {
      this.data.edukasi[idx] = { ...this.data.edukasi[idx], ...article };
    } else {
      this.data.edukasi.push(article);
    }
    this.saveData();
    return article;
  }

  deleteArticle(id) {
    this.data.edukasi = this.data.edukasi.filter((a) => a.id !== id);
    this.saveData();
  }

  addArticleReview(id, review) {
    const art = this.getArticleById(id);
    if (art) {
      if (!art.reviews) art.reviews = [];
      art.reviews.unshift(review);
      this.saveData();
      return art;
    }
    return null;
  }

  getReports() {
    return this.data.laporan;
  }

  getReportById(id) {
    return this.data.laporan.find((r) => r.id === id);
  }

  addReport(report) {
    this.data.laporan.unshift(report);
    this.saveData();
    return report;
  }

  updateReportStatus(id, status, notes = '') {
    const rep = this.data.laporan.find((r) => r.id === id);
    if (rep) {
      rep.status = status;
      rep.badge = status;
      if (notes) rep.moderation_notes = notes;
      this.saveData();
      return rep;
    }
    return null;
  }

  deleteReport(id) {
    this.data.laporan = this.data.laporan.filter((r) => r.id !== id);
    this.saveData();
  }

  addReportComment(reportId, comment) {
    const rep = this.data.laporan.find((r) => r.id === reportId);
    if (rep) {
      if (!rep.comments) rep.comments = [];
      rep.comments.push(comment);
      this.saveData();
      return rep;
    }
    return null;
  }
}

export const dbStore = new DataStore();
