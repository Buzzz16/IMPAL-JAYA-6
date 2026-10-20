<script setup>
defineProps({
  kind: {
    type: String,
    default: 'sun',
  },
});
</script>

<template>
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <template v-if="kind === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
    </template>
    <template v-else-if="kind === 'wind'">
      <path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6" />
    </template>
    <template v-else-if="kind === 'pressure' || kind === 'barometer'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
      <circle cx="12" cy="12" r="1.5" />
    </template>
    <template v-else>
      <path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z" />
      <path d="M8 15a4 4 0 0 0 4 4" />
    </template>
  </svg>
</template>
