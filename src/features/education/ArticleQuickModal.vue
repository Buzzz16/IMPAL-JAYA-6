<script setup>
/**
 * ============================================================================
 * MODUL BACA CEPAT ARTIKEL BERANDA (ARTICLE QUICK MODAL)
 * File: src/features/education/ArticleQuickModal.vue
 * Desain Editorial PoluSee: Elegan, Proporsional & Responsif
 * ============================================================================
 */
import { computed } from 'vue';
import AppIcon from '../../components/common/AppIcon.vue';
import { HOME_ARTICLES } from '../aqi/aqiData';

const props = defineProps({
  articleIndex: {
    type: Number,
    default: null,
  },
  lessons: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'next', 'prev', 'open-education']);

function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');
}

const totalArticles = computed(() => {
  if (props.lessons && props.lessons.length > 0) {
    return props.lessons.length;
  }
  return HOME_ARTICLES.length;
});

const activeArticle = computed(() => {
  if (props.articleIndex === null) return null;

  if (props.lessons && props.lessons[props.articleIndex]) {
    const l = props.lessons[props.articleIndex];
    const category = cleanText(l.topic || l.kategori_topik || 'Kenali Udara').toUpperCase();
    const title = cleanText(l.title || l.judul_konten || 'Materi Edukasi Udara');

    const rawMateri = cleanText(l.isi_materi || l.summary || '');
    let paragraphs = [];
    if (Array.isArray(l.sections) && l.sections.length > 0) {
      paragraphs = l.sections.map(s => cleanText(s)).filter(Boolean);
    } else if (rawMateri) {
      paragraphs = rawMateri.split(/\n+/).map(p => p.trim()).filter(Boolean);
    }

    // Lead paragraph / intisari: ambil dari summary atau paragraf pertama jika berbeda dengan judul
    let description = cleanText(l.summary);
    if (!description && paragraphs.length > 0) {
      description = paragraphs[0];
    } else if (description.includes('\n')) {
      description = description.split('\n')[0].trim();
    }

    // Jika paragraf pertama persis sama dengan lead description, hindari pengulangan ganda
    let displayParagraphs = paragraphs;
    if (paragraphs.length > 1 && paragraphs[0] === description) {
      displayParagraphs = paragraphs.slice(1);
    }

    const type = props.articleIndex === 0 ? 'aqi' : props.articleIndex === 1 ? 'mask' : 'photo';
    const cover = l.cover || l.media_url || 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=1200&q=80';
    const time = `${l.minutes || 4} mnt baca`;

    return {
      category,
      title,
      description,
      paragraphs: displayParagraphs,
      type,
      cover,
      time,
    };
  }

  const fallback = HOME_ARTICLES[props.articleIndex] || HOME_ARTICLES[0];
  const fallbackBody = cleanText(fallback.body);
  const fallbackParas = fallbackBody ? fallbackBody.split(/\n+/).map(p => p.trim()).filter(Boolean) : [];

  return {
    category: cleanText(fallback.category || 'KENALI UDARAMU').toUpperCase(),
    title: cleanText(fallback.title),
    description: cleanText(fallback.description),
    paragraphs: fallbackParas,
    type: fallback.type || 'aqi',
    cover: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=1200&q=80',
    time: fallback.time || '4 mnt baca',
  };
});

function handlePrev() {
  const nextIdx = (props.articleIndex - 1 + totalArticles.value) % totalArticles.value;
  emit('next', nextIdx);
}

function handleNext() {
  const nextIdx = (props.articleIndex + 1) % totalArticles.value;
  emit('next', nextIdx);
}
</script>

<template>
  <div
    v-if="articleIndex !== null && activeArticle"
    class="modal-backdrop !bg-[#263b3e]/60 !backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity"
    @click="emit('close')"
  >
    <section
      class="modal !max-w-[700px] !w-full !max-h-[90vh] !overflow-y-auto !p-0 !bg-[#f8f8f1] !border !border-[#263b3e] !shadow-[8px_8px_0_#edce7e] !rounded-none relative flex flex-col"
      role="dialog"
      aria-modal="true"
      :aria-label="activeArticle.title"
      @click.stop
    >
      <!-- Header Visual Banner -->
      <div class="relative w-full h-44 sm:h-52 bg-[#e8eee4] border-b border-[#263b3e] overflow-hidden flex items-center justify-center">
        <!-- Visual AQI -->
        <div v-if="activeArticle.type === 'aqi'" class="w-full h-full flex flex-col items-center justify-center bg-[#f1e7c9] p-6 select-none">
          <span class="text-[11px] font-extrabold tracking-[0.2em] text-[#7d795d] uppercase mb-1">Air Quality Index</span>
          <span class="font-serif text-5xl sm:text-6xl font-black tracking-tight text-[#285765]">AQI<span class="text-[#bda657]">?</span></span>
          <div class="flex gap-1.5 mt-3">
            <span class="w-6 h-1.5 bg-[#4caf50]"></span>
            <span class="w-6 h-1.5 bg-[#ffeb3b]"></span>
            <span class="w-6 h-1.5 bg-[#ff9800]"></span>
            <span class="w-6 h-1.5 bg-[#f44336]"></span>
            <span class="w-6 h-1.5 bg-[#9c27b0]"></span>
          </div>
        </div>

        <!-- Visual Masker -->
        <div v-else-if="activeArticle.type === 'mask'" class="w-full h-full flex flex-col items-center justify-center bg-[#dce5e7] p-6 text-[#285765] select-none">
          <AppIcon name="mask" :size="75" />
          <span class="text-[11px] font-extrabold tracking-[0.25em] text-[#285765] mt-2 uppercase">Breathe Safer · Lindungi Diri</span>
        </div>

        <!-- Visual Photo Nature / Hutan -->
        <div v-else class="w-full h-full relative">
          <img
            :src="activeArticle.cover"
            :alt="activeArticle.title"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-[#263b3e]/80 via-transparent to-transparent flex items-end p-4">
            <span class="text-xs font-semibold text-[#f8f8f1] tracking-wider uppercase bg-[#285765]/80 px-2.5 py-1 rounded">
              PoluSee Edukasi Ruang Hijau
            </span>
          </div>
        </div>

        <!-- Tombol Tutup Silang di Sudut Kanan Atas Banner -->
        <button
          type="button"
          class="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#f8f8f1] text-[#263b3e] border border-[#263b3e] hover:bg-[#edce7e] transition flex items-center justify-center cursor-pointer shadow-xs z-10"
          aria-label="Tutup artikel"
          title="Tutup (Esc)"
          @click="emit('close')"
        >
          <AppIcon name="close" :size="16" />
        </button>
      </div>

      <!-- Konten Artikel -->
      <div class="p-6 sm:p-8 flex-1">
        <!-- Top Meta: Badge Kategori & Waktu Baca -->
        <div class="flex items-center justify-between gap-3 mb-3">
          <span class="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#edce7e] text-[#285765] border border-[#d8b869]">
            {{ activeArticle.category }}
          </span>
          <span class="text-xs font-medium text-[#7d8580] flex items-center gap-1.5">
            <AppIcon name="clock" :size="13" />
            {{ activeArticle.time }}
          </span>
        </div>

        <!-- Judul Artikel -->
        <h2 class="text-2xl sm:text-3xl font-extrabold text-[#263b3e] leading-tight tracking-tight mb-4">
          {{ activeArticle.title }}
        </h2>

        <!-- Ringkasan Intisari (Lead Paragraph) -->
        <div
          v-if="activeArticle.description && activeArticle.description !== activeArticle.title"
          class="p-3.5 bg-[#edf1ea] border-l-4 border-[#285765] text-sm sm:text-base font-semibold text-[#285765] leading-relaxed mb-5"
        >
          {{ activeArticle.description }}
        </div>

        <!-- Isi Pembahasan Artikel (Paragraf Rapi) -->
        <div class="prose text-[#33443d] text-sm sm:text-[15px] leading-relaxed space-y-4 font-normal">
          <p
            v-for="(para, pIdx) in activeArticle.paragraphs"
            :key="pIdx"
            class="leading-relaxed"
          >
            {{ para }}
          </p>
        </div>

        <!-- Kotak Catatan / Insight Hijau -->
        <div class="mt-6 p-4 rounded-lg bg-[#eef6ed] border border-[#b8dcbb] flex items-center gap-3 text-xs sm:text-sm text-[#245e36] font-medium">
          <span class="text-base">🍃</span>
          <span>Langkah kecilmu hari ini berarti untuk udara esok yang lebih bersih dan sehat.</span>
        </div>
      </div>

      <!-- Footer Bar: Navigasi Antar Artikel & CTA Selengkapnya -->
      <div class="p-4 sm:px-8 sm:py-4 bg-[#f0f2eb] border-t border-[#ced2c8] flex flex-wrap items-center justify-between gap-3">
        <!-- Navigasi Geser Artikel -->
        <div class="flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            class="flex items-center gap-1 px-3 py-1.5 rounded border border-[#aeb9ae] bg-white text-[#285765] hover:bg-[#285765] hover:text-white transition cursor-pointer"
            @click="handlePrev"
          >
            ← Sebelumnya
          </button>
          <span class="text-[#7d8580] px-1 text-[11px]">
            {{ (articleIndex + 1) }} / {{ totalArticles }}
          </span>
          <button
            type="button"
            class="flex items-center gap-1 px-3 py-1.5 rounded border border-[#aeb9ae] bg-white text-[#285765] hover:bg-[#285765] hover:text-white transition cursor-pointer"
            @click="handleNext"
          >
            Berikutnya →
          </button>
        </div>

        <!-- Tombol Aksi: Buka Halaman Edukasi Lengkap -->
        <button
          type="button"
          class="flex items-center gap-1.5 px-4 py-2 rounded bg-[#285765] text-[#f8f8f1] text-xs font-bold hover:bg-[#1f434e] transition cursor-pointer shadow-xs"
          @click="emit('open-education')"
        >
          <span>Jelajahi di Ruang Edukasi</span>
          <AppIcon name="arrow" :size="14" />
        </button>
      </div>
    </section>
  </div>
</template>
