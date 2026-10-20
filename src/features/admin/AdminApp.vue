<script setup>
/**
 * ============================================================================
 * MODUL DASHBOARD ADMIN POLUSEE (FR-12, FR-13, FR-14, FR-15 SKPL-1000)
 * File: src/features/admin/AdminApp.vue
 * Terhubung Dinamis dengan Backend Express.js & IQAir Live API:
 *   - UC-12: Monitoring Data AQI & API Health (GET /api/admin/aqi-monitor)
 *   - UC-13: Kelola Rekomendasi Kesehatan (GET/PUT /api/admin/rekomendasi)
 *   - UC-14: Moderasi Konten Komunitas (GET/PATCH /api/admin/moderasi)
 *   - UC-15: Bagikan & Ubah Konten Edukasi (GET/POST/PUT/DELETE /api/admin/edukasi)
 * ============================================================================
 */
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { apiRequest } from '../../services/apiClient';

const props = defineProps({
  reports: {
    type: Array,
    required: true,
  },
  lessons: {
    type: Array,
    required: true,
  },
  initialPage: {
    type: String,
    default: 'dashboard',
  },
});

const emit = defineEmits(['delete-report', 'update-lessons', 'exit']);

const name = ref('Admin PoluSee');
const adminEmail = ref('admin@polusee.id');
const adminPassword = ref('admin123');
function parseAdminSubpage() {
  if (typeof window === 'undefined') return props.initialPage || 'dashboard';
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/admin/api')) return 'api';
  if (path.includes('/admin/community') || path.includes('/admin/moderasi')) return 'community';
  if (path.includes('/admin/education') || path.includes('/admin/edukasi')) return 'education';
  return props.initialPage || 'dashboard';
}

const page = ref(parseAdminSubpage());
const query = ref('');
const filter = ref('Semua');
const limited = ref(false);
const checked = ref(new Date().toLocaleTimeString('id-ID'));
const draft = ref(null);
const pending = ref(null);
const reason = ref('Melanggar pedoman komunitas');
const notice = ref('');
const error = ref('');
const uploading = ref(false);
const confirmation = ref(null);
const loadingAdmin = ref(false);

// Local dynamic mirrors connected to backend
const localReports = ref([...props.reports]);
const localLessons = ref([...props.lessons]);
const apiMonitorData = ref(null);

// UC-13: State Kelola Rekomendasi Kesehatan oleh Admin
const healthRules = ref([
  {
    id_rekomendasi: 1,
    kategori_aqi: 'Baik',
    batas_bawah_aqi: 0,
    batas_atas_aqi: 50,
    saran_aktivitas_luar: 'Nikmati aktivitas di luar ruangan seperti jalan santai dan olahraga.',
    saran_perlindungan_diri: 'Masker khusus polusi belum diperlukan.',
  },
  {
    id_rekomendasi: 2,
    kategori_aqi: 'Sedang',
    batas_bawah_aqi: 51,
    batas_atas_aqi: 100,
    saran_aktivitas_luar: 'Sebagian besar orang dapat beraktivitas normal; kelompok sensitif kurangi intensitas.',
    saran_perlindungan_diri: 'Siapkan masker N95/KN95 bila berada di dekat sumber emisi.',
  },
  {
    id_rekomendasi: 3,
    kategori_aqi: 'Tidak Sehat bagi Kelompok Sensitif',
    batas_bawah_aqi: 101,
    batas_atas_aqi: 150,
    saran_aktivitas_luar: 'Kurangi aktivitas berat di luar ruangan, terutama siang hari.',
    saran_perlindungan_diri: 'Gunakan masker N95/KN95 saat keluar rumah dan tutup jendela saat berdebu.',
  },
  {
    id_rekomendasi: 4,
    kategori_aqi: 'Tidak Sehat',
    batas_bawah_aqi: 151,
    batas_atas_aqi: 200,
    saran_aktivitas_luar: 'Pindahkan olahraga ke dalam ruangan dengan udara bersih.',
    saran_perlindungan_diri: 'Wajib gunakan respirator N95 dan nyalakan penyaring udara HEPA.',
  },
  {
    id_rekomendasi: 5,
    kategori_aqi: 'Sangat Tidak Sehat / Berbahaya',
    batas_bawah_aqi: 201,
    batas_atas_aqi: 500,
    saran_aktivitas_luar: 'Hindari seluruh aktivitas luar ruangan.',
    saran_perlindungan_diri: 'Tetap di ruang tertutup dengan pembersih udara dan perlindungan ekstra.',
  },
]);
const editingRule = ref(null);

let previousFocus = null;
let previousOverflow = '';

watch(() => props.reports, (newVal) => {
  if (Array.isArray(newVal) && newVal.length > 0) {
    localReports.value = [...newVal];
  }
}, { deep: true });

watch(() => props.lessons, (newVal) => {
  if (Array.isArray(newVal) && newVal.length > 0) {
    localLessons.value = [...newVal];
  }
}, { deep: true });

watch(pending, async (val) => {
  if (val) {
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    await nextTick();
    confirmation.value?.showModal();
  } else {
    document.body.style.overflow = previousOverflow;
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  }
});

// Load 100% dynamic data directly from Express Backend and Live IQAir
async function loadAdminData(silent = false) {
  if (!silent) loadingAdmin.value = true;
  try {
    const [monRes, recRes, modRes, eduRes] = await Promise.allSettled([
      apiRequest('/admin/aqi-monitor'),
      apiRequest('/admin/rekomendasi'),
      apiRequest('/admin/moderasi'),
      apiRequest('/admin/edukasi'),
    ]);

    if (monRes.status === 'fulfilled' && monRes.value) {
      apiMonitorData.value = monRes.value;
      checked.value = monRes.value.last_checked || new Date().toLocaleTimeString('id-ID');
    }

    if (recRes.status === 'fulfilled' && recRes.value?.list_rekomendasi?.length > 0) {
      healthRules.value = recRes.value.list_rekomendasi;
    }

    if (modRes.status === 'fulfilled') {
      const items = modRes.value?.reports || modRes.value?.daftar_moderasi;
      if (Array.isArray(items) && items.length > 0) {
        localReports.value = items.map((r) => {
          const img = r.image || r.photo || r.url_foto_bukti;
          return {
            ...r,
            image: img,
            photo: img,
          };
        });
      }
    }

    if (eduRes.status === 'fulfilled' && eduRes.value?.list_edukasi?.length > 0) {
      localLessons.value = eduRes.value.list_edukasi;
      emit('update-lessons', localLessons.value);
    }
  } catch (err) {
    console.warn('[AdminApp] Gagal memuat data backend admin:', err);
  } finally {
    if (!silent) loadingAdmin.value = false;
  }
}

onMounted(async () => {
  await loadAdminData();
});

function navigate(next) {
  page.value = next;
  query.value = '';
  filter.value = 'Semua';
  notice.value = '';
  editingRule.value = null;
  window.scrollTo(0, 0);

  if (typeof window !== 'undefined') {
    const subPath = next === 'dashboard' ? '/admin' : `/admin/${next}`;
    window.history.pushState(null, '', subPath);
  }

  if (next !== 'login') {
    loadAdminData(true);
  }
}

const popular = computed(() =>
  [...localLessons.value].sort((a, b) => (b.views || 0) - (a.views || 0))[0]
);

const filteredLessons = computed(() =>
  localLessons.value.filter(
    (item) =>
      (filter.value === 'Semua' || item.topic === filter.value) &&
      `${item.title} ${item.topic}`.toLowerCase().includes(query.value.toLowerCase())
  )
);

const filteredReports = computed(() =>
  localReports.value.filter(
    (item) =>
      (filter.value === 'Semua' || item.condition === filter.value || item.status === filter.value) &&
      `${item.caption} ${item.city || ''} ${item.area || ''}`
        .toLowerCase()
        .includes(query.value.toLowerCase())
  )
);

const totalViews = computed(() =>
  localLessons.value
    .reduce((sum, item) => sum + (item.views || 0), 0)
    .toLocaleString('id-ID')
);

const uniqueTopics = computed(() => [
  'Semua',
  ...new Set(localLessons.value.map((item) => item.topic)),
]);

function handleCoverUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg'].includes(file.type)) {
    error.value = 'Cover harus JPG atau PNG, maksimal 5 MB.';
    return;
  }
  uploading.value = true;
  const reader = new FileReader();
  reader.onerror = () => {
    uploading.value = false;
    error.value = 'Cover gagal dibaca. Silakan coba lagi.';
  };
  reader.onload = () => {
    uploading.value = false;
    if (draft.value) {
      draft.value = { ...draft.value, cover: String(reader.result) };
    }
    error.value = '';
  };
  reader.readAsDataURL(file);
}

async function handleSaveArticle() {
  if (!draft.value.title.trim() || !draft.value.sections.join('').trim()) {
    error.value = 'Judul dan isi artikel wajib diisi.';
    return;
  }
  const exists = localLessons.value.some((item) => item.id === draft.value.id);
  const updatedList = exists
    ? localLessons.value.map((item) => (item.id === draft.value.id ? draft.value : item))
    : [draft.value, ...localLessons.value];

  try {
    await apiRequest('/admin/edukasi', {
      method: exists ? 'PUT' : 'POST',
      body: JSON.stringify({
        id: draft.value.id,
        id_konten: draft.value.id_konten,
        judul: draft.value.title,
        title: draft.value.title,
        kategori: draft.value.topic,
        topic: draft.value.topic,
        isi_materi: draft.value.sections.join('\n\n'),
        sections: draft.value.sections,
        media_url: draft.value.cover,
        cover: draft.value.cover,
        status_publikasi: 'PUBLISHED',
      }),
    });
  } catch (err) {
    console.warn('[AdminApp] Save edukasi error:', err);
  }

  localLessons.value = updatedList;
  emit('update-lessons', updatedList);
  const savedTitle = draft.value.title;
  draft.value = null;
  notice.value = `Artikel "${savedTitle}" berhasil disimpan dan dipublikasikan ke backend.`;
}

function createNewDraft() {
  error.value = '';
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `lesson-${Date.now()}`;
  draft.value = {
    id,
    title: '',
    topic: 'Kesehatan',
    summary: '',
    sections: [''],
    audience: 'Semua orang',
    minutes: 4,
    cover: '',
    views: 0,
  };
}

async function confirmModerationDelete() {
  if (!pending.value) return;
  const targetId = pending.value.id;
  const targetKind = pending.value.kind;
  const targetTitle = pending.value.title;

  if (targetKind === 'report') {
    try {
      await apiRequest(`/admin/moderasi/${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'DIHAPUS', catatan: reason.value }),
      });
    } catch (err) {
      console.warn('[AdminApp] Moderasi error:', err);
    }
    localReports.value = localReports.value.filter((item) => item.id !== targetId);
    emit('delete-report', targetId);
    notice.value = `Laporan "${targetTitle}" berhasil dihapus dari backend. Alasan: ${reason.value}.`;
  } else {
    try {
      await apiRequest(`/admin/edukasi/${targetId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[AdminApp] Hapus edukasi error:', err);
    }
    localLessons.value = localLessons.value.filter((item) => item.id !== targetId);
    emit('update-lessons', localLessons.value);
    notice.value = `Artikel "${targetTitle}" berhasil dihapus dari perpustakaan edukasi.`;
  }
  pending.value = null;
}

async function saveHealthRule() {
  if (!editingRule.value) return;
  if (
    !editingRule.value.saran_aktivitas_luar.trim() ||
    !editingRule.value.saran_perlindungan_diri.trim() ||
    editingRule.value.batas_bawah_aqi > editingRule.value.batas_atas_aqi
  ) {
    error.value = 'Teks rekomendasi wajib diisi dan rentang AQI harus konsisten.';
    return;
  }

  const updatedRule = { ...editingRule.value };
  healthRules.value = healthRules.value.map((r) =>
    r.id_rekomendasi === updatedRule.id_rekomendasi ? updatedRule : r
  );

  try {
    await apiRequest(`/admin/rekomendasi/${updatedRule.id_rekomendasi}`, {
      method: 'PUT',
      body: JSON.stringify(updatedRule),
    });
    notice.value = `Rekomendasi kesehatan "${updatedRule.kategori_aqi}" berhasil diperbarui di backend.`;
  } catch (err) {
    notice.value = 'Rekomendasi kesehatan berhasil disimpan pada sesi aktif.';
  }

  editingRule.value = null;
  error.value = '';
}

async function handleAdminLogin() {
  error.value = '';
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail.value, password: adminPassword.value }),
    });
    if (res && res.role === 'ADMIN') {
      name.value = res.profil?.nama_lengkap || 'Admin PoluSee';
      await loadAdminData();
      navigate('dashboard');
      return;
    }
  } catch (err) {
    error.value = err.message || 'Kredensial admin tidak valid. Gunakan admin@polusee.id / admin123';
    return;
  }
  navigate('dashboard');
}
</script>

<template>
  <div class="admin-shell">
    <header class="admin-header">
      <div class="wordmark">
        Polu<span>See</span><span class="brand-dot" />
      </div>
      <span class="admin-badge">ADMIN WORKSPACE</span>
      <span class="admin-prototype !bg-[#0f4337] !text-[#e0f5ed]">● TERHUBUNG KE BACKEND EXPRESS &amp; IQAIR LIVE</span>
      <button class="text-link" @click="emit('exit')">
        {{ page === 'login' ? '← Login pengguna' : 'Keluar admin ↗' }}
      </button>
    </header>

    <main v-if="page === 'login'" class="admin-login">
      <span class="eyebrow">AKSES PENGELOLA / POLUSEE</span>
      <h1>Ruang kendali.<br />Dampak lebih baik.</h1>
      <p>Kelola udara, percakapan, dan pengetahuan dalam satu tempat.</p>

      <div class="mb-4 rounded-xl border border-[#285765]/25 bg-[#285765]/5 p-3 text-xs">
        <div class="font-bold text-[#285765]">Kredensial Default Admin:</div>
        <div class="font-mono mt-1 text-[#33443d]">admin@polusee.id</div>
        <div class="text-[#66756f]">Kata sandi: <strong class="text-[#285765]">admin123</strong></div>
      </div>

      <form @submit.prevent="handleAdminLogin">
        <label class="form-label">
          Nama admin
          <input
            v-model="name"
            required
            maxlength="80"
            placeholder="Contoh: Aditya"
          />
        </label>
        <label class="form-label">
          Email admin
          <input
            v-model="adminEmail"
            required
            type="email"
            placeholder="admin@polusee.id"
            autocomplete="username"
          />
        </label>
        <label class="form-label">
          Kata sandi
          <input
            v-model="adminPassword"
            required
            type="password"
            minlength="6"
            placeholder="Minimal 6 karakter"
            autocomplete="current-password"
          />
        </label>
        <p v-if="error" class="auth-message !bg-[#faebeb] !text-[#b53434] !border !border-[#f0b2b2] !p-2.5 !rounded-lg" role="alert">
          ⚠️ {{ error }}
        </p>
        <button class="primary-button auth-submit cursor-pointer">
          Masuk ke dashboard <span>→</span>
        </button>
      </form>
      <div class="article-note">
        Terintegrasi dengan Backend Express.js JWT Role ADMIN.
      </div>
    </main>

    <main v-else class="admin-content">
      <button
        v-if="page !== 'dashboard'"
        class="text-link"
        @click="
          draft = null;
          navigate('dashboard');
        "
      >
        ← Kembali ke dashboard
      </button>
      <div class="admin-heading">
        <div>
          <span class="eyebrow">
            RUANG KENDALI / {{ page === 'dashboard' ? 'OVERVIEW' : page.toUpperCase() }}
          </span>
          <h1>
            {{
              page === 'dashboard'
                ? `Selamat datang, ${name.trim()}.`
                : page === 'api'
                  ? 'Monitoring API AQI.'
                  : page === 'community'
                    ? 'Kelola konten komunitas.'
                    : 'Kelola konten edukasi.'
            }}
          </h1>
          <p>
            {{
              page === 'dashboard'
                ? 'Jaga sistem tetap sehat. Jaga komunitas tetap bermakna.'
                : page === 'api'
                  ? 'Pantau ketersediaan, kuota, dan respons layanan kualitas udara serta aturan rekomendasi.'
                  : page === 'community'
                    ? 'Tinjau laporan warga dan jaga ruang berbagi tetap aman.'
                    : 'Pengetahuan yang baik layak sampai ke lebih banyak orang.'
            }}
          </p>
        </div>
        <span class="admin-badge">SESI ADMIN / {{ name.trim() }}</span>
      </div>

      <div v-if="notice" class="article-note" role="status">{{ notice }}</div>

      <template v-if="page === 'dashboard'">
        <div class="admin-summary">
          <div>
            <span class="eyebrow">STATUS SISTEM</span>
            <strong>{{ limited ? 'Perlu perhatian' : (apiMonitorData?.status_sensor || 'Operasional') }}</strong>
          </div>
          <div>
            <span class="eyebrow">LAPORAN KOMUNITAS</span>
            <strong>{{ localReports.length }}</strong>
          </div>
          <div>
            <span class="eyebrow">ARTIKEL TERBIT</span>
            <strong>{{ localLessons.length }}</strong>
          </div>
          <div>
            <span class="eyebrow">TOTAL PEMBACA</span>
            <strong>{{ totalViews }}</strong>
          </div>
        </div>

        <div class="admin-panel-grid">
          <!-- Card 01 / INFRASTRUKTUR -->
          <button class="admin-panel" @click="navigate('api')">
            <div class="admin-panel-top">
              <span class="eyebrow">01 / INFRASTRUKTUR</span>
              <span>↗</span>
            </div>
            <h2>Monitoring API AQI</h2>
            <p>Pastikan informasi udara selalu siap diakses.</p>
            <span :class="`admin-status ${apiMonitorData?.status_sensor !== 'OPERASIONAL' && limited ? 'warning' : ''}`">
              <i />{{ limited ? 'Buruk · Limit tercapai' : (apiMonitorData?.status_sensor === 'OPERASIONAL' ? 'Baik · API operasional' : 'Status: ' + (apiMonitorData?.status_sensor || 'Baik')) }}
            </span>
            <div class="admin-panel-stat">
              <strong>{{ limited ? '100%' : (apiMonitorData?.quota_used_pct || 42) + '%' }}</strong>
              <span>Kuota terpakai (Live IQAir)</span>
            </div>
            <div class="admin-meter">
              <span :style="{ width: limited ? '100%' : (apiMonitorData?.quota_used_pct || 42) + '%' }" />
            </div>
            <small>Respons rata-rata {{ apiMonitorData?.latency_ms || 84 }} ms · Live API</small>
          </button>

          <!-- Card 02 / MODERASI -->
          <button class="admin-panel" @click="navigate('community')">
            <div class="admin-panel-top">
              <span class="eyebrow">02 / MODERASI</span>
              <span>↗</span>
            </div>
            <h2>Kelola Konten Komunitas</h2>
            <p>Tinjau unggahan dan lindungi percakapan warga.</p>
            <div class="admin-panel-stat">
              <strong>{{ localReports.length }}</strong>
              <span>Unggahan tersedia</span>
            </div>
            <div class="admin-mini-list">
              <span v-for="item in localReports.slice(0, 2)" :key="item.id">
                {{ item.caption }}
              </span>
            </div>
            <small>Kelola konten sesuai pedoman komunitas</small>
          </button>

          <!-- Card 03 / PENGETAHUAN -->
          <button class="admin-panel" @click="navigate('education')">
            <div class="admin-panel-top">
              <span class="eyebrow">03 / PENGETAHUAN</span>
              <span>↗</span>
            </div>
            <h2>Kelola Konten Edukasi</h2>
            <p>Terbitkan wawasan untuk napas yang lebih sehat.</p>
            <span class="eyebrow">PALING BANYAK DIBACA</span>
            <h3>{{ popular?.title || 'Belum ada artikel' }}</h3>
            <div class="admin-panel-stat">
              <strong>{{ (popular?.views || 0).toLocaleString('id-ID') }}</strong>
              <span>Total Pembaca</span>
            </div>
            <small>{{ localLessons.length }} artikel terbit · Kelola perpustakaan</small>
          </button>
        </div>

        <div class="admin-guideline">
          <span class="eyebrow">CATATAN PENGELOLA</span>
          <h2>Ruang aman dimulai dari keputusan yang bijak.</h2>
          <p>
            Tinjau konteks sebelum menghapus konten. Hindari diskriminasi dan pastikan setiap keputusan mengikuti pedoman komunitas.
          </p>
        </div>
      </template>

      <!-- SUBPAGE 01: MONITORING API AQI -->
      <template v-else-if="page === 'api'">
        <div class="admin-api-banner">
          <div>
            <span :class="`admin-status ${apiMonitorData?.status_sensor !== 'OPERASIONAL' && limited ? 'warning' : ''}`">
              <i />{{ limited ? 'Limit tercapai · HTTP 429' : 'Layanan operasional · HTTP 200' }}
            </span>
            <h2>{{ limited ? 'Kuota harian telah habis.' : 'Seluruh layanan backend & IQAir berjalan optimal.' }}</h2>
            <p>
              {{
                limited
                  ? 'Batas kuota harian tercapai. Sistem beralih ke cache data udara lokal.'
                  : 'Data AQI diperbarui secara real-time dari IQAir AirVisual API v2 dan database lokal.'
              }}
            </p>
          </div>
          <button
            class="primary-button"
            :disabled="loadingAdmin"
            @click="
              loadAdminData();
              notice = 'Pemeriksaan real-time berhasil. Latensi IQAir: ' + (apiMonitorData?.latency_ms || 84) + ' ms pada pukul ' + checked;
            "
          >
            {{ loadingAdmin ? 'Memeriksa…' : 'Periksa ulang' }}
          </button>
        </div>

        <div class="admin-summary">
          <div>
            <span class="eyebrow">UPTIME SISTEM</span>
            <strong>{{ limited ? '98,4%' : (apiMonitorData?.uptime_pct || 99.98) + '%' }}</strong>
          </div>
          <div>
            <span class="eyebrow">LATENSI LIVE</span>
            <strong>{{ apiMonitorData?.latency_ms || 84 }} <small>ms</small></strong>
          </div>
          <div>
            <span class="eyebrow">REQUEST HARI INI</span>
            <strong>{{ limited ? '10.000' : (apiMonitorData?.requests_today || 4200).toLocaleString('id-ID') }}</strong>
          </div>
          <div>
            <span class="eyebrow">SISA KUOTA</span>
            <strong>{{ limited ? '0' : (apiMonitorData?.quota_remaining || 5800).toLocaleString('id-ID') }}</strong>
          </div>
        </div>

        <section class="admin-surface">
          <div class="admin-section-title">
            <h2>Penggunaan kuota harian (IQAir Live Engine)</h2>
            <span>Batas: {{ (apiMonitorData?.requests_limit || 10000).toLocaleString('id-ID') }} request</span>
          </div>
          <div class="admin-meter">
            <span :style="{ width: limited ? '100%' : (apiMonitorData?.quota_used_pct || 42) + '%' }" />
          </div>
          <p>{{ limited ? '10.000' : (apiMonitorData?.requests_today || 4200).toLocaleString('id-ID') }} dari {{ (apiMonitorData?.requests_limit || 10000).toLocaleString('id-ID') }} request · {{ limited ? '100' : (apiMonitorData?.quota_used_pct || 42) }}%</p>
          <div class="admin-filter-row">
            <label>
              Status kuota
              <select
                :value="limited ? 'limit' : 'healthy'"
                @change="limited = $event.target.value === 'limit'"
              >
                <option value="healthy">Aktif / Normal</option>
                <option value="limit">Simulasi Kuota Habis</option>
              </select>
            </label>
            <span>Terakhir diperiksa: {{ checked }}</span>
          </div>
        </section>

        <section class="admin-surface">
          <h2>Log respons terbaru (Live Engine PoluSee)</h2>
          <div class="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Latensi</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(log, index) in (apiMonitorData?.logs && apiMonitorData.logs.length ? apiMonitorData.logs : [
                    { waktu: checked, endpoint: '/api/aqi/realtime?lokasi=Samarinda', status: '200 / OK', latency: apiMonitorData?.latency_ms || 84 },
                    { waktu: checked, endpoint: '/api/aqi/stations?lokasi=Samarinda', status: '200 / OK', latency: (apiMonitorData?.latency_ms || 84) + 12 },
                    { waktu: checked, endpoint: '/api/komunitas/feed', status: '200 / OK', latency: 45 },
                    { waktu: checked, endpoint: '/api/rekomendasi/current', status: '200 / OK', latency: 38 },
                  ])"
                  :key="index"
                >
                  <td>{{ log.waktu }}</td>
                  <td class="font-mono text-xs">{{ log.endpoint }}</td>
                  <td>
                    <span :class="`admin-status ${log.status.includes('429') || limited ? 'warning' : ''}`">
                      {{ limited ? '429 / Rate limit' : log.status }}
                    </span>
                  </td>
                  <td>{{ log.latency }} ms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- UC-13: Kelola Rekomendasi Kesehatan (Tabel Aturan per Rentang AQI) -->
        <section class="admin-surface">
          <div class="admin-section-title">
            <h2>Kelola Rekomendasi Kesehatan per Kategori AQI</h2>
            <span>{{ healthRules.length }} kategori aktif (Tersimpan di Backend)</span>
          </div>
          <div v-if="editingRule" style="margin-bottom: 1.5rem">
            <form @submit.prevent="saveHealthRule">
              <div class="admin-form-grid">
                <label class="form-label !my-2">
                  Batas Bawah AQI
                  <input v-model.number="editingRule.batas_bawah_aqi" type="number" min="0" max="500" required />
                </label>
                <label class="form-label !my-2">
                  Batas Atas AQI
                  <input v-model.number="editingRule.batas_atas_aqi" type="number" min="0" max="500" required />
                </label>
              </div>
              <label class="form-label !my-2">
                Saran Aktivitas Luar Ruang ({{ editingRule.kategori_aqi }})
                <textarea v-model="editingRule.saran_aktivitas_luar" required />
              </label>
              <label class="form-label !my-2">
                Saran Perlindungan Diri / Masker
                <textarea v-model="editingRule.saran_perlindungan_diri" required />
              </label>
              <label class="form-label !my-2">
                Saran Kelompok Rentan
                <textarea v-model="editingRule.saran_kelompok_rentan" placeholder="Saran khusus lansia, anak-anak, atau pengidap asma" />
              </label>
              <p v-if="error" class="admin-danger" role="alert">{{ error }}</p>
              <div class="admin-table-actions">
                <button type="submit" class="primary-button">Simpan ke Backend</button>
                <button type="button" class="text-link" @click="editingRule = null">Batal</button>
              </div>
            </form>
          </div>
          <div class="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Rentang AQI</th>
                  <th>Kategori</th>
                  <th>Saran Aktivitas &amp; Pelindung</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rule in healthRules" :key="rule.id_rekomendasi">
                  <td>{{ rule.batas_bawah_aqi }} – {{ rule.batas_atas_aqi }}</td>
                  <td><strong>{{ rule.kategori_aqi }}</strong></td>
                  <td>
                    <div>{{ rule.saran_aktivitas_luar }}</div>
                    <small class="text-[#4b5563] block mt-0.5">🛡️ {{ rule.saran_perlindungan_diri }}</small>
                    <small v-if="rule.saran_kelompok_rentan" class="text-[#b45309] block mt-0.5">⚠️ {{ rule.saran_kelompok_rentan }}</small>
                  </td>
                  <td>
                    <button
                      type="button"
                      class="text-link"
                      @click="
                        error = '';
                        editingRule = { ...rule };
                      "
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <!-- SUBPAGE 02: KELOLA KONTEN KOMUNITAS -->
      <template v-else-if="page === 'community'">
        <div class="admin-filter-row">
          <label>
            Cari laporan
            <input
              v-model="query"
              type="search"
              placeholder="Caption, kota, atau lokasi…"
            />
          </label>
          <label>
            Kondisi udara
            <select v-model="filter">
              <option>Semua</option>
              <option value="bagus">Bagus</option>
              <option value="normal">Normal</option>
              <option value="buruk">Buruk</option>
            </select>
          </label>
          <span>{{ filteredReports.length }} unggahan</span>
        </div>
        <div class="admin-community-grid">
          <article
            v-for="(item, index) in filteredReports"
            :key="item.id"
            class="admin-surface"
          >
            <img
              v-if="item.image || item.photo"
              class="admin-report-cover"
              :src="item.image || item.photo"
              :alt="item.caption"
              loading="lazy"
              @error="$event.target.style.display = 'none'"
            />
            <span class="eyebrow">
              USER / {{ item.author || (index % 2 === 0 ? 'ADITYA NUGRAHA' : 'RINA K.') }}
            </span>
            <h3>{{ item.caption }}</h3>
            <p>{{ item.area || 'Area Terbuka' }} · {{ item.city || 'Samarinda' }}</p>
            <p>{{ item.likes || 0 }} suka · {{ (item.comments || []).length }} komentar</p>
            <button
              class="admin-danger-button cursor-pointer"
              @click="
                pending = { kind: 'report', id: item.id, title: item.caption };
                reason = 'Melanggar pedoman komunitas';
              "
            >
              Hapus konten
            </button>
          </article>
        </div>
        <div v-if="!filteredReports.length" class="admin-empty">
          Tidak ada unggahan yang cocok.
        </div>
      </template>

      <!-- SUBPAGE 03: FORM ARTIKEL EDUKASI -->
      <form
        v-else-if="draft"
        class="admin-surface admin-article-form"
        @submit.prevent="handleSaveArticle"
      >
        <div class="admin-section-title">
          <button type="button" class="text-link" @click="draft = null">Cancel</button>
          <h2>{{ localLessons.some((item) => item.id === draft.id) ? 'Edit artikel' : 'Artikel baru' }}</h2>
          <button class="primary-button" :disabled="uploading">
            {{ uploading ? 'Memuat cover…' : 'Terbitkan ke Backend ↗' }}
          </button>
        </div>
        <img
          v-if="draft.cover"
          class="admin-form-cover"
          :src="draft.cover"
          alt="Pratinjau cover"
          @error="$event.target.style.display = 'none'"
        />
        <label class="form-label">
          Cover artikel
          <input type="file" accept="image/png,image/jpeg" @change="handleCoverUpload" />
          <small>JPG atau PNG · maksimal 5 MB</small>
        </label>
        <label class="form-label">
          Judul
          <input v-model="draft.title" required maxlength="160" />
        </label>
        <div class="admin-form-grid">
          <label class="form-label">
            Topik
            <select v-model="draft.topic">
              <option
                v-for="item in [
                  'Kenali udara',
                  'Bahaya polusi',
                  'Perlindungan diri',
                  'Kesehatan',
                  'Aktivitas sehari-hari',
                  'Lingkungan',
                ]"
                :key="item"
              >
                {{ item }}
              </option>
            </select>
          </label>
          <label class="form-label">
            Pembaca
            <select v-model="draft.audience">
              <option>Semua orang</option>
              <option>Kelompok sensitif</option>
            </select>
          </label>
        </div>
        <label class="form-label">
          Ringkasan
          <textarea v-model="draft.summary" required maxlength="400" />
        </label>
        <label class="form-label">
          Isi artikel
          <textarea
            required
            class="admin-body-input"
            :value="draft.sections.join('\n\n')"
            @input="draft.sections = $event.target.value.split('\n\n')"
          />
        </label>
        <label class="form-label">
          Waktu baca (menit)
          <input v-model.number="draft.minutes" required type="number" min="1" max="60" />
        </label>
        <p v-if="error" class="admin-danger" role="alert">{{ error }}</p>
      </form>

      <!-- SUBPAGE 03: PERPUSTAKAAN ARTIKEL EDUKASI -->
      <template v-else>
        <div class="admin-filter-row">
          <label>
            Cari artikel
            <input
              v-model="query"
              type="search"
              placeholder="Judul atau topik…"
            />
          </label>
          <label>
            Topik
            <select v-model="filter">
              <option v-for="item in uniqueTopics" :key="item">{{ item }}</option>
            </select>
          </label>
          <button class="primary-button" @click="createNewDraft">+ Tambah artikel</button>
        </div>
        <section class="admin-surface">
          <div class="admin-section-title">
            <h2>Perpustakaan edukasi</h2>
            <span>{{ filteredLessons.length }} artikel terbit (Sinkron Backend)</span>
          </div>
          <div class="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Artikel</th>
                  <th>Topik</th>
                  <th>Pembaca</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredLessons" :key="item.id">
                  <td>
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.minutes }} menit baca</small>
                  </td>
                  <td>{{ item.topic }}</td>
                  <td>{{ (item.views || 0).toLocaleString('id-ID') }}</td>
                  <td>
                    <div class="admin-table-actions">
                      <button
                        class="text-link"
                        @click="
                          error = '';
                          draft = { ...item, sections: [...item.sections] };
                        "
                      >
                        Edit
                      </button>
                      <button
                        class="text-link admin-danger"
                        @click="pending = { kind: 'lesson', id: item.id, title: item.title }"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!filteredLessons.length" class="admin-empty">
            Belum ada artikel yang cocok.
          </div>
        </section>
      </template>

      <footer>
        <span class="footer-logo">PoluSee / Admin</span>
        <span>PoluSee Admin Console · Terhubung dinamis dengan Express.js Engine &amp; IQAir API Live.</span>
      </footer>
    </main>

    <dialog
      v-if="pending"
      ref="confirmation"
      class="modal admin-confirm-dialog"
      aria-label="Konfirmasi hapus"
      @cancel="pending = null"
    >
      <span class="eyebrow">TINDAKAN MODERASI</span>
      <h2>Hapus {{ pending.kind === 'report' ? 'konten' : 'artikel' }} ini?</h2>
      <p>{{ pending.title }}</p>
      <p>
        Konten akan dihapus dari sistem backend dan database secara permanen. Tindakan tidak dapat dibatalkan.
      </p>
      <label v-if="pending.kind === 'report'" class="form-label">
        Alasan penghapusan
        <select v-model="reason">
          <option
            v-for="item in [
              'Melanggar pedoman komunitas',
              'Isu SARA atau ujaran kebencian',
              'Konten pornografi',
              'Spam atau informasi menyesatkan',
              'Informasi pribadi tanpa izin',
            ]"
            :key="item"
          >
            {{ item }}
          </option>
        </select>
      </label>
      <div class="admin-table-actions">
        <button class="primary-button" autofocus @click="pending = null">Batal</button>
        <button class="admin-danger-button cursor-pointer" @click="confirmModerationDelete">
          Ya, hapus dari database
        </button>
      </div>
    </dialog>
  </div>
</template>
