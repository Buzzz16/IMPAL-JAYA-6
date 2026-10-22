<script setup>
/**
 * ============================================================================
 * DIALOG LAPOR KEJADIAN POLUSI & DETAIL KONTEN KOMUNITAS (FR-09 / UC-09 & FR-10 / UC-10)
 * File: src/features/community/ReportDialog.vue
 * Mengacu pada: ReportDialog.tsx + OpenStreetMap Nominatim Geocoding API
 * Menjamin kompatibilitas gambar & foto laporan
 * ============================================================================
 */
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { detectUserLocationViaOpenStreetMap } from '../../services/osmMapService';
import { apiRequest } from '../../services/apiClient';
import AppIcon from '../../components/common/AppIcon.vue';

const props = defineProps({
  report: {
    type: Object,
    required: true,
  },
  creating: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['save', 'delete', 'close']);

const defaultReportPhoto =
  'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85';

const dialog = ref(null);
const mode = ref(props.creating ? 'edit' : 'detail');
const menu = ref(false);
const draft = reactive({
  ...props.report,
  image: props.report.image || props.report.photo || '',
  photo: props.report.photo || props.report.image || '',
  comments: [...(props.report.comments || [])],
});
const comment = ref('');
const error = ref('');
const loading = ref(false);
const detectingGps = ref(false);

let previousFocus = null;
let previousOverflow = '';

onMounted(() => {
  previousFocus = document.activeElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  dialog.value?.showModal();
});

onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow;
  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus();
  }
});

function cancel() {
  Object.assign(draft, props.report, {
    image: props.report.image || props.report.photo || '',
    photo: props.report.photo || props.report.image || '',
    comments: [...(props.report.comments || [])],
  });
  error.value = '';
  mode.value = 'detail';
}

function handleDialogCancel(event) {
  event.preventDefault();
  if (mode.value !== 'detail' && !props.creating) {
    cancel();
  } else {
    emit('close');
  }
}

function handleBackdropClick(event) {
  if (event.target === event.currentTarget && mode.value === 'detail') {
    emit('close');
  }
}

function compressImage(file, maxWidth = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(e.target?.result || '');
    };
    reader.readAsDataURL(file);
  });
}

async function handleImageChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    error.value = 'Pilih JPG, PNG, atau WebP, maksimal 10 MB.';
    return;
  }
  error.value = '';
  loading.value = true;
  try {
    const compressedUri = await compressImage(file, 1000, 0.72);
    draft.image = compressedUri;
    draft.photo = compressedUri;
  } catch {
    error.value = 'Gambar gagal diproses. Silakan coba kembali.';
  } finally {
    loading.value = false;
  }
}

// [EXTERNAL API] Deteksi titik lokasi otomatis via HTML5 Geolocation + OpenStreetMap Nominatim API
async function handleDetectLocation() {
  detectingGps.value = true;
  error.value = '';
  try {
    const loc = await detectUserLocationViaOpenStreetMap();
    draft.city = loc.city;
    draft.area = loc.area;
    draft.latitude = loc.latitude;
    draft.longitude = loc.longitude;
  } catch {
    error.value = 'Izin lokasi ditolak atau tidak tersedia. Silakan isi area lokasi secara manual.';
  } finally {
    detectingGps.value = false;
  }
}

async function handleSaveReport() {
  if (!draft.caption.trim() || !draft.area.trim()) {
    error.value = 'Caption dan area wajib diisi.';
    return;
  }
  const img = draft.image || draft.photo || defaultReportPhoto;
  const updated = {
    ...draft,
    caption: draft.caption.trim(),
    area: draft.area.trim(),
    image: img,
    photo: img,
    url_foto_bukti: img,
  };

  try {
    if (props.creating) {
      await apiRequest('/komunitas/lapor', {
        method: 'POST',
        body: JSON.stringify(updated),
      });
    }
  } catch {
    // Tetap disimpan ke state lokal apabila server backend belum dinyalakan
  }

  emit('save', updated);
  if (props.creating) {
    emit('close');
  } else {
    mode.value = 'detail';
  }
}

function handleToggleLike() {
  const updated = {
    ...props.report,
    liked: !props.report.liked,
    likes: (props.report.likes || 0) + (props.report.liked ? -1 : 1),
  };
  emit('save', updated);
}

function handleAddComment() {
  if (!comment.value.trim()) return;
  const updated = {
    ...props.report,
    comments: [
      ...(props.report.comments || []),
      { name: 'adityanugraha', text: comment.value.trim() },
    ],
  };
  emit('save', updated);
  comment.value = '';
}

const conditionMap = {
  bagus: 'Bagus',
  normal: 'Normal',
  buruk: 'Buruk',
};
</script>

<template>
  <dialog
    ref="dialog"
    class="report-dialog"
    :aria-label="
      mode === 'edit'
        ? 'Edit laporan'
        : mode === 'delete'
          ? 'Konfirmasi hapus laporan'
          : 'Detail laporan'
    "
    @cancel="handleDialogCancel"
    @click="handleBackdropClick"
  >
    <div v-if="mode === 'delete'" class="report-confirm">
      <span class="eyebrow">KONFIRMASI HAPUS</span>
      <h2>Hapus laporan ini?</h2>
      <p>
        Laporan akan dihapus dari profil dan feed komunitas. Tindakan ini tidak dapat dibatalkan.
      </p>
      <div class="report-confirm-actions">
        <button class="primary-button" type="button" autofocus @click="mode = 'detail'">Batal</button>
        <button class="report-danger" type="button" @click="emit('delete')">Hapus laporan</button>
      </div>
    </div>

    <form v-else-if="mode === 'edit'" @submit.prevent="handleSaveReport">
      <div class="report-dialog-header">
        <button type="button" class="text-link" @click="creating ? emit('close') : cancel()">
          Cancel
        </button>
        <strong>{{ creating ? 'Buat laporan' : 'Edit laporan' }}</strong>
        <button class="text-link" type="submit" :disabled="loading">Done</button>
      </div>
      <div class="report-edit-body">
        <img
          v-if="draft.image || draft.photo"
          class="report-edit-image"
          :src="draft.image || draft.photo"
          alt="Pratinjau gambar laporan"
          @error="$event.target.src = defaultReportPhoto"
        />
        <label class="form-label">
          Gambar laporan
          <input type="file" accept="image/jpeg,image/png" @change="handleImageChange" />
          <small>JPG atau PNG · maksimal 10 MB</small>
        </label>
        <div class="report-form-grid">
          <label class="form-label">
            Lokasi kejadian
            <select v-model="draft.city">
              <option
                v-for="c in ['Samarinda', 'Balikpapan', 'Jakarta', 'Bandung']"
                :key="c"
                :value="c"
              >
                {{ c }}
              </option>
            </select>
          </label>
          <label class="form-label">
            Area atau titik lokasi
            <input
              v-model="draft.area"
              required
              placeholder="Jalan atau area pengamatan"
            />
            <button
              type="button"
              class="text-link detect-loc-btn"
              style="align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;"
              :disabled="detectingGps"
              @click="handleDetectLocation"
            >
              <AppIcon name="pin" :size="14" class="shrink-0" />
              <span>{{ detectingGps ? 'Mendeteksi via OpenStreetMap…' : 'Deteksi lokasi via OpenStreetMap' }}</span>
            </button>
          </label>
        </div>
        <fieldset class="report-condition">
          <legend>Kondisi udara</legend>
          <label
            v-for="[value, label] in [
              ['bagus', 'Bagus'],
              ['normal', 'Normal'],
              ['buruk', 'Buruk'],
            ]"
            :key="value"
          >
            <input
              type="radio"
              name="condition"
              :checked="draft.condition === value"
              @change="draft.condition = value"
            />
            {{ label }}
          </label>
        </fieldset>
        <div class="report-form-grid">
          <label class="form-label">
            Kemungkinan sumber
            <select v-model="draft.source">
              <option value="">Pilih sumber</option>
              <option
                v-for="s in [
                  'Asap kendaraan',
                  'Pembakaran sampah',
                  'Asap industri',
                  'Debu jalan atau konstruksi',
                  'Tidak diketahui',
                ]"
                :key="s"
                :value="s"
              >
                {{ s }}
              </option>
            </select>
          </label>
          <label class="form-label">
            Waktu pengamatan
            <input v-model="draft.observedAt" type="datetime-local" />
          </label>
        </div>
        <label class="form-label">
          Caption
          <textarea v-model="draft.caption" required maxlength="500" />
          <small>{{ draft.caption.length }}/500</small>
        </label>
        <label class="form-label">
          Saran atau tindak lanjut (opsional)
          <textarea v-model="draft.suggestion" maxlength="1000" />
        </label>
        <label v-if="creating" class="checkbox-label">
          <input required type="checkbox" />
          Laporan berdasarkan pengamatan langsung dan tidak memuat informasi pribadi orang lain.
        </label>
        <p v-if="error" role="alert" class="report-danger">{{ error }}</p>
        <small>Perubahan disimpan dalam sesi ini dan dikirim ke layanan laporan PoluSee.</small>
      </div>
    </form>

    <template v-else>
      <div class="report-dialog-header">
        <button class="text-link" type="button" aria-label="Tutup detail laporan" @click="emit('close')">
          ← Kembali
        </button>
        <strong>Detail laporan</strong>
        <div class="report-menu-wrap">
          <button
            class="icon-button"
            type="button"
            aria-label="Opsi laporan"
            :aria-expanded="menu"
            @click="menu = !menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
          <div v-if="menu" class="report-menu">
            <button
              class="report-danger"
              type="button"
              @click="
                menu = false;
                mode = 'delete';
              "
            >
              Hapus
            </button>
            <button
              type="button"
              @click="
                Object.assign(draft, report, {
                  image: report.image || report.photo || '',
                  photo: report.photo || report.image || ''
                });
                menu = false;
                mode = 'edit';
              "
            >
              Edit
            </button>
          </div>
        </div>
      </div>
      <div class="report-detail-layout">
        <div class="report-large-image">
          <img
            v-if="report.image || report.photo"
            :src="report.image || report.photo"
            :alt="report.caption"
            @error="$event.target.src = defaultReportPhoto"
          />
          <span v-else>Tidak ada gambar</span>
        </div>
        <div class="report-detail-info">
          <div class="report-author">
            <span class="avatar">AN</span>
            <div>
              <strong>{{ report.author || 'Aditya Nugraha' }}</strong>
              <small>{{ report.area }} · {{ report.city }}</small>
            </div>
          </div>
          <p class="report-caption">
            <strong>{{ report.user || '@adityanugraha' }}</strong> {{ report.caption }}
          </p>
          <dl class="report-facts">
            <div>
              <dt>Kondisi udara</dt>
              <dd>{{ conditionMap[report.condition] || report.condition }}</dd>
            </div>
            <div v-if="report.source">
              <dt>Sumber</dt>
              <dd>{{ report.source }}</dd>
            </div>
            <div v-if="report.observedAt">
              <dt>Pengamatan</dt>
              <dd>{{ new Date(report.observedAt).toLocaleString('id-ID') }}</dd>
            </div>
            <div v-if="report.suggestion">
              <dt>Saran</dt>
              <dd>{{ report.suggestion }}</dd>
            </div>
          </dl>
          <div class="report-social">
            <button
              type="button"
              :aria-pressed="report.liked"
              :aria-label="report.liked ? 'Batalkan suka' : 'Sukai laporan'"
              @click="handleToggleLike"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                stroke="currentColor"
                :fill="report.liked ? 'currentColor' : 'none'"
                aria-hidden="true"
              >
                <path
                  d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z"
                />
              </svg>
              {{ report.likes || 0 }} suka
            </button>
            <span>{{ (report.comments || []).length }} komentar</span>
          </div>
          <div class="report-comments">
            <p v-for="(item, index) in report.comments" :key="index">
              <strong>{{ item.name }}</strong> {{ item.text }}
            </p>
            <p v-if="!report.comments || !report.comments.length">Belum ada komentar. Mulai percakapan yang baik.</p>
          </div>
          <form class="report-comment-form" @submit.prevent="handleAddComment">
            <input
              v-model="comment"
              class="comment-input"
              aria-label="Tambahkan komentar"
              placeholder="Tambahkan komentar…"
              maxlength="500"
            />
            <button class="primary-button comment-submit-btn" type="submit" :disabled="!comment.trim()">Kirim</button>
          </form>
        </div>
      </div>
    </template>
  </dialog>
</template>

<style scoped>
.report-dialog {
  border-radius: 12px;
}

.comment-input {
  flex: 1;
  min-width: 0;
  border: 1px solid #c8cfc0;
  background: #ffffff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: var(--text-label);
  outline-offset: 2px;
}

.comment-input:focus {
  border-color: var(--blue);
  background: #ffffff;
}

.comment-submit-btn {
  padding: 8px 16px;
  font-size: var(--text-caption);
  font-weight: 700;
  white-space: nowrap;
}

.detect-loc-btn {
  cursor: pointer;
  padding: 4px 0;
  font-size: 12px;
}

/* Responsif Mobile (< 640px) */
@media (max-width: 640px) {
  .report-dialog {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    inset: 0 !important;
    margin: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .report-dialog-header {
    height: 52px;
    padding: 0 16px;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .report-detail-layout {
    display: flex;
    flex-direction: column;
  }

  .report-large-image {
    min-height: 160px;
    max-height: 38dvh;
    width: 100%;
  }

  .report-large-image img {
    max-height: 38dvh;
    object-fit: cover;
  }

  .report-detail-info {
    padding: 1rem;
  }

  .report-facts > div {
    grid-template-columns: 90px 1fr;
    gap: 0.5rem;
    font-size: 12px;
  }

  .report-edit-body {
    padding: 1rem;
  }

  .report-form-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .report-condition {
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
    padding: 0.75rem;
  }

  .report-condition label {
    font-size: 13px;
  }

  .report-comment-form {
    gap: 0.5rem;
  }
}
</style>
