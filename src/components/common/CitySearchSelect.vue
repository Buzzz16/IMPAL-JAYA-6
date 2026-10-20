<script setup>
/**
 * ============================================================================
 * KOMPONEN SEARCH & AUTOCOMPLETE LOKASI KOTA & TITIK PANTAU (POLUSEE)
 * File: src/components/common/CitySearchSelect.vue
 * Fitur:
 *   1. Fitur pencarian interaktif real-time (Case-Insensitive)
 *   2. Skor kedekatan / relevansi cerdas (semakin mendekati kata, opsi semakin teratas)
 *   3. Mode ganda: Mode Kota ('city') & Mode Titik Pantau ('station')
 *   4. Dukungan Hide / Collapsible (hanya menyisakan logo Location saat di-hide)
 *   5. Posisi Static & Fixed saat pop-up dari Hide (tidak terpengaruh panjang teks kota)
 *   6. Dropdown opsi elegan dengan highlight kata kunci, badge AQI resmi, & status aktif
 *   7. Navigasi keyboard (Panah Atas/Bawah, Enter, Escape) & Click-outside listener
 * ============================================================================
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import { AVAILABLE_CITIES, CITY_COORDINATES } from '../../features/map/stationsData';
import { getAqiColor } from '../../features/aqi/aqiData';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true,
  },
  cities: {
    type: Array,
    default: () => AVAILABLE_CITIES,
  },
  items: {
    type: Array,
    default: null,
  },
  mode: {
    type: String,
    default: 'city', // 'city' | 'station'
  },
  province: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
  collapsible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const searchQuery = ref('');
const isInputFocused = ref(false);
const highlightedIndex = ref(0);
const containerRef = ref(null);
const searchInputRef = ref(null);
const dropdownListRef = ref(null);

// Status collapse/hide (hanya aktif jika props.collapsible = true, default true saat di Home)
const isCollapsed = ref(props.collapsible ? true : false);

watch(
  () => props.collapsible,
  (val) => {
    if (!val) {
      isCollapsed.value = false;
    }
  }
);

function expandSearch() {
  isCollapsed.value = false;
  nextTick(() => {
    openDropdown();
  });
}

function collapseSearch() {
  closeDropdown();
  isCollapsed.value = true;
}

// Mengambil koleksi data mentah (bisa berupa daftar kota atau daftar stasiun)
const rawItems = computed(() => {
  if (Array.isArray(props.items) && props.items.length > 0) {
    return props.items;
  }
  return props.cities || AVAILABLE_CITIES;
});

// Membersihkan nama tampilan dari embel-embel stasiun yang panjang/berlebih
function cleanDisplayName(name) {
  if (!name) return '';
  return String(name).replace(/\s*\((?:Stasiun\s+Utama\s+IQAir|Stasiun\s+IQAir|IQAir)\)/gi, '').trim();
}

// Menemukan item yang sedang terpilih berdasarkan nama
const currentSelectedItem = computed(() => {
  return (
    rawItems.value.find(
      (it) => it.name === props.modelValue || cleanDisplayName(it.name) === cleanDisplayName(props.modelValue)
    ) || null
  );
});

// Placeholder dinamis
const computedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder;
  if (props.mode === 'station') {
    return 'Cari titik pantau / stasiun di Indonesia...';
  }
  return 'Cari kota di Indonesia...';
});

// Algoritma Levenshtein distance untuk toleransi typo
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[m][n];
}

// Menghitung skor relevansi cerdas (mendukung nama stasiun, kota, provinsi, dan region)
function computeItemScore(item, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 100;

  const name = (item.name || '').toLowerCase();
  const cleanName = cleanDisplayName(item.name || '').toLowerCase();
  const cityName = (item.cityName || '').toLowerCase();
  const province = (item.province || '').toLowerCase();
  const region = (item.region || '').toLowerCase();

  // 1. Kecocokan Sempurna (Exact Match)
  if (cleanName && cleanName === q) return 1000;
  if (cityName && cityName === q) return 990;
  if (name === q) return 980;

  // 2. Awalan Kata (Prefix Match)
  if (cleanName && cleanName.startsWith(q)) {
    return 920 - (cleanName.length - q.length) * 10;
  }
  if (cityName && cityName.startsWith(q)) {
    return 900 - (cityName.length - q.length) * 10;
  }
  if (name.startsWith(q)) {
    return 850 - (name.length - q.length) * 5;
  }

  // 3. Kata Kunci Termuat di Tengah (Infix Match)
  if (cleanName && cleanName.includes(q)) {
    return 800 - cleanName.indexOf(q) * 10;
  }

  // 3. Kata Kunci Termuat di Tengah (Infix Match)
  const cityIdx = cityName ? cityName.indexOf(q) : -1;
  if (cityIdx !== -1) {
    return 750 - cityIdx * 20;
  }

  const nameIdx = name.indexOf(q);
  if (nameIdx !== -1) {
    return 700 - nameIdx * 8;
  }

  // 4. Provinsi atau Region cocok
  if (province.startsWith(q)) return 550;
  if (province.includes(q)) return 450;
  if (region.startsWith(q)) return 400;
  if (region.includes(q)) return 350;

  // 5. Subsequence Match (huruf berurutan)
  let qIdx = 0;
  for (let i = 0; i < name.length && qIdx < q.length; i++) {
    if (name[i] === q[qIdx]) qIdx++;
  }
  if (qIdx === q.length) {
    return 260 - (name.length - q.length) * 2;
  }

  // 6. Toleransi typo (Fuzzy Distance)
  if (q.length >= 3) {
    if (cityName) {
      const distCity = levenshteinDistance(cityName, q);
      if (distCity <= 2) return 220 - distCity * 40;
    }
    const namePrefix = name.slice(0, Math.min(name.length, q.length + 3));
    const distName = levenshteinDistance(namePrefix, q);
    if (distName <= 2) return 180 - distName * 35;
  }

  return 0;
}

// Daftar item tersaring dan diurutkan berdasarkan skor kedekatan tertinggi
const filteredItems = computed(() => {
  const query = searchQuery.value.trim();
  const list = rawItems.value.map((it) => {
    const score = computeItemScore(it, query);
    return {
      ...it,
      score,
      isCurrent: it.name === props.modelValue,
    };
  });

  if (!query) {
    // Jika kolom pencarian kosong:
    return list.sort((a, b) => {
      // 1. Item aktif saat ini di atas
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;

      // 2. Untuk mode station: stasiun kota aktif di atas, lalu urut per kota dan nama
      if (props.mode === 'station') {
        if (a.isCurrentCity && !b.isCurrentCity) return -1;
        if (!a.isCurrentCity && b.isCurrentCity) return 1;
        const cComp = (a.cityName || '').localeCompare(b.cityName || '');
        if (cComp !== 0) return cComp;
        return (a.name || '').localeCompare(b.name || '');
      }

      // Mode kota: urut abjad nama kota
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  // Urutkan berdasarkan skor kedekatan tertinggi
  return list
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.name || '').localeCompare(b.name || '');
    });
});

// Info badge sisi kanan saat kotak tertutup
const currentProvince = computed(() => {
  if (props.province) return props.province;
  const match = rawItems.value.find((c) => c.name === props.modelValue);
  return match?.province || CITY_COORDINATES[props.modelValue]?.province || 'Indonesia';
});

const trailingInfo = computed(() => {
  // Dalam mode titik pantau / stasiun, jangan tampilkan bagian samping (Bandung AQI) dan pemisahnya
  if (props.mode === 'station') {
    return '';
  }
  return currentProvince.value;
});

const trailingInfoTitle = computed(() => {
  if (props.mode === 'station' && currentSelectedItem.value) {
    return `${currentSelectedItem.value.name} · Kota ${currentSelectedItem.value.cityName || ''} (${currentSelectedItem.value.province || ''})`;
  }
  return `Provinsi: ${currentProvince.value}`;
});

// Highlight teks yang cocok dengan query
function getHighlightedHtml(text, query) {
  if (!text) return '';
  if (!query || !query.trim()) return text;
  const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${q})`, 'gi');
  return String(text).replace(regex, '<span class="city-match-highlight">$1</span>');
}

// Logic untuk header grup kota saat query kosong pada mode station
function shouldShowGroupHeader(item, idx) {
  if (idx === 0) return true;
  const prev = filteredItems.value[idx - 1];
  if (!prev) return true;
  return prev.cityName !== item.cityName;
}

function getGroupHeaderTitle(item) {
  return (item.cityName || 'Titik Pantau').toUpperCase();
}

function getGroupHeaderSub(item) {
  // Hanya menampilkan nama provinsi (misal: Jawa Barat), tanpa nama pulau/region
  return item.province || '';
}

function openDropdown() {
  isOpen.value = true;
  highlightedIndex.value = 0;
  // Jika teks input sama persis dengan nama item aktif saat dibuka, pilih semua teks agar mudah ditimpa
  nextTick(() => {
    if (searchInputRef.value) {
      searchInputRef.value.select();
    }
  });
}

function closeDropdown() {
  isOpen.value = false;
  isInputFocused.value = false;
  // Kembalikan teks pencarian ke nama item yang aktif (nama bersih tanpa embel-embel)
  searchQuery.value = cleanDisplayName(props.modelValue || '');
}

function handleInputFocus() {
  isInputFocused.value = true;
  openDropdown();
}

function handleInputChange(event) {
  searchQuery.value = event.target.value;
  isOpen.value = true;
  highlightedIndex.value = 0;
}

function selectItem(item) {
  if (!item) return;
  emit('update:modelValue', item.name);
  emit('change', item.name, item);
  searchQuery.value = cleanDisplayName(item.name);
  isOpen.value = false;
  isInputFocused.value = false;
  if (searchInputRef.value) {
    searchInputRef.value.blur();
  }
}

function clearSearch(event) {
  event.stopPropagation();
  searchQuery.value = '';
  highlightedIndex.value = 0;
  if (searchInputRef.value) {
    searchInputRef.value.focus();
  }
}

// Navigasi keyboard
function handleKeyDown(event) {
  if (!isOpen.value) {
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault();
      openDropdown();
    }
    return;
  }

  const count = filteredItems.value.length;
  if (count === 0) {
    if (event.key === 'Escape') closeDropdown();
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    highlightedIndex.value = (highlightedIndex.value + 1) % count;
    scrollToHighlighted();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    highlightedIndex.value = (highlightedIndex.value - 1 + count) % count;
    scrollToHighlighted();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const chosen = filteredItems.value[highlightedIndex.value];
    if (chosen) selectItem(chosen);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeDropdown();
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    if (!dropdownListRef.value) return;
    const items = dropdownListRef.value.querySelectorAll('.city-search-item');
    const el = items[highlightedIndex.value];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  });
}

// Click outside handler
function handleClickOutside(event) {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    closeDropdown();
  }
}

watch(
  () => props.modelValue,
  (newVal) => {
    searchQuery.value = cleanDisplayName(newVal || '');
  },
  { immediate: true }
);

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div
    ref="containerRef"
    class="city-search-wrapper"
    :class="{
      'is-full-width': fullWidth,
      'is-collapsible': collapsible,
      'is-collapsed': collapsible && isCollapsed,
    }"
    @keydown="handleKeyDown"
  >
    <!-- JIKA SEDANG COLLAPSED (MODE HIDE): HANYA MENAMPILKAN LOGO LOCATION SAJA -->
    <button
      v-if="collapsible && isCollapsed"
      type="button"
      class="city-search-collapsed-btn"
      :title="`Lokasi: ${modelValue} (${currentProvince}) · Klik untuk membuka pencarian kota`"
      :aria-label="`Pilih lokasi kota: saat ini ${modelValue}`"
      @click="expandSearch"
    >
      <AppIcon name="pin" :size="18" />
    </button>

    <!-- KOTAK INPUT PENCARIAN (SAAT TIDAK COLLAPSED / POP-UP DARI HIDE) -->
    <div
      v-else
      class="city-search-box"
      :class="{
        'is-focused': isOpen || isInputFocused,
        'is-fixed-home': collapsible,
      }"
      @click="openDropdown"
    >
      <div
        class="city-search-icon"
        :class="{ 'is-clickable': collapsible }"
        :title="collapsible ? 'Sembunyikan ke logo lokasi (Hide)' : ''"
        aria-hidden="true"
        @click.stop="collapsible ? collapseSearch() : openDropdown()"
      >
        <AppIcon name="pin" :size="18" />
      </div>

      <div class="city-search-input-wrap">
        <input
          ref="searchInputRef"
          type="text"
          class="city-search-input"
          :value="searchQuery"
          :placeholder="computedPlaceholder"
          autocomplete="off"
          spellcheck="false"
          :aria-label="mode === 'station' ? 'Cari dan pilih titik pantau' : 'Cari dan pilih kota'"
          :aria-expanded="isOpen"
          aria-haspopup="listbox"
          @focus="handleInputFocus"
          @input="handleInputChange"
        />
        <button
          v-if="searchQuery && searchQuery !== modelValue"
          type="button"
          class="city-search-clear"
          title="Hapus pencarian"
          aria-label="Hapus kata kunci"
          @click="clearSearch"
        >
          ✕
        </button>
      </div>

      <div class="city-search-chevron" aria-hidden="true">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      <span
        v-if="trailingInfo"
        class="city-search-province"
        :title="trailingInfoTitle"
      >
        {{ trailingInfo }}
      </span>

      <!-- TOMBOL HIDE SAAT POP UP (MENYISAKAN LOGO LOCATION SAJA) -->
      <button
        v-if="collapsible"
        type="button"
        class="city-search-hide-btn"
        title="Sembunyikan ke logo lokasi (Hide)"
        aria-label="Sembunyikan pencarian kota"
        @click.stop="collapseSearch"
      >
        ✕
      </button>
    </div>

    <!-- DROPDOWN HASIL PENCARIAN -->
    <transition name="city-dropdown-fade">
      <div
        v-if="isOpen && (!collapsible || !isCollapsed)"
        class="city-search-dropdown"
        role="listbox"
      >
        <div class="city-dropdown-header">
          <span class="city-dropdown-title">
            {{ searchQuery
              ? `Hasil Pencarian (${filteredItems.length} ${mode === 'station' ? 'Titik Pantau' : 'Kota'})`
              : (mode === 'station' ? 'Pilih Titik Pantau' : 'Pilih Kota di Indonesia')
            }}
          </span>
          <span class="city-dropdown-hint">
            {{ searchQuery
              ? 'Diurutkan berdasarkan yang paling mendekati kata kunci'
              : (mode === 'station' ? 'Ketik nama stasiun, kota, atau provinsi' : 'Pencarian cerdas & toleransi salah ketik')
            }}
          </span>
        </div>

        <ul ref="dropdownListRef" class="city-dropdown-list">
          <template v-for="(item, idx) in filteredItems" :key="item.id || item.name">
            <!-- Header grup kota saat query kosong pada mode station -->
            <li
              v-if="mode === 'station' && !searchQuery && shouldShowGroupHeader(item, idx)"
              class="city-dropdown-group-header"
            >
              <span class="group-header-title">{{ getGroupHeaderTitle(item) }}</span>
              <span class="group-header-sub">{{ getGroupHeaderSub(item) }}</span>
            </li>

            <li
              class="city-search-item"
              :class="{
                'is-highlighted': idx === highlightedIndex,
                'is-active-item': item.isCurrent,
              }"
              role="option"
              :aria-selected="item.isCurrent"
              @mouseenter="highlightedIndex = idx"
              @click="selectItem(item)"
            >
              <div class="city-item-main">
                <span class="city-item-pin" aria-hidden="true">
                  <AppIcon name="pin" :size="14" />
                </span>
                <span
                  class="city-item-name"
                  v-html="getHighlightedHtml(cleanDisplayName(item.name), searchQuery)"
                />

                <!-- Badge AQI resmi dengan warna kategori AQI -->
                <span
                  v-if="item.value != null || item.aqi != null"
                  class="station-aqi-pill"
                  :style="{
                    backgroundColor: getAqiColor(item.value ?? item.aqi).bg,
                    color: getAqiColor(item.value ?? item.aqi).text,
                  }"
                >
                  AQI {{ item.value ?? item.aqi }}
                </span>

                <span
                  v-if="item.isCurrent"
                  class="city-item-badge-active"
                  :class="{ 'ml-auto': item.value == null && item.aqi == null }"
                >
                  Aktif
                </span>
              </div>

              <div class="city-item-meta">
                <span
                  v-if="item.cityName && cleanDisplayName(item.cityName) !== cleanDisplayName(item.name)"
                  class="city-item-city-name"
                >
                  <strong v-html="getHighlightedHtml(item.cityName, searchQuery)" /> ·
                </span>
                <span
                  class="city-item-province"
                  v-html="getHighlightedHtml(item.province, searchQuery)"
                />
              </div>
            </li>
          </template>

          <!-- State jika tidak ada yang cocok -->
          <li v-if="filteredItems.length === 0" class="city-search-empty">
            <span class="empty-icon">🔍</span>
            <strong>{{ mode === 'station' ? 'Titik pantau' : 'Kota' }} "{{ searchQuery }}" tidak ditemukan</strong>
            <p>
              {{ mode === 'station'
                ? 'Coba cari dengan nama stasiun, kota (misal: Badung, Samarinda, Jakarta), atau provinsi.'
                : 'Coba ketik nama kota utama seperti Jakarta, Bandung, Surabaya, Kumai, Samarinda, atau Medan.'
              }}
            </p>
            <button type="button" class="empty-reset-btn" @click="clearSearch">
              {{ mode === 'station' ? 'Tampilkan Semua Titik Pantau' : 'Tampilkan Semua Kota' }}
            </button>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.city-search-wrapper {
  position: relative;
  display: inline-block;
  vertical-align: middle;
}

.city-search-wrapper.is-full-width {
  display: block;
  width: 100%;
}

.city-search-wrapper.is-collapsible {
  flex-shrink: 0;
}

/* ============================================================================
 * TOMBOL COLLAPSED (HANYA LOGO LOCATION SAJA)
 * ============================================================================
 */
.city-search-collapsed-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 43px;
  height: 43px;
  background: #f0f2e9;
  border: 1px solid #a7b2a8;
  color: #285765;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
  animation: cityBoxFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.city-search-collapsed-btn:hover {
  background: #e5eadb;
  border-color: #285765;
  color: #1a3c46;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(40, 87, 101, 0.16);
}

.city-search-collapsed-btn:active {
  transform: translateY(0);
}

/* ============================================================================
 * KOTAK INPUT PENCARIAN
 * ============================================================================
 */
.city-search-box {
  display: flex;
  align-items: center;
  height: 43px;
  background: #f0f2e9;
  border: 1px solid #a7b2a8;
  padding: 0 10px;
  gap: 8px;
  cursor: text;
  transition: all 0.2s ease;
  user-select: none;
  animation: cityBoxFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cityBoxFadeIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* POSISI STATIC & FIXED SAAT POP-UP DARI HIDE DI HOME */
.city-search-box.is-fixed-home {
  width: 320px;
  min-width: 320px;
  max-width: 320px;
  flex-shrink: 0;
  box-sizing: border-box;
}

.city-search-wrapper.is-full-width .city-search-box {
  width: 100%;
}

.city-search-box:hover {
  background: #e9ece0;
  border-color: #285765;
}

.city-search-box.is-focused {
  background: #fafbf4;
  border-color: #285765;
  box-shadow: 0 0 0 2px rgba(40, 87, 101, 0.2);
}

.city-search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #263b3e;
  flex-shrink: 0;
}

.city-search-icon.is-clickable {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px;
  transition: background 0.15s ease, color 0.15s ease;
}

.city-search-icon.is-clickable:hover {
  background: rgba(40, 87, 101, 0.12);
  color: #1a3c46;
}

.city-search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 120px;
  max-width: 180px;
  flex: 1;
}

.city-search-box.is-fixed-home .city-search-input-wrap {
  min-width: 0;
  max-width: none;
}

.city-search-wrapper.is-full-width .city-search-input-wrap {
  max-width: none;
  min-width: 0;
}

.city-search-input {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: var(--text-label, 0.875rem);
  font-weight: 650;
  color: #263b3e;
  padding: 0;
  outline: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.city-search-input::placeholder {
  color: #8b958c;
  font-weight: 400;
  font-size: 0.825rem;
}

.city-search-clear {
  position: absolute;
  right: -2px;
  background: none;
  border: 0;
  color: #7d8580;
  font-size: 11px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s ease, color 0.15s ease;
}

.city-search-clear:hover {
  background: #cbd3c5;
  color: #111111;
}

.city-search-chevron {
  display: flex;
  align-items: center;
  color: #71827a;
  flex-shrink: 0;
}

.city-search-province {
  font-size: var(--text-caption, 0.75rem);
  color: #7b847e;
  border-left: 1px solid var(--line, #ced2c8);
  padding-left: 8px;
  white-space: nowrap;
  max-width: 95px;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.city-search-hide-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: transparent;
  border: 0;
  color: #71827a;
  cursor: pointer;
  padding: 0;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.15s ease;
  margin-left: 2px;
}

.city-search-hide-btn:hover {
  background: #cbd3c5;
  color: #111111;
  transform: scale(1.1);
}

/* ============================================================================
 * DROPDOWN LIST HASIL PENCARIAN
 * ============================================================================
 */
.city-search-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  min-width: 320px;
  width: 100%;
  max-width: 440px;
  background: var(--paper, #f8f8f1);
  border: 1px solid var(--ink, #263b3e);
  box-shadow: 0 8px 24px rgba(38, 59, 62, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  z-index: 100;
  overflow: hidden;
  animation: dropdownSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.city-search-box.is-fixed-home + .city-search-dropdown,
.city-search-wrapper.is-collapsible .city-search-dropdown {
  min-width: 320px;
  width: 100%;
  max-width: 360px;
}

.city-search-wrapper.is-full-width .city-search-dropdown {
  min-width: 100%;
  max-width: 100%;
}

@keyframes dropdownSlide {
  0% {
    opacity: 0;
    transform: translateY(-6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.city-dropdown-header {
  padding: 8px 12px;
  background: #edf0e5;
  border-bottom: 1px solid #ced2c8;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.city-dropdown-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #285765;
}

.city-dropdown-hint {
  font-size: 10px;
  color: #71827a;
}

.city-dropdown-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 290px;
  overflow-y: auto;
}

.city-dropdown-group-header {
  padding: 6px 12px;
  background: #e6ebdf;
  border-top: 1px solid #ced5c8;
  border-bottom: 1px solid #ced5c8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #285765;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  user-select: none;
  position: sticky;
  top: 0;
  z-index: 2;
}

.city-dropdown-group-header:first-child {
  border-top: none;
}

.group-header-title {
  font-weight: 750;
  color: #263b3e;
}

.group-header-sub {
  font-size: 11px;
  font-weight: 600;
  color: #556960;
  text-transform: none;
  letter-spacing: normal;
  white-space: nowrap;
}

.city-search-item {
  display: flex;
  flex-direction: column;
  padding: 8px 14px;
  cursor: pointer;
  border-bottom: 1px solid rgba(206, 210, 200, 0.4);
  transition: background 0.15s ease;
}

.city-search-item:last-child {
  border-bottom: none;
}

.city-search-item:hover,
.city-search-item.is-highlighted {
  background: #e8ede0;
}

.city-search-item.is-active-item {
  background: #e2ebdb;
}

.city-item-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.city-item-pin {
  font-size: 13px;
  line-height: 1;
  color: #285765;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.city-item-name {
  font-size: 13.5px;
  font-weight: 650;
  color: #263b3e;
  line-height: 1.3;
}

.station-aqi-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.03em;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
}

.city-item-badge-active {
  font-size: 10px;
  font-weight: 700;
  background: #285765;
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.city-item-badge-active.ml-auto {
  margin-left: auto;
}

.city-item-badge-active:not(.ml-auto) {
  margin-left: 6px;
}

.city-item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 20px;
  margin-top: 2px;
  font-size: 11px;
  color: #71827a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.city-item-city-name {
  color: #42554d;
}

.city-item-province {
  color: #556960;
  font-weight: 500;
}

:deep(.city-match-highlight) {
  background-color: #f6e05e;
  color: #1a202c;
  font-weight: 750;
  padding: 0 2px;
  border-radius: 2px;
}

/* State jika kosong */
.city-search-empty {
  padding: 20px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #556960;
}

.empty-icon {
  font-size: 24px;
}

.city-search-empty strong {
  font-size: 13px;
  color: #263b3e;
}

.city-search-empty p {
  font-size: 11px;
  color: #71827a;
  line-height: 1.5;
  margin: 0;
  max-width: 280px;
}

.empty-reset-btn {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 650;
  color: #285765;
  background: #e2ebdb;
  border: 1px solid #b8c8b2;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.empty-reset-btn:hover {
  background: #d4e2cb;
}

/* Transisi fade */
.city-dropdown-fade-enter-active,
.city-dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.city-dropdown-fade-enter-from,
.city-dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 600px) {
  .city-search-wrapper {
    width: 100%;
  }
  .city-search-box {
    width: 100%;
  }
  .city-search-box.is-fixed-home {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  .city-search-input-wrap {
    max-width: none;
    flex: 1;
  }
  .city-search-dropdown {
    min-width: 100%;
    left: 0;
    right: 0;
  }
}
</style>
