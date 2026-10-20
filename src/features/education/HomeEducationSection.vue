<script setup>
/**
 * ============================================================================
 * SEKSI RINGKASAN EDUKASI BERANDA & MODAL ARTIKEL CEPAT
 * File: src/features/education/HomeEducationSection.vue
 * Terhubung dinamis dengan Backend
 * ============================================================================
 */
import { computed } from 'vue';
import AppIcon from '../../components/common/AppIcon.vue';
import { HOME_ARTICLES } from '../aqi/aqiData';

const props = defineProps({
  lessons: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['open-education', 'select-article']);

const displayArticles = computed(() => {
  if (props.lessons && props.lessons.length > 0) {
    return props.lessons.slice(0, 3).map((l, idx) => ({
      type: idx === 0 ? 'aqi' : idx === 1 ? 'mask' : 'photo',
      category: l.topic || 'Kenali Udara',
      title: l.title,
      time: `${l.minutes || 3} mnt baca`,
      cover: l.cover,
      summary: l.summary,
    }));
  }
  return HOME_ARTICLES;
});
</script>

<template>
  <section class="education">
    <div class="education-heading">
      <div>
        <span class="eyebrow">JADI LEBIH TAHU · MATERI DINAMIS</span>
        <h2>Udara bersih dimulai dari pemahaman.</h2>
      </div>
      <button class="text-link" @click="$emit('open-education')">
        Jelajahi seluruh edukasi <AppIcon name="arrow" :size="17" />
      </button>
    </div>
    <div class="article-grid">
      <button
        v-for="(a, i) in displayArticles"
        :key="a.title"
        class="article-card"
        @click="$emit('select-article', i)"
      >
        <div :class="`article-art ${a.type}`">
          <template v-if="a.type === 'aqi'">
            <span class="art-mini">AIR QUALITY INDEX</span>
            <span class="art-aqi">AQI<span>?</span></span>
            <div class="art-scale"><i /><i /><i /><i /><i /></div>
          </template>
          <template v-else-if="a.type === 'mask'">
            <AppIcon name="mask" :size="95" />
            <span class="art-caption">BREATHE SAFER.</span>
            <div class="art-orbit" />
          </template>
          <template v-else>
            <img
              :src="a.cover || 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=800&q=80'"
              :alt="a.title"
            />
            <span class="photo-credit">PoluSee Edukasi</span>
          </template>
          <span class="article-arrow">
            <AppIcon name="arrow" :size="20" />
          </span>
        </div>
        <div class="article-body">
          <span class="eyebrow">{{ a.category }}</span>
          <h3>{{ a.title }}</h3>
          <span class="read-time"><AppIcon name="clock" :size="13" />{{ a.time }}</span>
        </div>
      </button>
    </div>
  </section>
</template>
