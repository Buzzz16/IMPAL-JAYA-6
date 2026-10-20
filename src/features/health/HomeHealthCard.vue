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
    required: true,
  },
  healthData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['open-health', 'open-profile']);

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
  return [
    {
      icon: 'home',
      title: props.aqi > 100 ? 'Utamakan aktivitas di dalam ruangan' : 'Nikmati aktivitas dengan bijak',
      text: 'Kurangi aktivitas berat di luar ruangan jika udara memburuk.',
    },
    {
      icon: 'mask',
      title: 'Gunakan masker saat keluar',
      text: 'Pilih masker N95 atau KN95 untuk menyaring partikel halus PM2.5.',
    },
    {
      icon: 'user',
      title: 'Lebih waspada untuk kelompok sensitif',
      text: 'Anak-anak, lansia, dan penderita asma perlu membatasi paparan polusi.',
    },
  ];
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
    <div class="recommendation-intro">
      <span class="mini-dot" />Disesuaikan otomatis dengan AQI {{ aqi }} di {{ city }} ({{ healthData?.kategori_rentan || 'Profil Umum' }})
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
