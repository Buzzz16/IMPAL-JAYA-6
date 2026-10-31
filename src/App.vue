<script setup>
/**
 * ============================================================================
 * ROOT COMPONENT — POLUSEE WEB PLATFORM (VUE.JS + JAVASCRIPT ES6+)
 * File: src/App.vue
 * 100% Dinamis, Terhubung dengan Backend & IQAir AirVisual API
 * ============================================================================
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import AppIcon from './components/common/AppIcon.vue';
import CitySearchSelect from './components/common/CitySearchSelect.vue';
import AuthPage from './features/auth/AuthPage.vue';
import AqiRealtimeCard from './features/aqi/AqiRealtimeCard.vue';
import AirQualityDetail from './features/aqi/AirQualityDetail.vue';
import HistorySummaryCard from './features/history/HistorySummaryCard.vue';
import HistoryDetail from './features/history/HistoryDetail.vue';
import HomeMapCard from './features/map/HomeMapCard.vue';
import MapDetail from './features/map/MapDetail.vue';
import { CITY_COORDINATES, AVAILABLE_CITIES, findNearestSupportedCity } from './features/map/stationsData';
import HomeHealthCard from './features/health/HomeHealthCard.vue';
import HealthRecommendations from './features/health/HealthRecommendations.vue';
import HomeEducationSection from './features/education/HomeEducationSection.vue';
import ArticleQuickModal from './features/education/ArticleQuickModal.vue';
import EducationPage from './features/education/EducationPage.vue';
import { initialLessons } from './features/education/educationData';
import CommunityFeed from './features/community/CommunityFeed.vue';
import ReportDialog from './features/community/ReportDialog.vue';
import { initialReports, newReport } from './features/community/communityData';
import ProfileView from './features/profile/ProfileView.vue';
import AdminApp from './features/admin/AdminApp.vue';
import {
  getRealtimeAqiData,
  getCityStationsData,
  getHistoryAqiData,
  getHealthRecommendationData,
} from './services/aqiService';
import { apiRequest, togglePostLikeApi, saveStoredUser, getStoredToken, getStoredUser } from './services/apiClient';
import { logoutAccount, userProfileStore } from './features/auth/authStore';

// ============================================================================
// SISTEM ROUTING URL & PERSISTENSI STATE (HTML5 HISTORY API)
// Setiap halaman memiliki Path/URL mandiri (/map, /community, /profile, dll.)
// dan TIDAK LAGI me-reset ke menu utama saat di-refresh (F5) atau auto-reload.
// ============================================================================
function parseCurrentUrl() {
  if (typeof window === 'undefined') return { page: 'home', authPage: null, admin: false };
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';

  if (path.startsWith('/admin')) return { page: 'home', authPage: null, admin: true };
  if (path === '/login') return { page: 'home', authPage: 'login', admin: false };
  if (path === '/register') return { page: 'home', authPage: 'register', admin: false };
  if (path === '/forgot-password' || path === '/forgot') return { page: 'home', authPage: 'forgot', admin: false };
  if (path === '/map' || path === '/peta') return { page: 'map-detail', authPage: null, admin: false };
  if (path === '/air-detail' || path === '/detail' || path === '/udara') return { page: 'air-detail', authPage: null, admin: false };
  if (path === '/history' || path === '/riwayat') return { page: 'history-detail', authPage: null, admin: false };
  if (path === '/health' || path === '/kesehatan') return { page: 'health-detail', authPage: null, admin: false };
  if (path === '/community' || path === '/komunitas') return { page: 'community', authPage: null, admin: false };
  if (path === '/profile' || path === '/profil') return { page: 'profile', authPage: null, admin: false };
  if (path === '/education' || path === '/edukasi') return { page: 'education', authPage: null, admin: false };

  // Fallback membaca state tersimpan jika berada di root / namun sedang aktif di suatu halaman
  try {
    const saved = sessionStorage.getItem('polusee_active_route');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.page || parsed.authPage || parsed.admin)) return parsed;
    }
  } catch {}

  return { page: 'home', authPage: null, admin: false };
}

const initialRoute = parseCurrentUrl();
const page = ref(initialRoute.page);
const admin = ref(initialRoute.admin);
const authPage = ref(initialRoute.authPage);

function getRoutePath() {
  if (admin.value) return '/admin';
  if (authPage.value === 'login') return '/login';
  if (authPage.value === 'register') return '/register';
  if (authPage.value === 'forgot') return '/forgot-password';
  if (page.value === 'map-detail') return '/map';
  if (page.value === 'air-detail') return '/air-detail';
  if (page.value === 'history-detail') return '/history';
  if (page.value === 'health-detail') return '/health';
  if (page.value === 'community') return '/community';
  if (page.value === 'profile') return '/profile';
  if (page.value === 'education') return '/education';
  return '/';
}

function syncUrlWithState(replace = false) {
  if (typeof window === 'undefined') return;
  const targetPath = getRoutePath();
  const currentPath = window.location.pathname;

  if (currentPath !== targetPath) {
    if (replace) {
      window.history.replaceState({ page: page.value, authPage: authPage.value, admin: admin.value }, '', targetPath);
    } else {
      window.history.pushState({ page: page.value, authPage: authPage.value, admin: admin.value }, '', targetPath);
    }
  }

  try {
    sessionStorage.setItem('polusee_active_route', JSON.stringify({
      page: page.value,
      authPage: authPage.value,
      admin: admin.value,
    }));
  } catch {}
}

watch([page, admin, authPage], () => {
  syncUrlWithState();
});

function handlePopState() {
  const current = parseCurrentUrl();
  page.value = current.page;
  admin.value = current.admin;
  authPage.value = current.authPage;
}
const savedCity = typeof localStorage !== 'undefined' ? (localStorage.getItem('polusee_selected_city') || userProfileStore.lokasi_default || 'Samarinda') : 'Samarinda';
const city = ref(savedCity);
const period = ref('24 jam');
const notification = ref(false);
const article = ref(null);
const point = ref(savedCity + ' Kota');
const zoom = ref(1);
const personalized = ref(false);
const report = ref(false);
const selectedReport = ref(null);
const createDraft = ref(newReport(city.value));

// Dynamic Backend / IQAir State
const realtimeData = ref(null);
const liveStations = ref([]);
const historyData = ref(null);
const healthData = ref(null);
const lessons = ref([...initialLessons]);

const REPORTS_CACHE_KEY = 'polusee_cached_reports';

function getCachedReports() {
  try {
    const raw = localStorage.getItem(REPORTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedReports(items) {
  try {
    if (Array.isArray(items) && items.length > 0) {
      localStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(items));
    }
  } catch {}
}

const initialCachedReports = getCachedReports();
const reports = ref(initialCachedReports);
const loadingData = ref(false);
const loadingFeed = ref(initialCachedReports.length === 0);

// Live Device Location Tracking State
const userDeviceLocation = ref(null); // { lat, lon, accuracy }
const isLiveTracking = ref(true); // Default true: Lokasi default adalah posisi map device dijalankan
let geolocationWatchId = null;

const aqi = computed(() => realtimeData.value?.aqi ?? null);
const pm25 = computed(() => realtimeData.value?.pm25 ?? 23.0);
const updatedAt = computed(() => realtimeData.value?.updatedAt ?? '11.00 WITA');
const cityProvince = computed(
  () => realtimeData.value?.province || CITY_COORDINATES[city.value]?.province || 'Indonesia'
);

const activeReport = computed(() =>
  reports.value.find((item) => item.id === selectedReport.value)
);


const groupedCities = computed(() => {
  const groups = {};
  AVAILABLE_CITIES.forEach((c) => {
    const reg = c.region || 'Lainnya';
    if (!groups[reg]) groups[reg] = [];
    groups[reg].push(c);
  });
  return groups;
});

// Mengambil seluruh data kota dari Backend Express (terintegrasi IQAir)
async function fetchCityData(cityName = city.value, lat = null, lon = null) {
  loadingData.value = true;
  try {
    const targetLat = (lat != null)
      ? lat
      : (isLiveTracking.value && userDeviceLocation.value?.lat != null ? userDeviceLocation.value.lat : null);
    const targetLon = (lon != null)
      ? lon
      : (isLiveTracking.value && userDeviceLocation.value?.lon != null ? userDeviceLocation.value.lon : null);

    const [aqiRes, stationsRes, historyRes] = await Promise.allSettled([
      getRealtimeAqiData(cityName, targetLat, targetLon),
      getCityStationsData(cityName),
      getHistoryAqiData(cityName, period.value),
    ]);

    if (aqiRes.status === 'fulfilled' && aqiRes.value) {
      realtimeData.value = aqiRes.value;
    }

    if (stationsRes.status === 'fulfilled' && stationsRes.value) {
      liveStations.value = stationsRes.value;
      if (liveStations.value.length > 0) {
        point.value = liveStations.value[0].name;
      }
    }

    if (historyRes.status === 'fulfilled' && historyRes.value) {
      historyData.value = historyRes.value;
    }

    // Rekomendasi kesehatan dinamis dari backend rule-engine
    const curAqi = realtimeData.value?.aqi || 100;
    const recRes = await getHealthRecommendationData(
      curAqi,
      userProfileStore.kategori_rentan || 'Umum'
    );
    if (recRes) {
      healthData.value = recRes;
    }
  } catch (err) {
    console.warn('[PoluSee Frontend] Gagal mengambil live data:', err.message);
  } finally {
    loadingData.value = false;
  }
}

// Inisialisasi Live Tracking lokasi perangkat (posisi default map saat dijalankan)
async function initLiveLocationTracking() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    console.info('[PoluSee Live GPS] Geolocation API tidak didukung browser.');
    isLiveTracking.value = false;
    await fetchCityData(city.value);
    return;
  }

  isLiveTracking.value = true;
  loadingData.value = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lon = Number(position.coords.longitude.toFixed(6));
        const accuracy = position.coords.accuracy;

        userDeviceLocation.value = { lat, lon, accuracy };
        console.log(`[PoluSee Live GPS] Posisi perangkat terdeteksi: ${lat}, ${lon} (akurasi ${accuracy}m)`);

        const nearest = findNearestSupportedCity(lat, lon);
        if (nearest) {
          city.value = nearest;
          point.value = nearest + ' Kota';
          try { localStorage.setItem('polusee_selected_city', nearest); } catch {}

          // Otomatis update lokasi default user ke Supabase
          if (userProfileStore.id_akun) {
            userProfileStore.lokasi_default = nearest;
            updateProfileData({
              lokasi_default: nearest,
              latitude: lat,
              longitude: lon,
            }).then(() => {
              console.log('[Supabase GPS Sync]: Lokasi tersimpan ke Supabase:', nearest);
            }).catch(e => console.warn(e));
          }
        }

        await fetchCityData(city.value, lat, lon);
        startWatchingLocation();
      } catch (err) {
        console.warn('[PoluSee Live GPS] Gagal memproses lokasi perangkat:', err);
        await fetchCityData(city.value);
      } finally {
        loadingData.value = false;
      }
    },
    async (err) => {
      console.warn('[PoluSee Live GPS] Akses lokasi tidak diizinkan atau timeout:', err.message);
      isLiveTracking.value = false;
      loadingData.value = false;
      await fetchCityData(city.value);
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 10000,
    }
  );
}

function startWatchingLocation() {
  if (geolocationWatchId != null || typeof navigator === 'undefined' || !navigator.geolocation) return;

  geolocationWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lon = Number(pos.coords.longitude.toFixed(6));
      const accuracy = pos.coords.accuracy;

      userDeviceLocation.value = { lat, lon, accuracy };

      if (isLiveTracking.value) {
        const nearest = findNearestSupportedCity(lat, lon);
        if (nearest && nearest !== city.value) {
          city.value = nearest;
        }
      }
    },
    (err) => {
      console.warn('[PoluSee Live GPS Watch]:', err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 15000,
    }
  );
}

async function toggleLiveLocationTracking() {
  if (isLiveTracking.value) {
    isLiveTracking.value = false;
  } else {
    isLiveTracking.value = true;
    if (userDeviceLocation.value && userDeviceLocation.value.lat != null) {
      const nearest = findNearestSupportedCity(
        userDeviceLocation.value.lat,
        userDeviceLocation.value.lon
      );
      if (nearest) city.value = nearest;
      await fetchCityData(city.value, userDeviceLocation.value.lat, userDeviceLocation.value.lon);
    } else {
      await initLiveLocationTracking();
    }
  }
}

function onManualCityChange() {
  isLiveTracking.value = false;
}

// Mengambil data global (Edukasi, Komunitas, Profil) dari Backend
async function fetchGlobalData() {
  try {
    const [eduRes, feedRes, profRes] = await Promise.allSettled([
      apiRequest('/edukasi'),
      apiRequest('/komunitas/feed'),
      apiRequest('/profile'),
    ]);

    if (eduRes.status === 'fulfilled' && eduRes.value?.list_konten?.length > 0) {
      lessons.value = eduRes.value.list_konten;
    }

    if (feedRes.status === 'fulfilled') {
      const feedItems = feedRes.value?.reports || feedRes.value?.feed_komunitas;
      if (Array.isArray(feedItems)) {
        reports.value = feedItems.map((r) => {
          const img =
            r.image ||
            r.photo ||
            r.url_foto_bukti ||
            'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85';
          return {
            ...r,
            image: img,
            photo: img,
            avatar:
              r.avatar ||
              r.foto_profil ||
              'https://images.unsplash.com/photo-1630678334641-0c5339dfd1a7?auto=format&fit=crop&w=500&q=85',
          };
        });
      }
    }

    if (profRes.status === 'fulfilled' && profRes.value?.profil_user) {
      Object.assign(userProfileStore, profRes.value.profil_user);
    }
  } catch (err) {
    console.warn('[PoluSee Frontend] Gagal mengambil data global:', err.message);
  } finally {
    loadingFeed.value = false;
  }
}

// Ketika kota berubah, panggil kembali API backend
watch(city, async (newCity) => {
  await fetchCityData(newCity);
});

// Ketika periode riwayat berubah, ambil time-series baru
watch(period, async (newPeriod) => {
  try {
    const h = await getHistoryAqiData(city.value, newPeriod);
    if (h) historyData.value = h;
  } catch {
    // Selesai
  }
});

async function handleHistoryPeriodChange(newP) {
  period.value = newP;
  try {
    const h = await getHistoryAqiData(city.value, newP);
    if (h) historyData.value = h;
  } catch {
    // Selesai
  }
}

function saveReport(updated) {
  reports.value = reports.value.map((item) =>
    item.id === updated.id ? updated : item
  );
  if (selectedReport.value && selectedReport.value.id === updated.id) {
    selectedReport.value = updated;
  }
}

async function handleToggleLike(updated) {
  saveReport(updated);
  try {
    const res = await togglePostLikeApi(updated.id_post || updated.id);
    if (res && res.success) {
      saveReport({
        ...updated,
        liked: res.liked,
        likes: res.likes,
      });
    }
  } catch (err) {
    console.warn('Gagal sinkron like ke Supabase:', err);
  }
}

function handleCreateReportSaved(created) {
  const img =
    created.image ||
    created.photo ||
    'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85';
  const norm = {
    ...created,
    image: img,
    photo: img,
    avatar:
      created.avatar ||
      userProfileStore.foto_profil ||
      'https://images.unsplash.com/photo-1630678334641-0c5339dfd1a7?auto=format&fit=crop&w=500&q=85',
  };
  reports.value = [norm, ...reports.value];
}

function handleDeleteActiveReport() {
  if (!activeReport.value) return;
  reports.value = reports.value.filter((item) => item.id !== activeReport.value.id);
  selectedReport.value = null;
}

function handleDeleteReportById(id) {
  reports.value = reports.value.filter((item) => item.id !== id);
}

function handleLogout() {
  logoutAccount();
  notification.value = false;
  article.value = null;
  report.value = false;
  selectedReport.value = null;
  authPage.value = 'login';
}

function goHome() {
  page.value = 'home';
  window.scrollTo(0, 0);
}

const navItems = [
  { id: 'community', icon: 'book', label: 'Komunitas' },
  { id: 'home', icon: 'home', label: 'Beranda' },
  { id: 'profile', icon: 'user', label: 'Profil' },
];

onMounted(async () => {
  syncUrlWithState(true);
  window.addEventListener('popstate', handlePopState);
  await fetchGlobalData();
  await initLiveLocationTracking();
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState);
  if (geolocationWatchId != null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(geolocationWatchId);
    geolocationWatchId = null;
  }
});
</script>

<template>
  <AdminApp
    v-if="admin"
    :reports="reports"
    :lessons="lessons"
    @update-lessons="lessons = $event"
    @delete-report="handleDeleteReportById"
    @exit="
      admin = false;
      authPage = 'login';
    "
  />
  <AuthPage
    v-else-if="authPage"
    :mode="authPage"
    @admin="admin = true"
    @navigate="authPage = $event"
    @login="
      authPage = null;
      page = 'home';
    "
  />
  <div v-else class="app-shell">
    <aside class="sidebar">
      <a
        class="brand-mark relative"
        href="#"
        aria-label="PoluSee beranda"
        @click.prevent="page = 'home'"
      >
        <AppIcon name="wind" :size="29" />
        <span
          class="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center bg-[#edce7e] text-[length:var(--text-caption)] font-extrabold text-[#285765]"
        >
          P
        </span>
      </a>
      <nav>
        <button
          v-for="item in navItems"
          :key="item.id"
          :class="`nav-item ${page === item.id ? 'active' : ''}`"
          :aria-label="item.label"
          :title="item.label"
          @click="page = item.id"
        >
          <AppIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="sidebar-bottom" />
    </aside>

    <div class="workspace">
      <header class="topbar">
        <a class="wordmark" href="#" @click.prevent="page = 'home'">
          Polu<span>See</span><span class="brand-dot" />
        </a>
        <span class="header-tag">UDARA LEBIH BAIK, HIDUP LEBIH BAIK · LIVE IQAIR</span>
        <div class="top-actions">
          <div class="notification-wrap">
            <button
              class="icon-button bell"
              aria-label="Notifikasi"
              @click="notification = !notification"
            >
              <AppIcon name="bell" /><i />
            </button>
            <div v-if="notification" class="notification-panel">
              <strong>Peringatan kualitas udara</strong>
              <p>
                AQI {{ city }} saat ini {{ aqi }} ({{ realtimeData?.category || 'Sedang' }}).
                {{
                  aqi > 100
                    ? 'Kurangi aktivitas luar ruangan, gunakan masker N95.'
                    : 'Kualitas udara relatif baik. Nikmati aktivitas luar dengan bijak.'
                }}
              </p>
              <small>Data langsung dari IQAir · {{ updatedAt }}</small>
            </div>
          </div>
          <div class="flex items-center gap-2 pl-2 border-l border-[#aeb9ae]/50">
            <div class="hidden sm:flex flex-col text-right">
              <span class="text-xs font-semibold text-[#285765] leading-tight">{{ userProfileStore.nama_lengkap }}</span>
              <span class="text-[10px] text-[#71827a] leading-none">{{ userProfileStore.email }} · <span class="rounded bg-[#edce7e]/60 px-1 font-bold text-[#285765]">{{ userProfileStore.role || 'USER' }}</span></span>
            </div>
            <button
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#aeb9ae] bg-white text-[#285765] text-xs font-medium hover:border-[#285765] hover:bg-[#285765] hover:text-white transition cursor-pointer shadow-2xs"
              type="button"
              aria-label="Ganti Akun atau Keluar"
              title="Ganti Akun / Logout"
              @click="handleLogout"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M10 17l5-5-5-5M15 12H3M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
              </svg>
             
            </button>
          </div>
        </div>
      </header>

      <main
        class="[&>.overview-grid>section]:transition-all [&>.detail-grid>section]:transition-all [&_.overview-grid>section]:duration-300 [&_.detail-grid>section]:duration-300 [&_.overview-grid>section]:ease-out [&_.detail-grid>section]:ease-out [&_.overview-grid>section:hover]:-translate-y-1 [&_.detail-grid>section:hover]:-translate-y-1 [&_.overview-grid>section:hover]:shadow-lg [&_.detail-grid>section:hover]:shadow-lg [&_.overview-grid>section:hover]:border-[var(--blue)] [&_.detail-grid>section:hover]:border-[var(--blue)] [&_.overview-grid>section:focus-within]:-translate-y-1 [&_.detail-grid>section:focus-within]:-translate-y-1 motion-reduce:[&_.overview-grid>section]:transform-none motion-reduce:[&_.detail-grid>section]:transform-none motion-reduce:[&_.overview-grid>section]:transition-none motion-reduce:[&_.detail-grid>section]:transition-none"
      >
        <EducationPage
          v-if="page === 'education'"
          :lessons="lessons"
          @back="goHome"
        />
        <HistoryDetail
          v-else-if="page === 'history-detail'"
          :city="city"
          :aqi="aqi"
          :initial-period="period"
          :history-data="historyData"
          @change-period="handleHistoryPeriodChange"
          @back="goHome"
        />
        <MapDetail
          v-else-if="page === 'map-detail'"
          :city="city"
          :aqi="aqi"
          :initial-point="point"
          :live-stations="liveStations"
          :user-location="userDeviceLocation"
          :is-live-tracking="isLiveTracking"
          :history-data="historyData"
          :realtime-data="realtimeData"
          @back="goHome"
          @detail="page = 'air-detail'"
        />
        <HealthRecommendations
          v-else-if="page === 'health-detail'"
          :city="city"
          :aqi="aqi"
          :health-data="healthData"
          @back="goHome"
          @profile="
            page = 'profile';
            window.scrollTo(0, 0);
          "
        />
        <AirQualityDetail
          v-else-if="page === 'air-detail'"
          :city="city"
          :aqi="aqi"
          :realtime-data="realtimeData"
          @back="goHome"
        />
        <template v-else>
          <div class="page-heading">
            <div>
              <div class="eyebrow">
                RUANG PANTAU UDARA /
                {{ page === 'home' ? 'DASHBOARD' : page === 'profile' ? 'PROFIL' : 'KOMUNITAS' }}
              </div>
              <h1>
                <template v-if="page === 'home'">
                  Kenali udara.<br class="mobile-break" /> Lindungi diri.
                </template>
                <template v-else-if="page === 'profile'">
                  Kesehatan dimulai dari diri.
                </template>
                <template v-else>
                  Udara kita. Cerita kita.
                </template>
              </h1>
              <p>
                {{
                  page === 'home'
                    ? 'Pantau udara real-time di sekitarmu, ambil langkah yang lebih baik hari ini.'
                    : page === 'profile'
                      ? 'Sesuaikan rekomendasi dengan kebutuhan kesehatanmu.'
                      : 'Bersama, kita bisa membuat udara menjadi lebih baik.'
                }}
              </p>
            </div>
            <div v-if="page !== 'profile'" class="location-group">
              <button
                type="button"
                :class="['live-track-btn', isLiveTracking ? 'active' : '']"
                :title="isLiveTracking ? 'Live GPS aktif: Posisi peta & AQI mengikuti perangkat Anda' : 'Klik untuk mengaktifkan live tracking posisi perangkat Anda'"
                @click="toggleLiveLocationTracking"
              >
                <span class="live-dot-wrap">
                  <span v-if="isLiveTracking" class="live-dot-ping"></span>
                  <span class="live-dot-core"></span>
                </span>
                <span>{{ isLiveTracking ? ' Live GPS' : 'Posisi Saya' }}</span>
              </button>

              <CitySearchSelect
                v-model="city"
                :cities="AVAILABLE_CITIES"
                :province="cityProvince"
                :collapsible="page === 'home'"
                @change="onManualCityChange"
              />
            </div>
          </div>


          <template v-if="page === 'home'">
            <div class="overview-grid">
              <AqiRealtimeCard
                :city="city"
                :aqi="aqi"
                :pm25="pm25"
                :pm10="realtimeData?.pm10"
                :updated-at="updatedAt"
                :weather="realtimeData?.weather"
                :realtime-data="realtimeData"
                :source="realtimeData?.source"
                @open-detail="page = 'air-detail'"
              />
              <HistorySummaryCard
                :period="period"
                :history-data="historyData"
                @update:period="period = $event"
                @open-history="page = 'history-detail'"
              />
            </div>

            <div class="detail-grid">
              <HomeMapCard
                :city="city"
                :aqi="aqi"
                :point="point"
                :zoom="zoom"
                :live-stations="liveStations"
                :user-location="userDeviceLocation"
                :is-live-tracking="isLiveTracking"
                @update:point="point = $event"
                @update:zoom="zoom = $event"
                @open-map-detail="page = 'map-detail'"
              />
              <HomeHealthCard
                :city="city"
                :aqi="aqi"
                :health-data="healthData"
                @open-health="
                  page = 'health-detail';
                  window.scrollTo(0, 0);
                "
                @open-profile="page = 'profile'"
              />
            </div>

            <HomeEducationSection
              :lessons="lessons"
              @open-education="
                page = 'education';
                window.scrollTo(0, 0);
              "
              @select-article="article = $event"
            />
          </template>

          <ProfileView
            v-else-if="page === 'profile'"
            :reports="reports"
            :personalized="personalized"
            @select-report="selectedReport = $event"
            @save-preferences="personalized = true"
          />

          <CommunityFeed
            v-else
            :reports="reports"
            :city="city"
            :loading="loadingFeed"
            @create-report="
              createDraft = newReport(city);
              report = true;
            "
            @select-report="selectedReport = $event"
            @toggle-like="handleToggleLike"
          />
        </template>

        <footer>
          <span class="footer-logo">PoluSee</span>
          <span>Lebih sadar udara. Lebih peduli sesama.</span>
          <small>Live Data terintegrasi dengan IQAir AirVisual API &amp; Backend Express REST API.</small>
        </footer>
      </main>
    </div>

    <ArticleQuickModal
      :article-index="article"
      :lessons="lessons"
      @close="article = null"
      @next="article = $event"
    />

    <ReportDialog
      v-if="activeReport"
      :key="activeReport.id"
      :report="activeReport"
      @save="saveReport"
      @delete="handleDeleteActiveReport"
      @close="selectedReport = null"
    />

    <ReportDialog
      v-if="report"
      :key="createDraft.id"
      creating
      :report="createDraft"
      @save="handleCreateReportSaved"
      @delete="() => {}"
      @close="report = false"
    />
  </div>
</template>
