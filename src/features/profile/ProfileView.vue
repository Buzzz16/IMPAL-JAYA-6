<script setup>
/**
 * ============================================================================
 * HALAMAN KELOLA PROFIL & PREFERENSI PENGGUNA (FR-11 / UC-11 KELOLA PROFIL)
 * File: src/features/profile/ProfileView.vue
 * Menjamin semua foto profil & foto laporan ter-render dengan sempurna
 * ============================================================================
 */
import { ref } from 'vue';
import AppIcon from '../../components/common/AppIcon.vue';
import { initialReports } from '../community/communityData';
import { userProfileStore, updateProfileData } from '../auth/authStore';

defineProps({
  reports: {
    type: Array,
    required: true,
  },
  personalized: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select-report', 'save-preferences']);

const defaultAvatar =
  'https://images.unsplash.com/photo-1630678334641-0c5339dfd1a7?auto=format&fit=crop&w=500&q=85';
const defaultReportPhoto =
  'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85';

const editMode = ref(false);
const nameVal = ref(userProfileStore.nama_lengkap);
const ageVal = ref(userProfileStore.umur);
const groupVal = ref(userProfileStore.kategori_rentan);
const alertVal = ref(userProfileStore.peringatan_aqi_100);
const avatarUrl = ref(userProfileStore.foto_profil || defaultAvatar);

function isNewReport(id) {
  return !initialReports.some((r) => r.id === id);
}

function handleAvatarChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) return;
  const reader = new FileReader();
  reader.onload = () => {
    avatarUrl.value = String(reader.result);
  };
  reader.readAsDataURL(file);
}

async function handleSavePreferences() {
  await updateProfileData({
    nama_lengkap: nameVal.value.trim() || 'Aditya Nugraha',
    umur: Number(ageVal.value) || 28,
    kategori_rentan: groupVal.value,
    peringatan_aqi_100: alertVal.value,
    foto_profil: avatarUrl.value || defaultAvatar,
  });
  emit('save-preferences');
  editMode.value = false;
}
</script>

<template>
  <div>
    <input
      id="edit-profile-mode"
      v-model="editMode"
      class="peer sr-only"
      type="checkbox"
    />
    <section class="border border-[#aeb9ae] bg-[#f0f2e8] peer-checked:hidden">
      <!-- Header Profil & Foto Pengguna -->
      <div class="grid items-center gap-7 border-b border-[#ced2c8] p-6 sm:grid-cols-[132px_1fr] sm:p-9">
        <img
          class="mx-auto aspect-square w-28 rounded-full border-4 border-[#f8f8f1] object-cover shadow-[0_0_0_1px_#9ba99d] sm:w-32"
          :src="userProfileStore.foto_profil || defaultAvatar"
          :alt="`Foto profil ${userProfileStore.nama_lengkap}`"
          @error="$event.target.src = defaultAvatar"
        />
        <div class="text-center sm:text-left">
          <div class="flex flex-col items-center gap-4 sm:flex-row">
            <div>
              <h2 class="!m-0 !text-[24px]">{{ userProfileStore.nama_lengkap }}</h2>
              <span class="mt-1 block text-[length:var(--text-label)] text-[#7d8580]">
                {{ userProfileStore.username }} · {{ userProfileStore.lokasi_default }}
              </span>
            </div>
            <div class="sm:ml-auto">
              <strong class="block text-[24px] leading-none">{{ reports.length }}</strong>
              <span class="mt-1 block text-[length:var(--text-caption)] font-semibold tracking-wider text-[#7d8580]">
                LAPORAN
              </span>
            </div>
          </div>
          <label
            class="mt-5 inline-flex cursor-pointer items-center gap-2 border border-[#285765] px-4 py-2 text-[length:var(--text-caption)] font-bold text-[#285765] hover:bg-[#285765] hover:text-[#f8f8f1]"
            for="edit-profile-mode"
          >
            <AppIcon name="user" :size="15" /> EDIT PROFIL
          </label>
        </div>
      </div>

      <!-- Bagian Laporan Saya (Grid 3 Kolom) -->
      <div class="p-4 sm:p-7">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <span class="eyebrow">LAPORAN SAYA</span>
            <h2 class="!my-2 !text-[19px]">Jejak kepedulianmu.</h2>
          </div>
          <span class="text-[length:var(--text-caption)] text-[#7d8580]">
            {{ reports.length }} unggahan
          </span>
        </div>

        <div class="grid grid-cols-3 gap-1.5 sm:gap-3">
          <button
            v-for="entry in reports"
            :key="entry.id"
            type="button"
            class="group relative aspect-square overflow-hidden bg-[#dce2d8] text-left cursor-pointer border border-[#aeb9ae]/50"
            :aria-label="`Buka laporan: ${entry.caption}`"
            @click="emit('select-report', entry.id)"
          >
            <!-- Foto Laporan -->
            <img
              class="h-full w-full object-cover saturate-85 transition duration-300 group-hover:scale-105 group-hover:brightness-50"
              :src="entry.image || entry.photo || entry.url_foto_bukti || defaultReportPhoto"
              :alt="entry.caption || 'Foto laporan'"
              loading="lazy"
              @error="$event.target.src = defaultReportPhoto"
            />
            <span class="absolute inset-x-0 bottom-0 translate-y-full bg-[#173f4dcc] p-3 text-[length:var(--text-caption)] leading-4 text-[#f8f8f1] transition group-hover:translate-y-0">
              {{ entry.caption }}
            </span>
            <span
              v-if="isNewReport(entry.id)"
              class="absolute left-2 top-2 bg-[#edce7e] px-2 py-1 text-[length:var(--text-caption)] font-bold tracking-wider text-[#285765]"
            >
              LAPORAN
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Halaman Edit Profil (Secondary Panel) -->
    <section class="secondary-panel hidden peer-checked:block">
      <label
        class="mb-6 inline-flex cursor-pointer items-center gap-2 text-[length:var(--text-caption)] font-bold text-[#285765] hover:underline"
        for="edit-profile-mode"
      >
        ← KEMBALI KE PROFIL
      </label>
      <span class="eyebrow">UBAH PROFIL &amp; PREFERENSI</span>
      <h2>Halo, {{ nameVal || 'Pengguna' }}.</h2>
      <p>Perbarui identitas dan kebutuhan kesehatanmu.</p>
      <label class="mt-7 flex max-w-md cursor-pointer items-center gap-4 border border-[#aeb9ae] bg-[#fafbf4] p-4 hover:bg-[#f4f6ee]">
        <img
          class="h-16 w-16 shrink-0 rounded-full object-cover border border-[#aeb9ae]"
          :src="avatarUrl || defaultAvatar"
          alt="Foto profil baru"
          @error="$event.target.src = defaultAvatar"
        />
        <span>
          <strong class="block text-[length:var(--text-label)]">Ubah foto profil</strong>
          <small class="mt-1 block text-[length:var(--text-caption)] text-[#7d8580]">
            JPG atau PNG · maksimal 5 MB
          </small>
        </span>
        <span class="ml-auto border border-[#aeb9ae] px-3 py-2 text-[length:var(--text-caption)] font-semibold">
          PILIH FOTO
        </span>
        <input class="sr-only" type="file" accept="image/jpeg,image/png" @change="handleAvatarChange" />
      </label>
      <div class="grid max-w-md gap-5 sm:grid-cols-[1fr_120px]">
        <label class="form-label !my-5">
          Nama
          <input v-model="nameVal" />
        </label>
        <label class="form-label !my-5">
          Umur
          <input v-model="ageVal" type="number" min="1" max="120" aria-label="Umur dalam tahun" />
        </label>
      </div>
      <label class="form-label !mt-0">
        Kelompok kesehatan
        <select v-model="groupVal">
          <option>Umum</option>
          <option>Penderita asma</option>
          <option>Lansia</option>
          <option>Orang tua dengan anak</option>
        </select>
      </label>
      <label class="checkbox-label">
        <input v-model="alertVal" type="checkbox" /> Aktifkan peringatan ketika AQI melebihi 100
      </label>
      <button class="primary-button" type="button" @click="handleSavePreferences">
        <template v-if="personalized">
          <AppIcon name="check" :size="17" /> Preferensi tersimpan
        </template>
        <template v-else>Simpan preferensi</template>
      </button>
      <p v-if="personalized" class="mt-2 text-sm text-[#23704b]">Preferensi tersimpan untuk sesi ini.</p>
    </section>
  </div>
</template>
