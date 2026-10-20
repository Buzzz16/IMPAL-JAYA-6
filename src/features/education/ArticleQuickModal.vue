<script setup>
/**
 * ============================================================================
 * MODAL BACA CEPAT ARTIKEL BERANDA
 * File: src/features/education/ArticleQuickModal.vue
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

const emit = defineEmits(['close', 'next']);

const activeArticle = computed(() => {
  if (props.articleIndex === null) return null;
  if (props.lessons && props.lessons[props.articleIndex]) {
    const l = props.lessons[props.articleIndex];
    return {
      category: l.topic,
      title: l.title,
      description: l.summary,
      body: Array.isArray(l.sections) ? l.sections.join('\n\n') : l.summary,
    };
  }
  return HOME_ARTICLES[props.articleIndex] || null;
});

const totalArticles = computed(() => (props.lessons?.length || HOME_ARTICLES.length));
</script>

<template>
  <div
    v-if="articleIndex !== null && activeArticle"
    class="modal-backdrop"
    @click="emit('close')"
  >
    <section
      class="modal"
      role="dialog"
      aria-modal="true"
      :aria-label="activeArticle.title"
      @click.stop
    >
      <button
        class="modal-close icon-button"
        aria-label="Tutup artikel"
        @click="emit('close')"
      >
        <AppIcon name="close" />
      </button>
      <span class="eyebrow">{{ activeArticle.category }}</span>
      <h2>{{ activeArticle.title }}</h2>
      <p>{{ activeArticle.description }}</p>
      <p style="white-space: pre-line;">{{ activeArticle.body }}</p>
      <div class="article-note">
        <AppIcon name="leaf" />Langkah kecilmu hari ini berarti untuk udara esok.
      </div>
      <button
        class="text-link"
        @click="emit('next', (articleIndex + 1) % totalArticles)"
      >
        Artikel berikutnya <AppIcon name="arrow" :size="18" />
      </button>
    </section>
  </div>
</template>
