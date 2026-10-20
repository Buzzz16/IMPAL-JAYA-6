<script setup>
/**
 * ============================================================================
 * HALAMAN KONTEN EDUKASI & FITUR ULASAN + EDIT ULASAN (FR-06 / UC-06 & FR-07 / UC-07)
 * File: src/features/education/EducationPage.vue
 * Mengacu pada: EducationPage.tsx + SKPL-1000 UC-06 (View & Ulas Konten Edukasi)
 *               dan UC-07 (Edit Konten Ulasan Edukasi)
 * ============================================================================
 */
import { ref, reactive, computed, nextTick } from 'vue';
import { initialLessons, initialLessonReviews } from './educationData';
import { apiRequest } from '../../services/apiClient';
import { userProfileStore } from '../auth/authStore';

const props = defineProps({
  lessons: {
    type: Array,
    default: () => initialLessons,
  },
});

const emit = defineEmits(['back']);

const query = ref('');
const topic = ref('Semua topik');
const audience = ref('Semua pembaca');
const duration = ref('Semua durasi');
const sort = ref('Pilihan editor');
const selected = ref(null);
const readingTitle = ref(null);

// State Ulasan Edukasi (UC-06) & Edit Ulasan (UC-07)
const reviewsByLesson = reactive({ ...initialLessonReviews });
const newReviewText = ref('');
const newReviewRating = ref(5);
const reviewError = ref('');
const editingReviewId = ref(null);
const editingReviewText = ref('');
const editingReviewRating = ref(5);

const topics = computed(() => [
  'Semua topik',
  ...new Set(props.lessons.map((item) => item.topic)),
]);

const results = computed(() => {
  const filtered = props.lessons.filter(
    (item) =>
      (topic.value === 'Semua topik' || item.topic === topic.value) &&
      (audience.value === 'Semua pembaca' || item.audience === audience.value) &&
      (duration.value === 'Semua durasi' || item.minutes <= 4) &&
      `${item.title} ${item.topic} ${item.summary} ${item.sections.join(' ')}`
        .toLocaleLowerCase('id')
        .includes(query.value.trim().toLocaleLowerCase('id'))
  );

  if (sort.value === 'Baca tercepat') {
    return [...filtered].sort((a, b) => a.minutes - b.minutes);
  }
  if (sort.value === 'Judul A–Z') {
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'id'));
  }
  return filtered;
});

const currentReviews = computed(() => {
  if (!selected.value) return [];
  return reviewsByLesson[selected.value.id] || [];
});

function reset() {
  query.value = '';
  topic.value = 'Semua topik';
  audience.value = 'Semua pembaca';
  duration.value = 'Semua durasi';
  sort.value = 'Pilihan editor';
}

async function openLesson(item) {
  selected.value = item;
  reviewError.value = '';
  editingReviewId.value = null;
  window.scrollTo(0, 0);
  await nextTick();
  readingTitle.value?.focus();
}

// UC-06: Kirim Ulasan & Rating pada Materi Edukasi
async function submitReview() {
  reviewError.value = '';
  if (!newReviewText.value.trim()) {
    reviewError.value = 'Isi ulasan tidak boleh kosong.';
    return;
  }
  const lessonId = selected.value.id;
  const created = {
    id_ulasan: `rev-${Date.now()}`,
    id_konten: lessonId,
    author: userProfileStore.nama_lengkap,
    handle: userProfileStore.username,
    isOwner: true,
    rating: Number(newReviewRating.value),
    isi_ulasan: newReviewText.value.trim(),
    is_edited: false,
    updated_at: 'Baru saja',
  };

  if (!reviewsByLesson[lessonId]) {
    reviewsByLesson[lessonId] = [];
  }
  reviewsByLesson[lessonId].unshift(created);
  newReviewText.value = '';
  newReviewRating.value = 5;

  try {
    await apiRequest(`/edukasi/${lessonId}/ulasan`, {
      method: 'POST',
      body: JSON.stringify({
        isi_ulasan: created.isi_ulasan,
        rating: created.rating,
      }),
    });
  } catch {
    // Tersimpan di sesi state apabila backend belum aktif
  }
}

// UC-07: Mulai Edit Konten (Ulasan Edukasi)
function startEditReview(rev) {
  editingReviewId.value = rev.id_ulasan;
  editingReviewText.value = rev.isi_ulasan;
  editingReviewRating.value = rev.rating;
  reviewError.value = '';
}

function cancelEditReview() {
  editingReviewId.value = null;
  editingReviewText.value = '';
  reviewError.value = '';
}

// UC-07: Simpan Perubahan Edit Konten (Ulasan Edukasi)
async function saveEditReview(rev) {
  if (!editingReviewText.value.trim()) {
    reviewError.value = 'Isi konten ulasan tidak boleh kosong.';
    return;
  }
  rev.isi_ulasan = editingReviewText.value.trim();
  rev.rating = Number(editingReviewRating.value);
  rev.is_edited = true;
  rev.updated_at = 'Baru saja';
  editingReviewId.value = null;
  reviewError.value = '';

  try {
    await apiRequest(`/edukasi/ulasan/${rev.id_ulasan}`, {
      method: 'PUT',
      body: JSON.stringify({
        isi_ulasan: rev.isi_ulasan,
        rating: rev.rating,
      }),
    });
  } catch {
    // Tersimpan pada sesi lokal apabila backend belum aktif
  }
}
</script>

<template>
  <div class="education-page">
    <button class="text-link" @click="selected ? (selected = null) : emit('back')">
      ← {{ selected ? 'Kembali ke daftar topik' : 'Kembali ke dashboard' }}
    </button>

    <article v-if="selected" class="education-reading secondary-panel">
      <span class="eyebrow">{{ selected.topic.toUpperCase() }} / {{ selected.minutes }} MENIT BACA</span>
      <img v-if="selected.cover" class="admin-form-cover" :src="selected.cover" :alt="selected.title" />
      <h1 ref="readingTitle" tabindex="-1">{{ selected.title }}</h1>
      <p>{{ selected.summary }}</p>

      <section v-for="(text, index) in selected.sections" :key="index">
        <span class="eyebrow">
          {{ String(index + 1).padStart(2, '0') }} /
          {{ ['PAHAMI', 'KENALI', 'AMBIL LANGKAH'][index] || 'PELAJARI LEBIH LANJUT' }}
        </span>
        <p>{{ text }}</p>
      </section>

      <div class="article-note">
        Materi edukasi umum, bukan diagnosis atau pengganti nasihat tenaga kesehatan. Untuk kondisi pribadi, konsultasikan dengan dokter.
      </div>
      <p>
        Referensi belajar:
        <a
          class="text-link"
          href="https://www.who.int/health-topics/air-pollution"
          target="_blank"
          rel="noreferrer"
        >
          WHO — Air pollution ↗
        </a>
        ·
        <a
          class="text-link"
          href="https://www.airnow.gov/aqi/aqi-basics/"
          target="_blank"
          rel="noreferrer"
        >
          AirNow — AQI basics ↗
        </a>
      </p>

      <!-- UC-06 (View & Ulas Konten Edukasi) & UC-07 (Edit Konten Ulasan) sesuai SKPL-1000 -->
      <section>
        <span class="eyebrow">ULASAN &amp; TANGGAPAN PEMBACA</span>
        <form @submit.prevent="submitReview">
          <div class="admin-form-grid">
            <label class="form-label">
              Rating materi
              <select v-model="newReviewRating">
                <option :value="5">★★★★★ (5/5 · Sangat bermanfaat)</option>
                <option :value="4">★★★★☆ (4/5 · Bermanfaat)</option>
                <option :value="3">★★★☆☆ (3/5 · Cukup jelas)</option>
                <option :value="2">★★☆☆☆ (2/5 · Perlu tambahan)</option>
                <option :value="1">★☆☆☆☆ (1/5 · Kurang relevan)</option>
              </select>
            </label>
          </div>
          <label class="form-label">
            Tulis ulasan materi edukasi
            <textarea
              v-model="newReviewText"
              placeholder="Bagikan pemahaman atau tanggapanmu mengenai materi ini…"
              maxlength="400"
            />
          </label>
          <p v-if="reviewError" class="admin-danger" role="alert">{{ reviewError }}</p>
          <button type="submit" class="primary-button">Kirim Ulasan</button>
        </form>

        <div
          v-for="rev in currentReviews"
          :key="rev.id_ulasan"
          class="community-post"
        >
          <div style="width: 100%">
            <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 1rem">
              <div>
                <strong>{{ rev.author }}</strong>
                <small>
                  {{ rev.handle }} · {{ '★'.repeat(rev.rating) }}{{ '☆'.repeat(5 - rev.rating) }} · {{ rev.updated_at }}
                  <span v-if="rev.is_edited"> (Diedit)</span>
                </small>
              </div>
              <button
                v-if="rev.isOwner && editingReviewId !== rev.id_ulasan"
                type="button"
                class="text-link"
                @click="startEditReview(rev)"
              >
                Edit
              </button>
            </div>

            <div v-if="editingReviewId === rev.id_ulasan" style="margin-top: 1rem">
              <label class="form-label !my-2">
                Ubah rating
                <select v-model="editingReviewRating">
                  <option :value="5">★★★★★ (5/5)</option>
                  <option :value="4">★★★★☆ (4/5)</option>
                  <option :value="3">★★★☆☆ (3/5)</option>
                  <option :value="2">★★☆☆☆ (2/5)</option>
                  <option :value="1">★☆☆☆☆ (1/5)</option>
                </select>
              </label>
              <label class="form-label !my-2">
                Ubah isi ulasan
                <textarea v-model="editingReviewText" maxlength="400" />
              </label>
              <div class="admin-table-actions">
                <button type="button" class="primary-button" @click="saveEditReview(rev)">
                  Simpan Perubahan
                </button>
                <button type="button" class="text-link" @click="cancelEditReview">
                  Batal
                </button>
              </div>
            </div>
            <p v-else>{{ rev.isi_ulasan }}</p>
          </div>
        </div>
      </section>
    </article>

    <template v-else>
      <div class="education-hero">
        <div>
          <span class="eyebrow">POLUSEE / RUANG EDUKASI</span>
          <h1>Lebih paham udara.<br />Lebih siap melindungi diri.</h1>
          <p>Temukan jawaban, kenali risikonya, dan mulai kebiasaan yang lebih sehat.</p>
        </div>
        <div class="education-stamp">
          <span class="eyebrow">BEKAL NAPAS SEHAT</span>
          <strong>01 / 07</strong>
          <span>Satu topik hari ini.<br />Langkah baik untuk esok.</span>
        </div>
      </div>

      <section class="education-controls" aria-label="Cari dan filter materi edukasi">
        <label class="education-search">
          Cari pengetahuan baru
          <input
            v-model="query"
            type="search"
            placeholder="Cari asma, masker, PM2.5, atau AQI…"
          />
        </label>
        <div class="education-topics" aria-label="Pilih topik">
          <button
            v-for="value in topics"
            :key="value"
            :aria-pressed="topic === value"
            :class="topic === value ? 'selected' : ''"
            @click="topic = value"
          >
            {{ value }}
          </button>
        </div>
        <div class="education-filters">
          <label>
            Pembaca
            <select v-model="audience">
              <option v-for="value in ['Semua pembaca', 'Semua orang', 'Kelompok sensitif']" :key="value">
                {{ value }}
              </option>
            </select>
          </label>
          <label>
            Waktu baca
            <select v-model="duration">
              <option>Semua durasi</option>
              <option>4 menit atau kurang</option>
            </select>
          </label>
          <label>
            Urutkan
            <select v-model="sort">
              <option v-for="value in ['Pilihan editor', 'Baca tercepat', 'Judul A–Z']" :key="value">
                {{ value }}
              </option>
            </select>
          </label>
          <button class="text-link" @click="reset">Reset filter</button>
        </div>
      </section>

      <div class="education-result-heading">
        <h2>Pengetahuan untuk keseharianmu.</h2>
        <span role="status" aria-live="polite">{{ results.length }} materi ditemukan</span>
      </div>

      <div class="article-grid">
        <button
          v-for="item in results"
          :key="item.title"
          class="article-card education-lesson"
          @click="openLesson(item)"
        >
          <img v-if="item.cover" class="admin-report-cover" :src="item.cover" alt="" />
          <div class="education-lesson-top">
            <span class="eyebrow">{{ item.topic.toUpperCase() }}</span>
            <span aria-hidden="true">↗</span>
          </div>
          <div class="article-body">
            <h3>{{ item.title }}</h3>
            <p>{{ item.summary }}</p>
            <div class="education-lesson-meta">
              <span>{{ item.minutes }} menit baca</span>
              <span>{{ item.audience }}</span>
            </div>
          </div>
        </button>
      </div>

      <div v-if="!results.length" class="secondary-panel education-empty">
        <h2>Belum ada materi yang cocok.</h2>
        <p>Coba kata kunci lain atau longgarkan filter pencarian.</p>
        <button class="primary-button" @click="reset">Tampilkan semua materi</button>
      </div>

      <div class="article-note">
        Belajar untuk lebih siap, bukan untuk mendiagnosis. Jika ada gejala berat atau menetap, hubungi tenaga kesehatan.
      </div>
    </template>
  </div>
</template>
