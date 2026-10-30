<script setup>
/**
 * ============================================================================
 * MODUL AUTENTIKASI: LOGIN, REGISTRASI & LUPA KATA SANDI (/forgot-password)
 * File: src/features/auth/AuthPage.vue
 * ============================================================================
 */
import { ref, computed } from 'vue';
import { loginAccount, registerAccount, forgotPasswordAccount } from './authStore';

const props = defineProps({
  mode: {
    type: String,
    required: true, // 'login' | 'register' | 'forgot'
  },
});

const emit = defineEmits(['navigate', 'login', 'admin']);

const isRegister = computed(() => props.mode === 'register');
const isForgot = computed(() => props.mode === 'forgot');
const isLogin = computed(() => !isRegister.value && !isForgot.value);

const error = ref('');
const notice = ref('');
const visible = ref(false);
const loading = ref(false);

const nameInput = ref('');
const emailInput = ref('');
const passwordInput = ref('');
const confirmPasswordInput = ref('');

function fillUserCredentials() {
  emailInput.value = 'user@polusee.id';
  passwordInput.value = 'user123';
  error.value = '';
}

function fillAdminCredentials() {
  emailInput.value = 'admin@polusee.id';
  passwordInput.value = 'admin123';
  error.value = '';
}

function navigate(next) {
  error.value = '';
  notice.value = '';
  visible.value = false;
  nameInput.value = '';
  passwordInput.value = '';
  confirmPasswordInput.value = '';
  emit('navigate', next);
}

async function handleSubmit() {
  error.value = '';

  // Validasi konfirmasi password pada Register & Lupa Sandi
  if ((isRegister.value || isForgot.value) && passwordInput.value !== confirmPasswordInput.value) {
    error.value = 'Konfirmasi kata sandi belum cocok.';
    return;
  }

  loading.value = true;
  try {
    if (isForgot.value) {
      const res = await forgotPasswordAccount({
        email: emailInput.value,
        newPassword: passwordInput.value,
        confirmPassword: confirmPasswordInput.value,
      });
      const successMsg = res.message || 'Kata sandi berhasil diperbarui! Silakan masuk.';
      emit('navigate', 'login');
      visible.value = false;
      passwordInput.value = '';
      confirmPasswordInput.value = '';
      notice.value = successMsg;
    } else if (isRegister.value) {
      await registerAccount({
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value,
      });
      emit('navigate', 'login');
      visible.value = false;
      passwordInput.value = '';
      confirmPasswordInput.value = '';
      notice.value =
        'Akun baru berhasil didaftarkan! Silakan masuk dengan email dan kata sandi Anda.';
    } else {
      const result = await loginAccount(emailInput.value, passwordInput.value);
      if (result.role === 'ADMIN') {
        emit('admin');
      } else {
        emit('login');
      }
    }
  } catch (err) {
    error.value = err.message || 'Email atau kata sandi tidak valid.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-shell">
    <header class="auth-header">
      <div class="wordmark">
        Polu<span>See</span><span class="brand-dot" />
      </div>
      <span class="eyebrow">LEBIH SADAR UDARA. LEBIH PEDULI SESAMA.</span>
    </header>
    <main class="auth-main">
      <section class="auth-story">
        <span class="eyebrow">RUANG PANTAU UDARA / POLUSEE</span>
        <h2>Udara kita.<br />Masa depan kita.</h2>
        <p>Kenali udara di sekitarmu, lindungi diri, dan jadi bagian dari perubahan yang lebih baik.</p>
        <div class="auth-art" aria-hidden="true">
          <svg viewBox="0 0 320 160" fill="none">
            <circle cx="244" cy="50" r="28" />
            <path d="M12 75h170c40 0 40-50 10-50-18 0-24 12-24 22M12 100h242c45 0 45 48 13 48-17 0-24-12-24-22M12 125h118c29 0 29 26 10 26" />
          </svg>
          <span>NAPAS KECIL. DAMPAK BESAR.</span>
        </div>
        <div class="auth-story-bottom">
          <span>01 / PANTAU</span><span>02 / PAHAMI</span><span>03 / PEDULI</span>
        </div>
      </section>

      <section class="auth-card" aria-labelledby="auth-title">
        <span class="eyebrow">
          <template v-if="isForgot">PEMULIHAN KATA SANDI</template>
          <template v-else-if="isRegister">MULAI LANGKAH BAIKMU</template>
          <template v-else>SELAMAT DATANG KEMBALI</template>
        </span>
        <h1 id="auth-title">
          <template v-if="isForgot">Atur Ulang Kata Sandi.</template>
          <template v-else-if="isRegister">Bergabung di PoluSee.</template>
          <template v-else>Masuk ke PoluSee.</template>
        </h1>
        <p>
          <template v-if="isForgot">
            Masukkan email terdaftar dan kata sandi baru untuk memulihkan akses akun Anda.
          </template>
          <template v-else-if="isRegister">
            Lebih peduli udara, mulai dari dirimu.
          </template>
          <template v-else>
            Pantau udara dan lanjutkan jejak kepedulianmu.
          </template>
        </p>

        <!-- Kredensial Default Cepat untuk User & Admin (Hanya tampil di form login) -->
        <div v-if="isLogin" class="mb-4 rounded-xl border border-[#285765]/25 bg-[#285765]/5 p-3">
          <div class="flex items-center justify-between text-[11px] font-bold text-[#285765] uppercase tracking-wider mb-2">
            <span>Kredensial Default Siap Pakai:</span>
            <span class="rounded bg-[#edce7e] px-2 py-0.5 text-[10px] text-[#285765] font-semibold">Tinggal Klik</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              @click="fillUserCredentials"
              class="flex flex-col text-left p-2 rounded-lg border border-[#aeb9ae] bg-white hover:border-[#285765] hover:bg-[#285765]/10 transition cursor-pointer shadow-xs"
            >
              <div class="flex items-center justify-between font-semibold text-[#285765]">
                <span>👤 Akun User</span>
                <span class="text-[10px] text-[#285765] font-normal underline">Klik isi otomatis</span>
              </div>
              <div class="mt-1 font-mono text-[11px] text-[#33443d]">user@polusee.id</div>
              <div class="text-[11px] text-[#66756f]">Password: <span class="font-mono font-bold text-[#285765]">user123</span></div>
            </button>

            <button
              type="button"
              @click="fillAdminCredentials"
              class="flex flex-col text-left p-2 rounded-lg border border-[#aeb9ae] bg-white hover:border-[#285765] hover:bg-[#285765]/10 transition cursor-pointer shadow-xs"
            >
              <div class="flex items-center justify-between font-semibold text-[#285765]">
                <span>🛡️ Akun Admin</span>
                <span class="text-[10px] text-[#285765] font-normal underline">Klik isi otomatis</span>
              </div>
              <div class="mt-1 font-mono text-[11px] text-[#33443d]">admin@polusee.id</div>
              <div class="text-[11px] text-[#66756f]">Password: <span class="font-mono font-bold text-[#285765]">admin123</span></div>
            </button>
          </div>
        </div>

        <form :key="mode" @submit.prevent="handleSubmit">
          <label v-if="isRegister" class="form-label">
            Nama lengkap
            <input
              v-model="nameInput"
              name="name"
              autocomplete="name"
              placeholder="Nama lengkapmu"
              required
              maxlength="100"
            />
          </label>

          <label class="form-label">
            Email terdaftar
            <input
              v-model="emailInput"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="nama@email.com"
              required
            />
          </label>

          <label class="form-label">
            {{ isForgot ? 'Kata sandi baru' : 'Kata sandi' }}
            <div class="auth-password">
              <input
                v-model="passwordInput"
                name="password"
                :type="visible ? 'text' : 'password'"
                :autocomplete="isRegister || isForgot ? 'new-password' : 'current-password'"
                :placeholder="isRegister || isForgot ? 'Minimal 6 karakter' : 'Masukkan kata sandi'"
                minlength="6"
                required
              />
              <button type="button" :aria-pressed="visible" @click="visible = !visible">
                {{ visible ? 'Sembunyikan' : 'Tampilkan' }}
              </button>
            </div>
          </label>

          <!-- Link Lupa Kata Sandi (Khusus Tampilan Login) -->
          <div v-if="isLogin" class="flex justify-end -mt-3 mb-3">
            <button
              type="button"
              class="text-xs text-[#285765] hover:underline font-semibold cursor-pointer"
              @click="navigate('forgot')"
            >
              Lupa kata sandi?
            </button>
          </div>

          <label v-if="isRegister || isForgot" class="form-label">
            Konfirmasi kata sandi baru
            <input
              v-model="confirmPasswordInput"
              name="confirmPassword"
              :type="visible ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Ulangi kata sandi baru"
              minlength="6"
              required
            />
          </label>

          <p v-if="error" class="auth-message !bg-[#faebeb] !text-[#b53434] !border !border-[#f0b2b2] !p-2.5 !rounded-lg" role="alert">
            ⚠️ {{ error }}
          </p>
          <p v-if="notice" class="auth-message !bg-[#eef8f2] !text-[#23704b] !border !border-[#a8dfc1] !p-2.5 !rounded-lg" role="status">
            ✓ {{ notice }}
          </p>

          <button type="submit" class="primary-button auth-submit cursor-pointer" :disabled="loading">
            <span v-if="loading">Memproses...</span>
            <span v-else>
              <template v-if="isForgot">Simpan Kata Sandi Baru</template>
              <template v-else-if="isRegister">Daftar Sekarang</template>
              <template v-else>Masuk ke PoluSee</template>
            </span>
            <span v-if="!loading" aria-hidden="true">→</span>
          </button>
        </form>

        <div class="auth-switch">
          <template v-if="isForgot">
            Ingat kata sandi Anda?
            <button type="button" class="text-link" @click="navigate('login')">
              Masuk di sini
            </button>
          </template>
          <template v-else-if="isRegister">
            Sudah punya akun?
            <button type="button" class="text-link" @click="navigate('login')">
              Masuk di sini
            </button>
          </template>
          <template v-else>
            Baru di PoluSee?
            <button type="button" class="text-link" @click="navigate('register')">
              Daftar sekarang
            </button>
          </template>
        </div>

        <p class="auth-demo">
          Mode demo · Terhubung ke layanan autentikasi Express.js &amp; PostgreSQL (fallback demo otomatis jika server lokal belum aktif).
        </p>

        <button class="admin-entry" aria-label="Masuk sebagai admin" title="Akses admin" @click="emit('admin')">
          <svg width="42" height="42" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M10 33v-7a22 22 0 0 1 44 0v7" stroke="currentColor" stroke-width="4" />
            <rect x="6" y="25" width="8" height="15" rx="3" fill="currentColor" />
            <rect x="50" y="25" width="8" height="15" rx="3" fill="currentColor" />
            <circle cx="32" cy="27" r="15" fill="currentColor" opacity=".25" />
            <path d="M19 25c8 1 16 9 26 6v3a13 13 0 0 1-26 0Z" fill="currentColor" />
            <path d="M8 60v-6c0-10 9-16 24-16s24 6 24 16v6Z" fill="currentColor" />
            <path d="M53 39c0 8-6 10-13 10" stroke="currentColor" stroke-width="3" />
          </svg>
          <span>AKSES ADMIN</span>
        </button>
      </section>
    </main>
    <div class="auth-footer">© 2025 PoluSee · Udara lebih baik, hidup lebih baik.</div>
  </div>
</template>
