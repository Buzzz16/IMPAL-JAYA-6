<script setup>
/**
 * ============================================================================
 * HALAMAN FEED KOMUNITAS (FR-08 / UC-08 AKSES KOMUNITAS)
 * File: src/features/community/CommunityFeed.vue
 * Fitur:
 * 1. Filter feed berdasarkan posisi/kota yang dipilih (default: sesuai posisi aktif)
 * 2. Tampilan foto laporan & foto profil komunitas yang andal (tanpa broken image)
 * ============================================================================
 */
import { ref, computed } from 'vue';
import AppIcon from '../../components/common/AppIcon.vue';

const props = defineProps({
  reports: {
    type: Array,
    required: true,
  },
  city: {
    type: String,
    default: 'Samarinda',
  },
});

const emit = defineEmits(['create-report', 'select-report', 'toggle-like']);

const fallbackPhoto =
  'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85';

// Mode filter: 'city' (hanya kota terpilih, sesuai permintaan) atau 'all' (semua wilayah)
const filterMode = ref('city');

function getInitials(name = '') {
  if (!name) return 'AN';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function handleImageError(event) {
  event.target.src = fallbackPhoto;
}

// Laporan yang berasal dari kota/posisi terpilih
const cityFilteredReports = computed(() => {
  const target = (props.city || 'Samarinda').trim().toLowerCase();
  return props.reports.filter((entry) => {
    const reportCity = (entry.city || '').trim().toLowerCase();
    const reportArea = (entry.area || '').trim().toLowerCase();
    const reportAddress = (entry.address || '').trim().toLowerCase();
    return (
      reportCity === target ||
      reportCity.includes(target) ||
      target.includes(reportCity) ||
      reportArea.includes(target) ||
      reportAddress.includes(target)
    );
  });
});

// Daftar laporan yang ditampilkan sesuai pilihan filter
const displayReports = computed(() => {
  if (filterMode.value === 'all') {
    return props.reports;
  }
  return cityFilteredReports.value;
});
</script>

<template>
  <section class="secondary-panel max-w-none community-section">
    <div class="community-heading">
      <div class="community-title-wrap">
        <span class="eyebrow">FEED KOMUNITAS · {{ (city || 'LOKAL').toUpperCase() }}</span>
        <h2>Suara dari sekitar kita.</h2>
        <p class="community-subtitle">
          Menampilkan laporan warga di wilayah <strong>{{ city }}</strong> (sesuai posisi terpilih).
        </p>
      </div>
      <div class="community-action-wrap">
        <button class="primary-button create-report-btn" type="button" @click="emit('create-report')">
          + Buat laporan
        </button>
      </div>
    </div>

    <!-- Filter Tab: Hanya Posisi Terpilih (Default) vs Semua Kota -->
    <div class="community-filter-bar">
      <div class="segmented community-segmented" role="tablist" aria-label="Filter wilayah feed">
        <button
          type="button"
          :class="filterMode === 'city' ? 'selected' : ''"
          :aria-selected="filterMode === 'city'"
          @click="filterMode = 'city'"
        >
          <AppIcon name="pin" :size="13" class="tab-pin-icon" />
          <span>Wilayah {{ city }} ({{ cityFilteredReports.length }})</span>
        </button>
        <button
          type="button"
          :class="filterMode === 'all' ? 'selected' : ''"
          :aria-selected="filterMode === 'all'"
          @click="filterMode = 'all'"
        >
          Semua Kota ({{ reports.length }})
        </button>
      </div>
      <span class="active-reports-badge">
        {{ displayReports.length }} laporan aktif
      </span>
    </div>

    <!-- Feed List -->
    <div class="mx-auto mt-6 flex max-w-2xl flex-col gap-5 sm:gap-7">
      <!-- Empty State jika belum ada laporan di kota yang dipilih -->
      <div
        v-if="displayReports.length === 0"
        class="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 text-center"
      >
        <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--yellow)]/40 text-[#285765]">
          <AppIcon name="pin" :size="24" />
        </div>
        <h3 class="text-base font-bold text-[var(--ink)]">Belum ada laporan di {{ city }}</h3>
        <p class="mx-auto mt-1 max-w-md text-sm text-[var(--muted)]">
          Jadilah yang pertama membagikan pengamatan kondisi udara atau polusi di wilayah {{ city }}.
        </p>
        <div class="mt-5 flex flex-wrap justify-center gap-3">
          <button class="primary-button" type="button" @click="emit('create-report')">
            + Laporkan Kondisi di {{ city }}
          </button>
          <button
            v-if="reports.length > 0"
            class="text-link"
            type="button"
            @click="filterMode = 'all'"
          >
            Lihat semua kota ({{ reports.length }}) →
          </button>
        </div>
      </div>

      <!-- Feed Articles -->
      <article
        v-for="entry in displayReports"
        :key="entry.id"
        class="feed-article min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5 shadow-xs"
      >
        <!-- Header Penulis & Waktu -->
        <div class="feed-author-header flex items-start sm:items-center gap-3">
          <img
            v-if="entry.avatar || entry.foto_profil"
            class="h-9 w-9 shrink-0 rounded-full border border-[var(--line)] object-cover shadow-2xs"
            :src="entry.avatar || entry.foto_profil"
            :alt="`Avatar ${entry.author || 'User'}`"
            @error="$event.target.style.display = 'none'"
          />
          <div
            v-else
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--blue)] text-xs font-bold text-[var(--paper)]"
            aria-hidden="true"
          >
            {{ getInitials(entry.author || 'Aditya Nugraha') }}
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <strong class="text-sm font-bold text-[var(--ink)]">{{ entry.author || 'Aditya Nugraha' }}</strong>
            <span class="text-xs text-[var(--muted)]">{{ entry.user || '@adityanugraha' }}</span>
            <span class="text-xs text-[var(--muted)]">· {{ entry.time || 'Hari ini' }}</span>
          </div>
          <span
            v-if="entry.city"
            class="city-tag inline-flex items-center gap-1 shrink-0 rounded bg-[#edf2e9] px-2 py-0.5 text-[11px] font-semibold text-[#285765]"
          >
            <AppIcon name="pin" :size="12" />
            <span>{{ entry.city }}</span>
          </span>
        </div>

        <!-- Teks Deskripsi / Caption Laporan -->
        <p class="feed-caption mt-3 whitespace-pre-wrap break-words text-sm sm:text-base font-medium leading-relaxed text-[var(--ink)]">
          {{ entry.caption }}
        </p>

        <!-- Lokasi Spesifik / Area -->
        <span class="mt-1.5 block text-xs font-semibold text-[var(--muted)]">
          {{ entry.area ? `${entry.area} · ` : '' }}{{ entry.city }}
        </span>

        <!-- Foto Laporan Komunitas -->
        <button
          v-if="entry.image || entry.photo || entry.url_foto_bukti"
          type="button"
          class="mt-3.5 block w-full overflow-hidden rounded-xl sm:rounded-2xl border border-[var(--line)] bg-[#263b3e] text-left cursor-pointer transition hover:opacity-95"
          :aria-label="`Buka laporan: ${entry.caption}`"
          @click="emit('select-report', entry.id)"
        >
          <img
            class="max-h-[50vh] sm:max-h-[70vh] w-full object-cover transition duration-300 hover:scale-[1.01]"
            :src="entry.image || entry.photo || entry.url_foto_bukti || fallbackPhoto"
            :alt="entry.caption"
            loading="lazy"
            @error="handleImageError"
          />
        </button>

        <!-- Tombol Aksi Suka & Komentar -->
        <div class="mt-3.5 flex items-center gap-2.5 text-[var(--blue)]">
          <button
            type="button"
            class="feed-action-btn flex items-center gap-2 rounded-full bg-[var(--line)]/50 px-3.5 py-1.5 text-xs font-bold transition hover:bg-[var(--yellow)] aria-pressed:text-red-700"
            :aria-label="entry.liked ? 'Batalkan suka pada laporan' : 'Sukai laporan'"
            :aria-pressed="entry.liked"
            @click="
              emit('toggle-like', {
                ...entry,
                liked: !entry.liked,
                likes: (entry.likes || 0) + (entry.liked ? -1 : 1),
              })
            "
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              :fill="entry.liked ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
              />
            </svg>
            <span>{{ entry.likes || 0 }}</span>
          </button>
          <button
            type="button"
            class="feed-action-btn flex items-center gap-2 rounded-full bg-[var(--line)]/50 px-3.5 py-1.5 text-xs font-bold transition hover:bg-[var(--yellow)]"
            :aria-label="`Buka ${(entry.comments || []).length} komentar laporan`"
            @click="emit('select-report', entry.id)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"
              />
            </svg>
            <span>{{ (entry.comments || []).length }}</span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.community-section {
  width: 100%;
  box-sizing: border-box;
}

.community-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.community-title-wrap {
  flex: 1;
  min-width: 0;
}

.community-subtitle {
  margin-top: 0.35rem;
  font-size: 0.875rem;
  color: var(--muted);
}

.community-filter-bar {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid var(--line);
  padding-bottom: 1rem;
}

.community-segmented {
  display: inline-flex;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.community-segmented::-webkit-scrollbar {
  display: none;
}

.community-segmented button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.tab-pin-icon {
  flex-shrink: 0;
}

.active-reports-badge {
  font-size: 0.75rem;
  color: var(--muted);
  white-space: nowrap;
}

.feed-action-btn {
  min-height: 38px;
}

/* Responsif Mobile (< 640px) */
@media (max-width: 640px) {
  .community-heading {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .create-report-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
  }

  .community-filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .community-segmented {
    width: 100%;
    display: flex;
  }

  .community-segmented button {
    flex: 1;
    justify-content: center;
    font-size: 11.5px;
    padding: 8px 6px;
  }

  .active-reports-badge {
    text-align: right;
  }

  .feed-author-header {
    flex-wrap: wrap;
  }

  .city-tag {
    margin-left: auto;
  }
}
</style>
