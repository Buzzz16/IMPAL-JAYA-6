<script setup>
/**
 * ============================================================================
 * KARTU RINGKASAN REKOMENDASI KESEHATAN BERANDA (FR-05 / UC-05 SKPL)
 * File: src/features/health/HomeHealthCard.vue
 * Terhubung dinamis dengan Backend Rule-Based Engine & Data IQAir
 * ============================================================================
 */
import { computed } from 'vue';
import AppIcon from '../../components/common/AppIcon.vue';

const props = defineProps({
  city: {
    type: String,
    required: true,
  },
  aqi: {
    type: Number,
    default: null,
  },
  healthData: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['open-health', 'open-profile']);

const isLoading = computed(() => {
  return props.loading || !props.healthData?.rekomendasi || props.aqi == null;
});

const rekom = computed(() => props.healthData?.rekomendasi || null);

const recommendations = computed(() => {
  if (rekom.value) {
    return [
      {
        icon: 'home',
        title: props.aqi > 100 ? 'Aktivitas Luar Ruangan' : 'Aktivitas Fisik & Luar',
        text: rekom.value.saran_aktivitas_luar,
      },
      {
        icon: 'mask',
        title: 'Perlindungan Diri & Masker',
        text: rekom.value.saran_perlindungan_diri,
      },
      {
        icon: 'user',
        title: 'Panduan Kelompok Rentan',
        text: rekom.value.saran_kelompok_rentan,
      },
    ];
  }
  return [];
});
</script>

<template>
  <section class="recommendations health-panel">
    <button
      type="button"
      class="health-panel-action"
      aria-label="Buka halaman Rekomendasi Kesehatan dan panduan perlindungan"
      @click="emit('open-health')"
    />
    <div class="section-heading">
      <div>
        <span class="eyebrow">PANDUAN KESEHATAN · REKOMENDASI DINAMIS</span>
        <h2>Jaga napasmu hari ini.</h2>
      </div>
      <AppIcon name="shield" />
    </div>

    <!-- State Loading: Skeleton shimmer (tidak menampilkan data dummy Foto 1 saat reload F5) -->
    <template v-if="isLoading">
      <div class="recommendation-intro" aria-busy="true">
        <div class="h-3 w-52 rounded bg-[#285765]/20 animate-pulse" />
      </div>
      <div v-for="i in 3" :key="i" class="recommendation animate-pulse">
        <div class="recommendation-icon bg-[#285765]/10 flex items-center justify-center">
          <div class="h-4 w-4 rounded bg-[#285765]/25" />
        </div>
        <div class="flex-1 space-y-2">
          <div class="h-4 w-1/3 rounded bg-[#285765]/25" />
          <div class="h-3 w-4/5 rounded bg-[#285765]/15" />
        </div>
      </div>
    </template>

    <!-- State Siap: Menampilkan rekomendasi dinamis sesuai AQI kota (Foto 2) -->
    <template v-else>
      <div class="recommendation-intro">
        <span class="mini-dot" />Disesuaikan otomatis dengan AQI {{ aqi }} di {{ city }} ({{ healthData?.kategori_rentan || 'Umum' }})
      </div>
      <div v-for="r in recommendations" :key="r.title" class="recommendation">
        <div class="recommendation-icon">
          <AppIcon :name="r.icon" />
        </div>
        <div>
          <h3>{{ r.title }}</h3>
          <p>{{ r.text }}</p>
        </div>
      </div>
    </template>
    <div class="personalization-wrap">
      <button class="text-link personalization" type="button" @click.stop="emit('open-profile')">
        <span>Personalisasi profil &amp; kelompok rentan</span>
        <AppIcon name="arrow" :size="15" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.health-panel {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.health-panel-action {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: transparent;
  border: none;
  cursor: pointer;
}

.health-panel-action:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: -2px;
}

.personalization-wrap {
  position: relative;
  z-index: 2;
  margin: 14px 23px 18px;
}

.personalization {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-bottom: 1px solid #8d9d8e;
  padding: 4px 0;
}

.personalization:hover {
  color: #ae8a34;
}

/* Responsif Mobile (< 640px) */
@media (max-width: 640px) {
  .section-heading {
    padding: 16px 16px 12px;
  }

  .section-heading h2 {
    font-size: 17px;
  }

  .recommendation-intro {
    margin: 0 16px;
    padding-bottom: 12px;
    font-size: 11px;
    line-height: 1.4;
  }

  .recommendation {
    margin: 0 16px;
    padding: 12px 0;
    gap: 12px;
  }

  .recommendation-icon {
    width: 34px;
    height: 34px;
  }

  .recommendation h3 {
    font-size: 13.5px;
    line-height: 1.35;
  }

  .recommendation p {
    font-size: 12px;
    margin-top: 3px;
    line-height: 1.45;
  }

  .personalization-wrap {
    margin: 12px 16px 16px;
  }

  .personalization {
    font-size: 11.5px;
  }
}
</style>
