<script setup>
/**
 * ============================================================================
 * HALAMAN KELOLA PROFIL & PREFERENSI PENGGUNA (FR-11 / UC-11 KELOLA PROFIL)
 * File: src/features/profile/ProfileView.vue
 * Menjamin semua foto profil & foto laporan ter-render dengan sempurna
 * ============================================================================
 */
import { ref, computed, watch } from 'vue';
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

const defaultReportPhoto =
  'https://images.unsplash.com/photo-1555066657-4ea53882eaba?auto=format&fit=crop&w=1200&q=85';

function getInitials(name = '') {
  if (!name || !name.trim()) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

const editMode = ref(false);
const nameVal = ref(userProfileStore.nama_lengkap || '');
const usernameVal = ref(userProfileStore.username ? userProfileStore.username.replace(/^@/, '') : '');
const cityVal = ref(userProfileStore.lokasi_default || 'Samarinda');
const ageVal = ref(userProfileStore.umur || 25);
const groupVal = ref(userProfileStore.kategori_rentan || 'Umum');
const alertVal = ref(userProfileStore.peringatan_aqi_100 || false);
const avatarUrl = ref(userProfileStore.foto_profil || '');

watch(() => userProfileStore.nama_lengkap, (v) => { nameVal.value = v || ''; });
watch(() => userProfileStore.lokasi_default, (v) => { cityVal.value = v || 'Samarinda'; });
watch(() => userProfileStore.username, (v) => { usernameVal.value = (v || '').replace(/^@/, ''); });
watch(() => userProfileStore.umur, (v) => { if (v) ageVal.value = v; });
watch(() => userProfileStore.kategori_rentan, (v) => { if (v) groupVal.value = v; });
watch(() => userProfileStore.foto_profil, (v) => { avatarUrl.value = v || ''; });

function isNewReport(id) {
  return !initialReports.some((r) => r.id === id);
}

const myReports = computed(() => {
  if (!userProfileStore.email && !userProfileStore.nama_lengkap) return [];
  const currentName = (userProfileStore.nama_lengkap || '').trim().toLowerCase();
  const currentEmail = (userProfileStore.email || '').trim().toLowerCase();
  const currentUsername = (userProfileStore.username || '').trim().toLowerCase();

  return props.reports.filter((entry) => {
    const author = (entry.author || '').trim().toLowerCase();
    const user = (entry.user || '').trim().toLowerCase();
    const email = (entry.email || '').trim().toLowerCase();
    const userId = entry.id_user || entry.userId;

    if (userProfileStore.id_akun && userId && userId === userProfileStore.id_akun) return true;
    if (currentEmail && email && email === currentEmail) return true;
    if (currentUsername && user && (user === currentUsername || user === `@${currentUsername}`)) return true;
    if (currentName && author && author === currentName) return true;

    return false;
  });
});

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
  const cleanUsername = usernameVal.value.trim()
    ? `@${usernameVal.value.trim().replace(/^@/, '').toLowerCase()}`
    : (userProfileStore.username || (userProfileStore.email ? `@${userProfileStore.email.split('@')[0]}` : '@pengguna'));

  await updateProfileData({
    nama_lengkap: nameVal.value.trim() || userProfileStore.nama_lengkap || 'Pengguna',
    username: cleanUsername,
    lokasi_default: cityVal.value.trim() || 'Samarinda',
    umur: Number(ageVal.value) || 25,
    kategori_rentan: groupVal.value,
    peringatan_aqi_100: alertVal.value,
    foto_profil: avatarUrl.value || '',
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
        <div class="mx-auto flex aspect-square w-28 sm:w-32 items-center justify-center rounded-full border-4 border-[#f8f8f1] bg-[#285765] text-white shadow-[0_0_0_1px_#9ba99d] overflow-hidden">
          <img
            v-if="userProfileStore.foto_profil"
            class="h-full w-full object-cover"
            :src="userProfileStore.foto_profil"
            :alt="`Foto profil ${userProfileStore.nama_lengkap}`"
          />
          <span v-else class="text-3xl font-extrabold tracking-wider text-[#edce7e]">
            {{ getInitials(userProfileStore.nama_lengkap || 'Pengguna') }}
          </span>
        </div>
        <div class="text-center sm:text-left">
          <div class="flex flex-col items-center gap-4 sm:flex-row">
            <div>
              <h2 class="!m-0 !text-[24px]">{{ userProfileStore.nama_lengkap || 'Pengguna PoluSee' }}</h2>
              <span class="mt-1 block text-[length:var(--text-label)] text-[#7d8580]">
                {{ userProfileStore.username || (userProfileStore.email ? `@${userProfileStore.email.split('@')[0]}` : '@pengguna') }} · {{ userProfileStore.lokasi_default || 'Samarinda' }}
              </span>
            </div>
            <div class="sm:ml-auto">
              <strong class="block text-[24px] leading-none">{{ myReports.length }}</strong>
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
            {{ myReports.length }} unggahan
          </span>
        </div>

        <div v-if="myReports.length === 0" class="rounded-xl border border-dashed border-[#aeb9ae] bg-[#fafbf4] p-8 text-center">
          <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#285765]/10 text-[#285765]">
            <AppIcon name="wind" :size="20" />
          </div>
          <p class="font-semibold text-[#285765]">Belum ada laporan</p>
          <p class="mt-1 text-xs text-[#7d8580]">Kamu belum mengunggah laporan kualitas udara.</p>
        </div>

        <div v-else class="grid grid-cols-3 gap-1.5 sm:gap-3">
          <button
            v-for="entry in myReports"
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
      <!-- Ubah Foto Profil -->
      <div class="mt-7 flex max-w-md items-center gap-4 border border-[#aeb9ae] bg-[#fafbf4] p-4">
        <div class="h-16 w-16 shrink-0 rounded-full border border-[#aeb9ae] overflow-hidden flex items-center justify-center bg-[#285765] text-white">
          <img
            v-if="avatarUrl"
            class="h-full w-full object-cover"
            :src="avatarUrl"
            alt="Foto profil baru"
          />
          <span v-else class="text-xl font-extrabold text-[#edce7e]">
            {{ getInitials(nameVal || userProfileStore.nama_lengkap || 'Pengguna') }}
          </span>
        </div>
        <div class="flex-1">
          <strong class="block text-[length:var(--text-label)]">Foto profil</strong>
          <small class="mt-0.5 block text-[length:var(--text-caption)] text-[#7d8580]">
            Gunakan inisial atau unggah foto JPG/PNG (maks. 5 MB)
          </small>
          <div class="mt-2 flex items-center gap-2">
            <label class="cursor-pointer border border-[#285765] bg-white px-2.5 py-1 text-[11px] font-bold text-[#285765] hover:bg-[#285765] hover:text-white transition">
              PILIH FOTO
              <input class="sr-only" type="file" accept="image/jpeg,image/png" @change="handleAvatarChange" />
            </label>
            <button
              v-if="avatarUrl"
              type="button"
              class="text-[11px] text-[#b53434] underline hover:text-red-700 cursor-pointer"
              @click="avatarUrl = ''"
            >
              Hapus foto
            </button>
          </div>
        </div>
      </div>

      <div class="grid max-w-md gap-5 sm:grid-cols-2 !my-5">
        <label class="form-label !my-0">
          Nama Lengkap
          <input v-model="nameVal" placeholder="Nama lengkap" />
        </label>
        <label class="form-label !my-0">
          Username (@handle)
          <input v-model="usernameVal" placeholder="Contoh: babas" />
        </label>
      </div>

      <div class="grid max-w-md gap-5 sm:grid-cols-[1fr_120px] !mb-5">
        <label class="form-label !my-0">
          Kota Domisili (Asal)
          <select v-model="cityVal">
            <option value="Samarinda">Samarinda</option>
            <option value="Balikpapan">Balikpapan</option>
            <option value="Jakarta">Jakarta</option>
            <option value="Bandung">Bandung</option>
            <option value="Surabaya">Surabaya</option>
            <option value="Yogyakarta">Yogyakarta</option>
            <option value="Medan">Medan</option>
            <option value="Makassar">Makassar</option>
          </select>
        </label>
        <label class="form-label !my-0">
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
